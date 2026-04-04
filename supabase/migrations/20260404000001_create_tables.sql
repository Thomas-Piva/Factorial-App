-- =============================================================================
-- Migration: create_tables
-- Description: Core schema for Factorial App - Gestione Turni PWA.
--              Tables are created in dependency order:
--              store -> user -> store_membership -> shift_template
--              -> shift_assignment -> notification
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared helper: updated_at trigger function
-- Used by every table that carries an updated_at column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLE: store
-- Represents a physical store / location.
-- =============================================================================
CREATE TABLE IF NOT EXISTS store (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  -- Human-readable short code used in URLs and exports, e.g. "MIL01"
  code       text        UNIQUE NOT NULL,
  address    text,
  city       text,
  phone      text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  store            IS 'Physical store locations.';
COMMENT ON COLUMN store.code       IS 'Short unique identifier used in exports and URLs (e.g. MIL01).';
COMMENT ON COLUMN store.is_active  IS 'Soft-disable flag; inactive stores are hidden from scheduling UI.';

CREATE TRIGGER trg_store_updated_at
  BEFORE UPDATE ON store
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- TABLE: user
-- Application profile linked 1-to-1 with auth.users.
-- The id mirrors auth.users.id so no separate FK join is needed for auth.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "user" (
  id             uuid  PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email          text  UNIQUE NOT NULL,
  first_name     text  NOT NULL,
  last_name      text  NOT NULL,
  preferred_name text,
  -- Free-form, e.g. "they/them", stored as user supplied text.
  pronouns       text  CHECK (char_length(pronouns) <= 50),
  birth_date     date,
  -- Legal gender kept separate from pronouns; free-form to accommodate
  -- all legal categories across jurisdictions.
  legal_gender   text  CHECK (char_length(legal_gender) <= 50),
  avatar_url     text,
  -- Application role. Only managers can change this field (enforced by trigger).
  role           text  NOT NULL DEFAULT 'employee'
                       CHECK (role IN ('employee', 'manager', 'admin')),
  admission_date date,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- initials are computed client-side from first_name / last_name.

COMMENT ON TABLE  "user"                IS 'Application-level user profile; mirrors auth.users 1-to-1.';
COMMENT ON COLUMN "user".role           IS 'App role: employee | manager | admin. Protected from self-modification by trg_user_protect_role.';
COMMENT ON COLUMN "user".preferred_name IS 'Display name override; falls back to first_name when NULL.';
COMMENT ON COLUMN "user".legal_gender   IS 'Legal gender for HR/payroll documents; not used for display.';

CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- TABLE: store_membership
-- Many-to-many between users and stores.
-- A user can belong to multiple stores; is_primary marks the default one.
-- =============================================================================
CREATE TABLE IF NOT EXISTS store_membership (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES "user"  (id) ON DELETE CASCADE,
  store_id   uuid        NOT NULL REFERENCES store    (id) ON DELETE CASCADE,
  -- Only one primary store per user is enforced application-side.
  is_primary boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

COMMENT ON TABLE  store_membership            IS 'Assigns users to one or more stores.';
COMMENT ON COLUMN store_membership.is_primary IS 'Marks the default store shown on login.';

-- =============================================================================
-- TABLE: shift_template
-- Reusable shift definitions owned by a store.
-- =============================================================================
CREATE TABLE IF NOT EXISTS shift_template (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL REFERENCES store  (id) ON DELETE CASCADE,
  created_by uuid        NOT NULL REFERENCES "user" (id),
  name       text        NOT NULL,
  -- Allowed values mirror the SHIFT_ASSIGNMENT.shift_type enum.
  shift_type text        NOT NULL
                         CHECK (shift_type IN (
                           'work_shift', 'rest_day', 'holiday',
                           'transfer', 'permission'
                         )),
  -- NULL start/end_time is valid for all-day types (rest_day, holiday, etc.).
  start_time time,
  end_time   time,
  -- CSS hex color or named color token used in the calendar UI.
  color      text        NOT NULL CHECK (char_length(color) <= 30),
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_shift_template_times
    CHECK (
      (shift_type = 'work_shift' AND start_time IS NOT NULL AND end_time IS NOT NULL)
      OR shift_type <> 'work_shift'
    )
);

COMMENT ON TABLE  shift_template            IS 'Reusable shift definitions; managers create these per store.';
COMMENT ON COLUMN shift_template.shift_type IS 'work_shift | rest_day | holiday | transfer | permission';
COMMENT ON COLUMN shift_template.color      IS 'Calendar color token (CSS hex or design-system name).';

CREATE TRIGGER trg_shift_template_updated_at
  BEFORE UPDATE ON shift_template
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- TABLE: shift_assignment
-- A concrete shift assigned to a user on a specific date.
-- NO unique constraint on (user_id, date) — split shifts (orari spezzati)
-- require multiple rows per user per day.
-- =============================================================================
CREATE TABLE IF NOT EXISTS shift_assignment (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES "user"  (id) ON DELETE CASCADE,
  store_id    uuid        NOT NULL REFERENCES store    (id) ON DELETE CASCADE,
  -- NULL template_id means the assignment was created ad-hoc.
  template_id uuid                 REFERENCES shift_template (id) ON DELETE SET NULL,
  created_by  uuid        NOT NULL REFERENCES "user"  (id),
  date        date        NOT NULL,
  shift_type  text        NOT NULL
                          CHECK (shift_type IN (
                            'work_shift', 'rest_day', 'holiday',
                            'transfer', 'permission'
                          )),
  -- Human-readable label shown in the calendar cell (e.g. "M", "Riposo").
  label       text        NOT NULL,
  start_time  time,
  end_time    time,
  -- Hex/token color copied from template at assignment time for immutability.
  color       text        NOT NULL CHECK (char_length(color) <= 30),
  -- NULL = draft; NOT NULL = published and visible to the employee.
  published_at timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_shift_assignment_times
    CHECK (
      (shift_type = 'work_shift' AND start_time IS NOT NULL AND end_time IS NOT NULL)
      OR shift_type <> 'work_shift'
    )
);

COMMENT ON TABLE  shift_assignment              IS 'Concrete shift assigned to a user on a date. Multiple rows per (user, date) are allowed for split shifts.';
COMMENT ON COLUMN shift_assignment.published_at IS 'NULL = draft (employee cannot see it); NOT NULL = published.';
COMMENT ON COLUMN shift_assignment.template_id  IS 'Source template; NULL for ad-hoc assignments.';
COMMENT ON COLUMN shift_assignment.color        IS 'Copied from template at creation time to preserve history if template changes.';

CREATE TRIGGER trg_shift_assignment_updated_at
  BEFORE UPDATE ON shift_assignment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- TABLE: notification
-- In-app notifications pushed to individual users.
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  -- NULL created_by = system-generated notification.
  created_by uuid                 REFERENCES "user" (id) ON DELETE SET NULL,
  type       text        NOT NULL
                         CHECK (type IN (
                           'shift_published', 'absence_approved',
                           'communication', 'new_shift'
                         )),
  title      text        NOT NULL CHECK (char_length(title) <= 200),
  body       text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
  -- No updated_at: notifications are append-only except for is_read toggling.
);

COMMENT ON TABLE  notification            IS 'In-app notifications; append-only except for is_read.';
COMMENT ON COLUMN notification.created_by IS 'NULL for system-generated notifications (e.g. automated reminders).';
COMMENT ON COLUMN notification.type       IS 'shift_published | absence_approved | communication | new_shift';
