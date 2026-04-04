-- =============================================================================
-- Migration: create_functions
-- Description: Database helper functions for Factorial App.
--
--   1. is_manager()          — RLS helper; returns true when the calling user
--                              has role = 'manager' or 'admin'.
--   2. insert_absence_range() — Batch-inserts absence rows for every date in
--                              a calendar range (avoids N+1 round-trips from
--                              the client).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- is_manager()
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: runs with the privileges of the function owner (postgres)
-- so it can read the "user" table even when RLS is active on it.
--
-- STABLE: the result cannot change within a single SQL statement, which lets
-- the planner cache it.  Do NOT mark it IMMUTABLE — auth.uid() changes per
-- session.
--
-- The (SELECT auth.uid()) sub-select pattern is the Supabase-recommended way
-- to call auth.uid() inside RLS policies; it is evaluated once per statement
-- rather than once per row, which is critical for performance on large tables.
-- Although is_manager() is itself called once per statement when used inside
-- a USING/WITH CHECK clause, keeping the same idiom makes the intent clear
-- and prevents regressions if the function body is ever inlined.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public     -- pin search_path to prevent search-path injection
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "user"
    WHERE id   = (SELECT auth.uid())
      AND role IN ('manager', 'admin')
  );
$$;

COMMENT ON FUNCTION is_manager() IS
  'RLS helper: returns true when the authenticated user has role manager or admin. '
  'SECURITY DEFINER so it can bypass RLS on the user table itself.';

-- Restrict execution to authenticated users only; revoke from public.
REVOKE ALL ON FUNCTION is_manager() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_manager() TO authenticated;

-- ---------------------------------------------------------------------------
-- insert_absence_range()
-- ---------------------------------------------------------------------------
-- Inserts one shift_assignment row per calendar day between p_start_date and
-- p_end_date (inclusive) using generate_series to avoid client-side loops.
--
-- Returns the inserted rows so the caller can confirm what was written.
--
-- Security note: this function does NOT carry SECURITY DEFINER; it runs as
-- the calling user.  RLS on shift_assignment (INSERT policy requires
-- is_manager()) therefore still applies naturally.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_absence_range(
  p_user_id    uuid,
  p_store_id   uuid,
  p_created_by uuid,
  p_shift_type text,
  p_label      text,
  p_color      text,
  p_start_date date,
  p_end_date   date
)
RETURNS SETOF shift_assignment
LANGUAGE sql
AS $$
  INSERT INTO shift_assignment (
    user_id, store_id, created_by,
    shift_type, label, color, date
  )
  SELECT
    p_user_id,
    p_store_id,
    p_created_by,
    p_shift_type,
    p_label,
    p_color,
    d::date
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS gs(d)
  RETURNING *;
$$;

COMMENT ON FUNCTION insert_absence_range(uuid, uuid, uuid, text, text, text, date, date) IS
  'Batch-inserts one shift_assignment row per day in [p_start_date, p_end_date]. '
  'Caller must be a manager (enforced by shift_assignment INSERT RLS policy). '
  'Returns the inserted rows.';

REVOKE ALL ON FUNCTION insert_absence_range(uuid, uuid, uuid, text, text, text, date, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION insert_absence_range(uuid, uuid, uuid, text, text, text, date, date) TO authenticated;
