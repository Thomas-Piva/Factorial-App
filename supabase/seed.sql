-- =============================================================================
-- Seed: dati di sviluppo per Factorial App
-- =============================================================================
-- Questo file viene caricato da `supabase db reset` dopo tutte le migrazioni.
-- È SOLO per sviluppo locale / CI; non eseguire mai in produzione.
--
-- Ordine di esecuzione (rispetta le dipendenze FK):
--   auth.users -> auth.identities -> user -> store -> store_membership
--   -> shift_template -> shift_assignment -> notification
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Disabilita il trigger di protezione del ruolo durante il seeding,
-- così possiamo impostare i ruoli direttamente senza passare per il flusso
-- di autenticazione del manager.
-- ---------------------------------------------------------------------------
ALTER TABLE "user" DISABLE TRIGGER trg_user_protect_role;

-- ===========================================================================
-- SEZIONE 1: auth.users
-- Inserisce le righe stub nella tabella di autenticazione di Supabase.
-- Le password vengono hashate con bcrypt (compatibile con GoTrue).
-- email_confirmed_at è impostato a now() per considerare l'email verificata.
-- ===========================================================================
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  aud,
  role
)
VALUES
  -- -------------------------------------------------------------------------
  -- Utente di test generico: test@example.com / password123
  -- UUID deterministico: 00000000-0000-0000-0000-000000000000
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000000',
   'test@example.com',
   crypt('password123', gen_salt('bf')),
   now(),
   '{"provider": "email", "providers": ["email"]}',
   '{}',
   false,
   now(), now(),
   'authenticated',
   'authenticated'),

  -- -------------------------------------------------------------------------
  -- Manager: Marco Rossi
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000001',
   'marco.rossi@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(),
   '{"provider": "email", "providers": ["email"]}',
   '{}',
   false,
   now(), now(),
   'authenticated',
   'authenticated'),

  -- -------------------------------------------------------------------------
  -- Dipendente: Giulia Bianchi
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000002',
   'giulia.bianchi@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(),
   '{"provider": "email", "providers": ["email"]}',
   '{}',
   false,
   now(), now(),
   'authenticated',
   'authenticated'),

  -- -------------------------------------------------------------------------
  -- Dipendente: Luca Ferrari
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000003',
   'luca.ferrari@factorial.test',
   crypt('Dev1234!', gen_salt('bf')),
   now(),
   '{"provider": "email", "providers": ["email"]}',
   '{}',
   false,
   now(), now(),
   'authenticated',
   'authenticated')

ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- SEZIONE 2: auth.identities
-- Obbligatoria per far funzionare signInWithPassword con il provider "email".
-- Senza questa riga, GoTrue non trova l'identità e il login fallisce.
--
-- Campi chiave:
--   provider_id  = l'email dell'utente (identificatore univoco per "email")
--   provider     = 'email'
--   identity_data = JSON con sub (= user id) e la email
--   user_id      = riferimento a auth.users.id
-- ===========================================================================
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  -- -------------------------------------------------------------------------
  -- Identità email per test@example.com
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000000',
   'test@example.com',
   'email',
   jsonb_build_object(
     'sub',           '00000000-0000-0000-0000-000000000000',
     'email',         'test@example.com',
     'email_verified', true,
     'phone_verified', false
   ),
   now(), now(), now()),

  -- -------------------------------------------------------------------------
  -- Identità email per marco.rossi@factorial.test
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'marco.rossi@factorial.test',
   'email',
   jsonb_build_object(
     'sub',           '00000000-0000-0000-0000-000000000001',
     'email',         'marco.rossi@factorial.test',
     'email_verified', true,
     'phone_verified', false
   ),
   now(), now(), now()),

  -- -------------------------------------------------------------------------
  -- Identità email per giulia.bianchi@factorial.test
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'giulia.bianchi@factorial.test',
   'email',
   jsonb_build_object(
     'sub',           '00000000-0000-0000-0000-000000000002',
     'email',         'giulia.bianchi@factorial.test',
     'email_verified', true,
     'phone_verified', false
   ),
   now(), now(), now()),

  -- -------------------------------------------------------------------------
  -- Identità email per luca.ferrari@factorial.test
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'luca.ferrari@factorial.test',
   'email',
   jsonb_build_object(
     'sub',           '00000000-0000-0000-0000-000000000003',
     'email',         'luca.ferrari@factorial.test',
     'email_verified', true,
     'phone_verified', false
   ),
   now(), now(), now())

ON CONFLICT (provider, provider_id) DO NOTHING;

