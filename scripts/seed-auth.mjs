#!/usr/bin/env node
/**
 * seed-auth.js — Utility di verifica post-reset
 *
 * Verifica che gli utenti del seed riescano ad autenticarsi dopo
 * `supabase db reset`. In caso di fallimento stampa suggerimenti diagnostici.
 *
 * Uso:
 *   node scripts/seed-auth.js
 *   npm run db:reset   (esegue reset + questo script)
 *
 * -------------------------------------------------------------------------
 * NOTA TECNICA - Perché il seed SQL funziona ora
 * -------------------------------------------------------------------------
 * GoTrue richiede in auth.users i seguenti campi non-NULL oltre alla password:
 *   - instance_id  = '00000000-0000-0000-0000-000000000000'  (nil UUID)
 *   - confirmation_token, recovery_token, email_change_token_new, email_change = ''
 *
 * Se instance_id è NULL → GoTrue non trova l'utente (updateUserById = 404)
 * Se confirmation_token è NULL → GoTrue crasha con "converting NULL to string"
 *
 * Il seed.sql imposta tutti questi campi correttamente.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const USERS = [
  { email: "marco.rossi@factorial.test",    password: "Dev1234!",    role: "manager"  },
  { email: "giulia.bianchi@factorial.test", password: "Dev1234!",    role: "employee" },
  { email: "luca.ferrari@factorial.test",   password: "Dev1234!",    role: "employee" },
  { email: "test@example.com",              password: "password123", role: "employee" },
];

async function main() {
  const client = createClient(SUPABASE_URL, ANON_KEY);

  console.log("Verifica login utenti seed...\n");
  let allOk = true;

  for (const user of USERS) {
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    await client.auth.signOut();

    if (error) {
      console.error(`  FAIL  ${user.email}: ${error.message}`);
      allOk = false;
    } else {
      console.log(`  OK    ${user.email}  [${user.role}]`);
    }
  }

  console.log(allOk ? "\nTutti gli utenti sono autenticabili." : "\nAlcuni utenti non funzionano. Eseguire: supabase db reset");
  if (!allOk) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
