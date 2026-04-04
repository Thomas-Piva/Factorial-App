-- =============================================================================
-- Migration: enable_rls
-- Description: Enables Row Level Security on all application tables and
--              creates the access policies.  Also installs the trigger that
--              prevents a non-manager user from escalating their own role.
--
-- Policy conventions:
--   - Every USING clause that calls auth.uid() wraps it in (SELECT auth.uid())
--     so Postgres evaluates it once per statement, not once per row.
--   - is_manager() is a STABLE SECURITY DEFINER function (see migration 03)
--     and is likewise evaluated once per statement when used in a policy.
--   - Policies are named <table>_<operation>[_<qualifier>] for clarity.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on every application table
-- ---------------------------------------------------------------------------
ALTER TABLE store            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_template   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification     ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (avoids accidental bypasses during
-- local development when connected as the supabase_admin role).
ALTER TABLE store            FORCE ROW LEVEL SECURITY;
ALTER TABLE "user"           FORCE ROW LEVEL SECURITY;
ALTER TABLE store_membership FORCE ROW LEVEL SECURITY;
ALTER TABLE shift_template   FORCE ROW LEVEL SECURITY;
ALTER TABLE shift_assignment FORCE ROW LEVEL SECURITY;
ALTER TABLE notification     FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- STORE policies
-- =============================================================================

-- Any authenticated user can read stores (needed to build store pickers).
CREATE POLICY store_select ON store
  FOR SELECT TO authenticated
  USING (true);

-- Only managers / admins can insert, update, or delete stores.
-- A single ALL policy covers INSERT / UPDATE / DELETE / TRUNCATE.
CREATE POLICY store_manage ON store
  FOR ALL TO authenticated
  USING (is_manager())
  WITH CHECK (is_manager());

-- =============================================================================
-- USER policies
-- =============================================================================

-- Any authenticated user can read profiles (needed for scheduling UI to show
-- names and avatars).
CREATE POLICY user_select ON "user"
  FOR SELECT TO authenticated
  USING (true);

-- An employee can update their own profile (avatar, preferred_name, etc.).
-- The role field is protected separately by the trigger below.
CREATE POLICY user_update_own ON "user"
  FOR UPDATE TO authenticated
  USING     (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- A manager can update any user profile (e.g. set admission_date, is_active).
CREATE POLICY user_update_manager ON "user"
  FOR UPDATE TO authenticated
  USING     (is_manager())
  WITH CHECK (is_manager());

-- Only managers can insert new user rows (profile creation after signup).
CREATE POLICY user_insert_manager ON "user"
  FOR INSERT TO authenticated
  WITH CHECK (is_manager());

-- Only managers can deactivate / delete users.
CREATE POLICY user_delete_manager ON "user"
  FOR DELETE TO authenticated
  USING (is_manager());

-- =============================================================================
-- STORE_MEMBERSHIP policies
-- =============================================================================

-- All authenticated users can see memberships (required for shift filtering).
CREATE POLICY membership_select ON store_membership
  FOR SELECT TO authenticated
  USING (true);

-- Only managers manage memberships.
CREATE POLICY membership_manage ON store_membership
  FOR ALL TO authenticated
  USING     (is_manager())
  WITH CHECK (is_manager());

-- =============================================================================
-- SHIFT_TEMPLATE policies
-- =============================================================================

-- All authenticated users can read templates (needed for the assignment form).
CREATE POLICY template_select ON shift_template
  FOR SELECT TO authenticated
  USING (true);

-- Managers create / update / delete templates.
CREATE POLICY template_insert ON shift_template
  FOR INSERT TO authenticated
  WITH CHECK (is_manager());

CREATE POLICY template_update ON shift_template
  FOR UPDATE TO authenticated
  USING     (is_manager())
  WITH CHECK (is_manager());

CREATE POLICY template_delete ON shift_template
  FOR DELETE TO authenticated
  USING (is_manager());

-- =============================================================================
-- SHIFT_ASSIGNMENT policies
-- =============================================================================

-- An employee can see assignments only for stores they belong to.
-- The sub-select is evaluated once per statement and uses the indexed
-- (user_id) column on store_membership.
CREATE POLICY assignment_select ON shift_assignment
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT store_id
      FROM store_membership
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Only managers can create / modify / delete assignments.
CREATE POLICY assignment_insert ON shift_assignment
  FOR INSERT TO authenticated
  WITH CHECK (is_manager());

CREATE POLICY assignment_update ON shift_assignment
  FOR UPDATE TO authenticated
  USING     (is_manager())
  WITH CHECK (is_manager());

CREATE POLICY assignment_delete ON shift_assignment
  FOR DELETE TO authenticated
  USING (is_manager());

-- =============================================================================
-- NOTIFICATION policies
-- =============================================================================

-- Users can only read their own notifications.
CREATE POLICY notification_select ON notification
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can only mark their own notifications as read (is_read toggle).
CREATE POLICY notification_update ON notification
  FOR UPDATE TO authenticated
  USING     (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Only managers (or the system via service_role) can create notifications.
CREATE POLICY notification_insert ON notification
  FOR INSERT TO authenticated
  WITH CHECK (is_manager());

-- Users cannot delete notifications; deletion is reserved for service_role
-- (e.g. a background cleanup job).  No DELETE policy for authenticated role.

-- =============================================================================
-- TRIGGER: protect the role field from self-escalation
-- =============================================================================
-- Prevents a non-manager from changing their own role column.
-- This is needed because user_update_own allows broad UPDATE access so that
-- employees can update other profile fields (avatar, preferred_name, etc.).
-- Without this guard a malicious client could include role = 'manager' in
-- the UPDATE payload.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_user_protect_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the role is unchanged, nothing to check.
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- Allow the change only when the caller is a manager or admin.
  IF NOT is_manager() THEN
    RAISE EXCEPTION
      'permission denied: only managers can change the role field'
      USING ERRCODE = '42501';  -- insufficient_privilege
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_user_protect_role() IS
  'Trigger guard: blocks non-manager users from escalating their own role '
  'via a direct UPDATE on the user table.';

CREATE TRIGGER trg_user_protect_role
  BEFORE UPDATE OF role ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_user_protect_role();

-- =============================================================================
-- Public schema permissions
-- =============================================================================
-- Revoke default CREATE privilege from the public role on the public schema.
-- Application users should only access objects explicitly granted to them.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