-- ===========================================================================
-- SEZIONE 3: public.user (profili applicativi)
-- Ogni riga è collegata 1-a-1 con auth.users tramite lo stesso UUID.
-- ===========================================================================
INSERT INTO "user" (id, email, first_name, last_name, role, admission_date, is_active)
VALUES
  -- -------------------------------------------------------------------------
  -- Profilo per l'utente di test generico
  -- Ruolo 'employee' di default; modificabile dal manager dopo il login.
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000000',
   'test@example.com',
   'Test', 'User',
   'employee',
   '2026-01-01',
   true),

  -- -------------------------------------------------------------------------
  -- Profilo Manager
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000001',
   'marco.rossi@factorial.test',
   'Marco', 'Rossi',
   'manager',
   '2020-01-15',
   true),

  -- -------------------------------------------------------------------------
  -- Profilo Dipendente 1
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000002',
   'giulia.bianchi@factorial.test',
   'Giulia', 'Bianchi',
   'employee',
   '2021-06-01',
   true),

  -- -------------------------------------------------------------------------
  -- Profilo Dipendente 2
  -- -------------------------------------------------------------------------
  ('00000000-0000-0000-0000-000000000003',
   'luca.ferrari@factorial.test',
   'Luca', 'Ferrari',
   'employee',
   '2022-03-10',
   true)

ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- SEZIONE 4: store (punti vendita)
-- ===========================================================================
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

-- ===========================================================================
-- SEZIONE 5: store_membership
-- Assegna gli utenti ai punti vendita.
-- Marco (manager) appartiene a entrambi i negozi.
-- Giulia, Luca e Test User appartengono a MIL01 come negozio primario.
-- ===========================================================================
INSERT INTO store_membership (user_id, store_id, is_primary)
VALUES
  -- Test User: primario MIL01
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', true),

  -- Marco: primario MIL01, secondario ROM01
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', false),

  -- Giulia: primario MIL01
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', true),

  -- Luca: primario MIL01
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', true)

ON CONFLICT (user_id, store_id) DO NOTHING;

-- ===========================================================================
-- SEZIONE 6: shift_template (modelli turno per MIL01)
-- ===========================================================================
INSERT INTO shift_template (id, store_id, created_by, name, shift_type, start_time, end_time, color, is_active)
VALUES
  -- Turno mattina
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Mattina', 'work_shift',
   '08:00', '14:00',
   '#4CAF50', true),

  -- Turno pomeriggio
  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Pomeriggio', 'work_shift',
   '14:00', '20:00',
   '#2196F3', true),

  -- Giornata intera
  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Giornata intera', 'work_shift',
   '09:00', '18:00',
   '#FF9800', true),

  -- Riposo (nessun orario)
  ('20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Riposo', 'rest_day',
   NULL, NULL,
   '#9E9E9E', true),

  -- Ferie (nessun orario)
  ('20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Ferie', 'holiday',
   NULL, NULL,
   '#E91E63', true),

  -- Permesso (nessun orario)
  ('20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Permesso', 'permission',
   NULL, NULL,
   '#9C27B0', true)

ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- SEZIONE 7: shift_assignment
-- Settimana pubblicata per Giulia a MIL01 (06-12 Aprile 2026).
-- Turno bozza (non pubblicato) per Luca.
-- ===========================================================================
INSERT INTO shift_assignment (
  user_id, store_id, template_id, created_by,
  date, shift_type, label, start_time, end_time, color,
  published_at
)
VALUES
  -- Lunedì: mattina
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-06', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   now()),

  -- Martedì: pomeriggio
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-07', 'work_shift', 'P', '14:00', '20:00', '#2196F3',
   now()),

  -- Mercoledì: riposo
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-08', 'rest_day', 'R', NULL, NULL, '#9E9E9E',
   now()),

  -- Giovedì: mattina
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-09', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   now()),

  -- Venerdì: giornata intera
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-10', 'work_shift', 'G', '09:00', '18:00', '#FF9800',
   now()),

  -- Sabato: pomeriggio
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-11', 'work_shift', 'P', '14:00', '20:00', '#2196F3',
   now()),

  -- Domenica: riposo
  ('00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-12', 'rest_day', 'R', NULL, NULL, '#9E9E9E',
   now()),

  -- Turno bozza per Luca (published_at NULL = non visibile al dipendente)
  ('00000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-04-07', 'work_shift', 'M', '08:00', '14:00', '#4CAF50',
   NULL)

ON CONFLICT DO NOTHING;

-- ===========================================================================
-- SEZIONE 8: notification (notifiche di esempio per Giulia)
-- ===========================================================================
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
-- Riabilita il trigger di protezione del ruolo
-- ---------------------------------------------------------------------------
ALTER TABLE "user" ENABLE TRIGGER trg_user_protect_role;
