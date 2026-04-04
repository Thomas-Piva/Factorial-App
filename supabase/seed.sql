-- =============================================================================
-- Seed: development data for Factorial App
-- =============================================================================
-- This file is loaded by `supabase db reset` after all migrations.
-- It is ONLY for local development / CI; never run against production.
--
-- Execution order mirrors FK dependencies:
--   auth.users -> user -> store -> store_membership
--   -> shift_template -> shift_assignment -> notification
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Disable the role-protection trigger during seeding so we can set roles
-- directly without going through manager-auth dance.
-- ---------------------------------------------------------------------------
ALTER TABLE "user" DISABLE TRIGGER trg_user_protect_role;

-- ---------------------------------------------------------------------------
-- auth.users
-- Insert stub auth rows.  Supabase local dev accepts direct inserts here.
-- Passwords are irrelevant for seed data; use the Supabase Studio UI or
-- `supabase auth` CLI to log in during development.
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  -- Manager
  ('00000000-0000-0000-0000-000000000001',
   'marco.rossi@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(), now(), now()),

  -- Employees
  ('00000000-0000-0000-0000-000000000002',
   'giulia.bianchi@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(), now(), now()),

  ('00000000-0000-0000-0000-000000000003',
   'luca.ferrari@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(), now(), now())

ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- user (application profiles)
-- ---------------------------------------------------------------------------
INSERT INTO "user" (id, email, first_name, last_name, role, admission_date, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'marco.rossi@factorial.test',
   'Marco', 'Rossi',
   'manager',
   '2020-01-15',
   true),

  ('00000000-0000-0000-0000-000000000002',
   'giulia.bianchi@factorial.test',
   'Giulia', 'Bianchi',
   'employee',
   '2021-06-01',
   true),

  ('00000000-0000-0000-0000-000000000003',
   'luca.ferrari@factorial.test',
   'Luca', 'Ferrari',
   'employee',
   '2022-03-10',
   true)

ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- store
-- ---------------------------------------------------------------------------
INSERT INTO store (id, name, code, address, city, phone, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   'Punto Vendita Milano Centro',
   'MIL01',
   'Via Torino, 14',
   'Milano',
   '+39 02 1234567',
   true),

  ('10000000-0000-0000-0000-000000000002',
   'Punto Vendita Roma Prati',
   'ROM01',
   'Viale Giulio Cesare, 88',
   'Roma',
   '+39 06 9876543',
   true)

ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- store_membership
-- Marco (manager) belongs to both stores.
-- Giulia and Luca belong to MIL01 as primary.
-- ---------------------------------------------------------------------------
INSERT INTO store_membership (user_id, store_id, is_primary)
VALUES
  -- Marco: primary MIL01, secondary ROM01
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', false),

  -- Giulia: primary MIL01
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', true),

  -- Luca: primary MIL01
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', true)

ON CONFLICT (user_id, store_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- shift_template (MIL01)
-- ---------------------------------------------------------------------------
INSERT INTO shift_template (id, store_id, created_by, name, shift_type, start_time, end_time, color, is_active)
VALUES
  -- Morning shift
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Mattina', 'work_shift',
   '08:00', '14:00',
   '#4CAF50', true),

  -- Afternoon shift
  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Pomeriggio', 'work_shift',
   '14:00', '20:00',
   '#2196F3', true),

  -- Full day
  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Giornata intera', 'work_shift',
   '09:00', '18:00',
   '#FF9800', true),

  -- Rest day (no times)
  ('20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Riposo', 'rest_day',
   NULL, NULL,
   '#9E9E9E', true),

  -- Holiday (no times)
  ('20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Ferie', 'holiday',
   NULL, NULL,
   '#E91E63', true),

  -- Permission / short leave (no times)
  ('20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Permesso', 'permission',
   NULL, NULL,
   '#9C27B0', true)

ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- shift_assignment — one published week for Giulia at MIL01
-- Week: 2026-04-06 (Mon) to 2026-04-12 (Sun)
-- ---------------------------------------------------------------------------
INSERT INTO shift_assignment (
  user_id, store_id, template_id, created_by,
  date, shift_type, label, start_time, end_time, color,
  published_at
)
VALUES
  -- Mon: morning
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-06', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   now()),

  -- Tue: afternoon
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-07', 'work_shift', 'P', '14:00', '20:00', '#2196F3',
   now()),

  -- Wed: rest day
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-08', 'rest_day', 'R', NULL, NULL, '#9E9E9E',
   now()),

  -- Thu: morning
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-09', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   now()),

  -- Fri: full day
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-10', 'work_shift', 'G', '09:00', '18:00', '#FF9800',
   now()),

  -- Sat: afternoon
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-11', 'work_shift', 'P', '14:00', '20:00', '#2196F3',
   now()),

  -- Sun: rest day
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-12', 'rest_day', 'R', NULL, NULL, '#9E9E9E',
   now()),

  -- Draft assignment for Luca (not yet published — visible only to managers)
  ('00000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-07', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   NULL)  -- published_at NULL = draft

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- notification — sample notifications for Giulia
-- ---------------------------------------------------------------------------
INSERT INTO notification (user_id, created_by, type, title, body, is_read)
VALUES
  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'shift_published',
   'Turni pubblicati',
   'I tuoi turni per la settimana 06-12 Aprile 2026 sono stati pubblicati.',
   false),

  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'communication',
   'Riunione di team',
   'La riunione mensile si terrà Lunedì 06/04 alle 08:30 prima dell''apertura.',
   true)

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Re-enable the role-protection trigger
-- ---------------------------------------------------------------------------
ALTER TABLE "user" ENABLE TRIGGER trg_user_protect_role;
