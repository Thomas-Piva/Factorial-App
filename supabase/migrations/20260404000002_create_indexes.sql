-- =============================================================================
-- Migration: create_indexes
-- Description: Performance indexes for Factorial App.
--
-- Index strategy:
--   - All FK columns are indexed (mandatory, no exceptions).
--   - Composite indexes are ordered: equality predicates first, then range.
--   - Partial indexes are used where filtering on is_active / is_read / published_at
--     is the dominant query pattern.
--   - Covering indexes (INCLUDE) are added where an extra column is fetched
--     immediately after the index lookup, avoiding a heap fetch.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- store_membership
-- Both FK columns need independent indexes for FK lookups and for queries
-- that enumerate members of a store or stores of a user.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_store_membership_user
  ON store_membership (user_id);

CREATE INDEX IF NOT EXISTS idx_store_membership_store
  ON store_membership (store_id);

-- ---------------------------------------------------------------------------
-- shift_template
-- Queries always filter by store first; is_active partial index speeds up
-- the common "list active templates for store" dropdown query.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shift_template_store
  ON shift_template (store_id);

CREATE INDEX IF NOT EXISTS idx_shift_template_store_active
  ON shift_template (store_id)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- shift_assignment — primary query paths
--
-- 1. Calendar view: all assignments for a store in a date range.
--    Composite (store_id, date) covers the WHERE clause; user_id is INCLUDEd
--    to cover the common SELECT columns without a heap fetch.
-- 2. Employee view: a user's own schedule for a date range.
--    Composite (user_id, date) with store_id INCLUDE.
-- 3. Shift-type filter (e.g. "show all absences for a store/period").
--    Standalone index on shift_type; combine with idx_shift_assignment_store_date
--    at the planner level.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shift_assignment_store_date
  ON shift_assignment (store_id, date)
  INCLUDE (user_id, shift_type, published_at);

CREATE INDEX IF NOT EXISTS idx_shift_assignment_user_date
  ON shift_assignment (user_id, date)
  INCLUDE (store_id, shift_type, published_at);

CREATE INDEX IF NOT EXISTS idx_shift_assignment_type
  ON shift_assignment (shift_type);

-- Partial index: draft assignments (published_at IS NULL) are queried by
-- managers when reviewing the schedule before publishing.
CREATE INDEX IF NOT EXISTS idx_shift_assignment_drafts
  ON shift_assignment (store_id, date)
  WHERE published_at IS NULL;

-- FK indexes on created_by and template_id to avoid sequential scans
-- when cascading or joining back to the source rows.
CREATE INDEX IF NOT EXISTS idx_shift_assignment_template
  ON shift_assignment (template_id)
  WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shift_assignment_created_by
  ON shift_assignment (created_by);

-- ---------------------------------------------------------------------------
-- shift_template FK back-references
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shift_template_created_by
  ON shift_template (created_by);

-- ---------------------------------------------------------------------------
-- notification
-- Primary query: "all unread notifications for user X" ordered by created_at.
-- Composite (user_id, is_read) with created_at INCLUDE supports both the
-- count badge (WHERE is_read = false) and the notification list.
-- Partial index on unread rows keeps it small for the hot path.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notification_user_read
  ON notification (user_id, is_read)
  INCLUDE (created_at, type);

CREATE INDEX IF NOT EXISTS idx_notification_user_unread
  ON notification (user_id, created_at DESC)
  WHERE is_read = false;

-- FK index for created_by on notification.
CREATE INDEX IF NOT EXISTS idx_notification_created_by
  ON notification (created_by)
  WHERE created_by IS NOT NULL;

-- ---------------------------------------------------------------------------
-- user
-- email is already covered by the UNIQUE constraint index.
-- is_active partial index supports the "list active employees" query.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_active
  ON "user" (is_active)
  WHERE is_active = true;

-- role index supports the is_manager() helper and any role-based filters.
CREATE INDEX IF NOT EXISTS idx_user_role
  ON "user" (role);
