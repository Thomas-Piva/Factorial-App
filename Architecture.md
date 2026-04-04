# Architecture: Factorial App - Gestione Turni PWA

> Documento di architettura di sistema generato dall'analisi del PRD (`piano.md`),
> dei mockup (`Mockup/`), del design system (`Mockup/palette_globale/DESIGN.md`),
> e delle decisioni tecniche confermate dal cliente.

---

## 1. System Overview

| Layer | Tecnologia | Versione | Note |
|-------|-----------|----------|------|
| **Framework** | Next.js (App Router) | 16.x | SSR + API Routes + Vercel deploy nativo |
| **Frontend** | React + TypeScript | React 19 + TS 5.x | Server Components di default |
| **Styling** | Tailwind CSS | 4.x | PostCSS integration, design tokens custom |
| **State (server)** | TanStack Query | 5.x | Cache, background refetch, offline persistence |
| **State (UI)** | Zustand | 5.x | Solo per stato UI ephemero (store filter, week cursor) |
| **Database** | Supabase (PostgreSQL) | — | Managed, RLS, Realtime |
| **Auth** | Supabase Auth | — | Email + Password, PKCE flow |
| **ORM/Client** | @supabase/supabase-js | 2.x | + @supabase/ssr per Next.js |
| **PDF Export** | jsPDF + jsPDF-AutoTable | — | Client-side, dynamic import |
| **PWA** | Serwist (@serwist/next) | — | Service worker, offline calendar |
| **Font** | Manrope (Google Fonts) | — | Design system Botanical Editorial |
| **Deploy** | Vercel | — | Confermato dal cliente |

### Design System: Botanical Editorial

| Token | Valore | Uso |
|-------|--------|-----|
| Primary | `#234428` (Deep Forest Green) | Azioni principali, header |
| Primary Container | `#3a5c3e` | Momenti secondari |
| Secondary | `#4c6450` (Muted Sage) | Azioni secondarie |
| Tertiary | `#2a423a` (Deep Mint/Teal) | Accenti |
| Surface/Background | `#fcf9f4` (Crema) | Sfondo pagine |
| Surface Container | `#f0ede9` | Sezioni, card container |
| On Surface | `#1a1c1a` | Testo primario |
| On Surface Variant | `#424842` | Testo body |
| Font | Manrope | Tutti gli scale |
| Border Radius | `xl` (1.5rem) cards, `full` buttons | NO bordi `sm` o `none` |
| Regola chiave | **NO 1px borders** | Usare tonal shifts e spacing |
| Navigation | Glassmorphism | backdrop-blur 10-15px |

### Ruoli

| Ruolo | Descrizione |
|-------|-------------|
| **Manager** | CRUD turni, gestione assenze, PDF export, notifiche, gestione profili |
| **Dipendente** | Read-only turni propri e colleghi, profilo personale, ricezione notifiche |

---

## 2. Data Model

### 2.1 Schema ER

```
STORE ──< STORE_MEMBERSHIP >── USER
STORE ──< SHIFT_TEMPLATE
USER  ──< SHIFT_TEMPLATE (created_by)
USER  ──< SHIFT_ASSIGNMENT (user_id)
USER  ──< SHIFT_ASSIGNMENT (created_by)
STORE ──< SHIFT_ASSIGNMENT
SHIFT_TEMPLATE ──< SHIFT_ASSIGNMENT (optional)
USER  ──< NOTIFICATION (user_id)
```

### 2.2 Tabelle

#### STORE
```sql
CREATE TABLE store (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,          -- "L'Erbolario", "Dr Taffi", "Bottega Verde"
  code        text UNIQUE NOT NULL,   -- short code
  address     text,
  city        text,
  phone       text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

#### USER
```sql
CREATE TABLE "user" (
  id              uuid PRIMARY KEY REFERENCES auth.users(id),
  email           text UNIQUE NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  preferred_name  text,                -- nullable
  pronouns        text,                -- lei_essa|lui_esso|loro_essi|altro
  birth_date      date,
  legal_gender    text,                -- femminile|maschile|altro
  avatar_url      text,
  role            text NOT NULL DEFAULT 'employee', -- manager|employee
  admission_date  date,                -- data di ammissione
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
-- NOTA: "initials" calcolate client-side da first_name + last_name, non salvate in DB.
```

#### STORE_MEMBERSHIP
```sql
CREATE TABLE store_membership (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  store_id   uuid NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,    -- negozio default dell'utente
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, store_id)            -- Previene membership duplicata
);
```

#### SHIFT_TEMPLATE
```sql
CREATE TABLE shift_template (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES "user"(id),
  name        text NOT NULL,           -- "apertura", "chiusura", "riposo"
  shift_type  text NOT NULL,           -- work_shift|rest_day|holiday|transfer|permission
  start_time  time,                    -- nullable per tipi senza orario
  end_time    time,                    -- nullable
  color       text NOT NULL,           -- hex per rendering calendario
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

#### SHIFT_ASSIGNMENT
```sql
CREATE TABLE shift_assignment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  store_id      uuid NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  template_id   uuid REFERENCES shift_template(id),  -- nullable = turno custom
  created_by    uuid NOT NULL REFERENCES "user"(id),
  date          date NOT NULL,
  shift_type    text NOT NULL,         -- work_shift|rest_day|holiday|transfer|permission
  label         text NOT NULL,         -- "apertura", "chiusura", "riposo", "ferie"
  start_time    time,                  -- nullable per tipi senza orario
  end_time      time,                  -- nullable
  color         text NOT NULL,         -- AGGIUNTO: copiato dal template (copy-on-assign)
  published_at  timestamptz,           -- AGGIUNTO: null = bozza, valorizzato = pubblicato
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
-- Multi-blocco: 2+ righe per (user_id, date) = orari spezzati
-- NO unique constraint su (user_id, date) per supportare multi-blocco
```

#### NOTIFICATION
```sql
CREATE TABLE notification (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES "user"(id), -- nullable: manager o sistema
  type        text NOT NULL,           -- shift_published|absence_approved|communication|new_shift
  title       text NOT NULL,
  body        text NOT NULL,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
```

### 2.3 Tipi Shift

| Tipo | Codice | Ha orario | Colore default |
|------|--------|-----------|----------------|
| Turno lavorativo | `work_shift` | Si | Primario verde |
| Giorno di riposo | `rest_day` | No | Grigio |
| Ferie | `holiday` | No | Giallo |
| Trasferta | `transfer` | Si/No | Blu |
| Permesso | `permission` | No | Arancione |

### 2.4 Modifiche al modello rispetto al PRD

| Modifica | Motivo |
|----------|--------|
| **`color` aggiunto a `SHIFT_ASSIGNMENT`** | Pattern copy-on-assign: il colore del template va copiato nell'assegnazione. Modifiche future al template non devono cambiare assegnazioni passate |
| **`published_at` aggiunto a `SHIFT_ASSIGNMENT`** | Supporta il flusso "pubblicazione turni" per notifiche. `null` = bozza, valorizzato = pubblicato |
| **`initials` rimosso da `USER`** | Calcolato client-side da `first_name[0] + last_name[0]`, evita trigger di sync |
| **`UNIQUE(user_id, store_id)` su `STORE_MEMBERSHIP`** | Previene membership duplicate |

### 2.5 Indexes

```sql
CREATE INDEX idx_shift_assignment_store_date ON shift_assignment(store_id, date);
CREATE INDEX idx_shift_assignment_user_date ON shift_assignment(user_id, date);
CREATE INDEX idx_shift_assignment_type ON shift_assignment(shift_type);
CREATE INDEX idx_store_membership_user ON store_membership(user_id);
CREATE INDEX idx_store_membership_store ON store_membership(store_id);
CREATE INDEX idx_notification_user_read ON notification(user_id, is_read);
CREATE INDEX idx_shift_template_store ON shift_template(store_id);
```

### 2.6 Funzioni Database

```sql
-- Helper per RLS: controlla se l'utente corrente e' manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "user" WHERE id = auth.uid() AND role = 'manager'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Inserimento assenze su range di date (batch)
CREATE OR REPLACE FUNCTION insert_absence_range(
  p_user_id uuid,
  p_store_id uuid,
  p_created_by uuid,
  p_shift_type text,
  p_label text,
  p_color text,
  p_start_date date,
  p_end_date date
) RETURNS SETOF shift_assignment AS $$
  INSERT INTO shift_assignment (user_id, store_id, created_by, shift_type, label, color, date)
  SELECT p_user_id, p_store_id, p_created_by, p_shift_type, p_label, p_color, d::date
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d
  RETURNING *;
$$ LANGUAGE sql;
```

---

## 3. Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato. La funzione `is_manager()` e' usata per policy DRY.

### STORE
```sql
-- Tutti i loggati possono leggere i negozi
CREATE POLICY "store_select" ON store FOR SELECT TO authenticated USING (true);
-- Solo manager puo' gestire negozi
CREATE POLICY "store_manage" ON store FOR ALL TO authenticated USING (is_manager());
```

### USER
```sql
-- Tutti possono leggere tutti gli utenti (directory Persone, colleghi)
CREATE POLICY "user_select" ON "user" FOR SELECT TO authenticated USING (true);
-- Utente puo' aggiornare solo il proprio profilo (escluso campo role)
CREATE POLICY "user_update_own" ON "user" FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
-- Manager puo' aggiornare qualsiasi utente
CREATE POLICY "user_update_manager" ON "user" FOR UPDATE TO authenticated
  USING (is_manager());
```

### STORE_MEMBERSHIP
```sql
CREATE POLICY "membership_select" ON store_membership FOR SELECT TO authenticated USING (true);
CREATE POLICY "membership_manage" ON store_membership FOR ALL TO authenticated USING (is_manager());
```

### SHIFT_TEMPLATE
```sql
CREATE POLICY "template_select" ON shift_template FOR SELECT TO authenticated USING (true);
CREATE POLICY "template_insert" ON shift_template FOR INSERT TO authenticated WITH CHECK (is_manager());
CREATE POLICY "template_update" ON shift_template FOR UPDATE TO authenticated USING (is_manager());
CREATE POLICY "template_delete" ON shift_template FOR DELETE TO authenticated USING (is_manager());
```

### SHIFT_ASSIGNMENT
```sql
-- Utenti vedono assegnazioni dei negozi a cui appartengono
CREATE POLICY "assignment_select" ON shift_assignment FOR SELECT TO authenticated
  USING (store_id IN (SELECT store_id FROM store_membership WHERE user_id = auth.uid()));
-- Solo manager puo' creare/modificare/eliminare
CREATE POLICY "assignment_insert" ON shift_assignment FOR INSERT TO authenticated WITH CHECK (is_manager());
CREATE POLICY "assignment_update" ON shift_assignment FOR UPDATE TO authenticated USING (is_manager());
CREATE POLICY "assignment_delete" ON shift_assignment FOR DELETE TO authenticated USING (is_manager());
```

### NOTIFICATION
```sql
-- Utente vede solo le proprie notifiche
CREATE POLICY "notification_select" ON notification FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Utente puo' aggiornare le proprie (mark as read)
CREATE POLICY "notification_update" ON notification FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- Solo manager puo' creare notifiche
CREATE POLICY "notification_insert" ON notification FOR INSERT TO authenticated WITH CHECK (is_manager());
```

> **Nota sicurezza:** Il campo `role` su USER non deve essere auto-modificabile. Implementare un trigger o una policy con column check per impedire che un utente cambi il proprio ruolo.

---

## 4. Project Skeleton (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx                        # Root layout: providers, fonts (Manrope), metadata
│   ├── globals.css                       # Tailwind imports + design tokens custom
│   ├── manifest.ts                       # PWA manifest (dynamic)
│   ├── sw.ts                             # Service worker (Serwist)
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                    # Auth layout: no bottom nav, centered
│   │   └── login/
│   │       └── page.tsx                  # Login page (email + password)
│   │
│   └── (main)/
│       ├── layout.tsx                    # Main layout: bottom nav + header + auth guard
│       ├── home/
│       │   └── page.tsx                  # Tab 1: Home
│       ├── calendario/
│       │   └── page.tsx                  # Tab 2: Calendario personale
│       ├── hub/
│       │   ├── page.tsx                  # Tab 3: Hub landing (cards: Turni, Assenze, Persone)
│       │   ├── turni/
│       │   │   └── page.tsx              # Griglia turni settimanale
│       │   ├── assenze/
│       │   │   └── page.tsx              # Vista assenze filtrata
│       │   └── persone/
│       │       └── page.tsx              # Directory dipendenti
│       ├── profilo/
│       │   ├── page.tsx                  # Profilo overview
│       │   ├── personale/
│       │   │   └── page.tsx              # Form info personali
│       │   ├── dettagli/
│       │   │   └── page.tsx              # Dettagli profilo (manager, email aziendale)
│       │   └── sicurezza/
│       │       └── page.tsx              # Security & preferences (Face ID, lingua)
│       ├── notifiche/
│       │   └── page.tsx                  # Lista notifiche
│       └── esportazione/
│           └── page.tsx                  # PDF export (solo manager)
│
├── components/
│   ├── ui/                               # Design system primitives (Botanical Editorial)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chip.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── bottom-sheet.tsx
│   │   ├── avatar.tsx
│   │   └── glassmorphism-nav.tsx
│   │
│   ├── layout/
│   │   ├── bottom-navigation.tsx         # 3 tab: Home, Calendario, Hub
│   │   ├── header.tsx                    # Titolo pagina + campanella notifiche
│   │   └── page-container.tsx            # Wrapper con padding e sfondo crema
│   │
│   ├── home/
│   │   ├── greeting-card.tsx             # "Buongiorno, [Nome]!"
│   │   ├── my-shift-today.tsx            # Card turno odierno
│   │   └── colleagues-today.tsx          # Lista colleghi in servizio
│   │
│   ├── calendario/
│   │   ├── month-navigator.tsx           # < Ottobre 2024 >
│   │   ├── calendar-grid.tsx             # Griglia mensile Lun-Dom
│   │   ├── day-cell.tsx                  # Cella giorno con indicatore
│   │   └── shift-detail-card.tsx         # Card dettaglio turno del giorno selezionato
│   │
│   ├── turni/
│   │   ├── shift-grid.tsx                # Griglia principale (employee x day)
│   │   ├── shift-cell.tsx                # Singola cella (puo' contenere multi-blocco)
│   │   ├── shift-block.tsx               # Blocco turno individuale dentro la cella
│   │   ├── employee-row.tsx              # Riga dipendente con avatar
│   │   ├── week-navigator.tsx            # < Settimana 13: Mar 2026 >
│   │   ├── store-filter-chips.tsx        # Chip: L'Erbolario, Dr Taffi, ecc.
│   │   ├── shift-create-sheet.tsx        # Bottom sheet per creare/editare turno
│   │   ├── template-selector.tsx         # Lista template nel bottom sheet
│   │   └── custom-shift-form.tsx         # Form turno personalizzato
│   │
│   ├── assenze/
│   │   ├── absence-list.tsx              # Lista assenze raggruppate
│   │   └── absence-filters.tsx           # Filtri: dipendente, tipo, periodo
│   │
│   ├── persone/
│   │   ├── person-card.tsx               # Card con avatar, nome, chevron
│   │   └── person-list.tsx               # Lista filtrable con ricerca
│   │
│   ├── profilo/
│   │   ├── profile-section.tsx           # Sezione generica profilo
│   │   └── profile-form.tsx              # Form con campi profilo
│   │
│   ├── notifiche/
│   │   ├── notification-item.tsx         # Singola notifica
│   │   └── notification-badge.tsx        # Badge contatore campanella
│   │
│   └── esportazione/
│       ├── employee-selector.tsx         # Checkbox selezione dipendenti
│       └── date-range-picker.tsx         # Date picker da-a
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient (client components)
│   │   ├── server.ts                     # createServerClient (RSC, route handlers)
│   │   ├── middleware.ts                 # Auth middleware per protezione route
│   │   └── types.ts                      # Tipi generati con `supabase gen types`
│   │
│   ├── queries/                          # TanStack Query hooks (fetch)
│   │   ├── shifts.ts                     # useShifts, useShiftsByWeek, useMyShiftsToday
│   │   ├── templates.ts                  # useTemplates, useTemplatesByStore
│   │   ├── users.ts                      # useUsers, useCurrentUser, useColleaguesToday
│   │   ├── stores.ts                     # useStores, useMyStores
│   │   └── notifications.ts              # useNotifications, useUnreadCount
│   │
│   ├── mutations/                        # TanStack Query mutations (write)
│   │   ├── shifts.ts                     # useCreateShift, useUpdateShift, useDeleteShift, usePublishShifts
│   │   ├── templates.ts                  # useCreateTemplate, useUpdateTemplate
│   │   ├── notifications.ts              # useMarkAsRead, useCreateNotification
│   │   └── profile.ts                    # useUpdateProfile
│   │
│   ├── pdf/
│   │   ├── generate-shift-report.ts      # Logica jsPDF + AutoTable
│   │   └── format-hours.ts              # Calcolo ore, split sabato/domenica
│   │
│   ├── utils/
│   │   ├── date.ts                       # Format date, calcolo settimane, range
│   │   ├── hours.ts                      # Aritmetica ore (durata, somme)
│   │   └── initials.ts                   # Derivare iniziali da nome
│   │
│   ├── hooks/
│   │   ├── use-current-user.ts           # Hook utente corrente con ruolo
│   │   ├── use-realtime-shifts.ts        # Supabase Realtime -> invalidate query
│   │   ├── use-realtime-notifications.ts # Realtime notifiche
│   │   └── use-online-status.ts          # Stato connessione per offline
│   │
│   └── constants/
│       ├── shift-types.ts                # Enum tipi turno, colori, label
│       └── routes.ts                     # Costanti route
│
├── stores/                               # Zustand (solo stato UI ephemero)
│   └── store-filter.ts                   # Negozio selezionato per filtro
│
└── types/
    ├── database.ts                       # Tipi Supabase auto-generati
    └── domain.ts                         # Tipi dominio app (ShiftWithBlocks, etc.)
```

### Configurazione Root

```
/
├── src/                          # Tutto il codice applicativo
├── public/
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   └── sw.js                     # Service worker compilato (output Serwist)
├── supabase/
│   ├── migrations/               # SQL migrations
│   └── seed.sql                  # Dati seed (stores, utente manager di test)
├── next.config.ts                # Config Next.js + Serwist
├── tailwind.config.ts            # Design tokens Botanical Editorial
├── tsconfig.json
├── package.json
├── .env.local                    # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── piano.md                      # PRD
├── Architecture.md               # Questo file
└── Mockup/                       # Mockup di riferimento
```

---

## 5. Component Hierarchy

```
RootLayout (fonts, metadata, <html>, <body>)
  └── Providers (QueryClientProvider, Supabase, Zustand)
      │
      ├── (auth)/AuthLayout (centered, no nav)
      │   └── LoginPage
      │
      └── (main)/MainLayout (header + bottom nav + auth guard)
          ├── Header (titolo + NotificationBadge)
          ├── BottomNavigation (glassmorphism: Home | Calendario | Hub)
          │
          ├── HomePage
          │   ├── GreetingCard
          │   ├── MyShiftToday
          │   └── ColleaguesToday
          │
          ├── CalendarioPage
          │   ├── MonthNavigator
          │   ├── CalendarGrid > DayCell[]
          │   └── ShiftDetailCard
          │
          ├── HubPage
          │   ├── OperationCard -> /hub/turni
          │   ├── OperationCard -> /hub/assenze
          │   └── OperationCard -> /hub/persone
          │
          ├── TurniPage
          │   ├── StoreFilterChips
          │   ├── WeekNavigator
          │   ├── ShiftGrid
          │   │   └── EmployeeRow[] > ShiftCell[] > ShiftBlock[]
          │   └── ShiftCreateSheet (manager only)
          │       ├── TemplateSelector
          │       └── CustomShiftForm
          │
          ├── AssenzePage
          │   ├── AbsenceFilters
          │   └── AbsenceList
          │
          ├── PersonePage
          │   ├── StoreFilterChips
          │   ├── SearchInput
          │   └── PersonList > PersonCard[]
          │
          ├── ProfiloPage > ProfileSection[]
          ├── NotifichePage > NotificationItem[]
          └── EsportazionePage (manager only)
              ├── EmployeeSelector
              ├── DateRangePicker
              └── ExportButton
```

---

## 6. Data Flow Architecture

### 6.1 Pattern: TanStack Query + Supabase Realtime (Hybrid)

TanStack Query gestisce tutto lo stato server. Supabase Realtime serve solo come **segnale di invalidazione cache**, non come sorgente dati diretta.

```
User Action -> Mutation Hook -> Supabase Client -> PostgreSQL
                                                       |
                                               Realtime Channel
                                                       |
                                           queryClient.invalidateQueries()
                                                       |
                                               Auto re-fetch
                                                       |
                                               UI Re-render
```

### 6.2 Query Keys

```typescript
const queryKeys = {
  shifts: {
    all: ['shifts'] as const,
    byStoreWeek: (storeId: string, weekStart: string) =>
      ['shifts', storeId, weekStart] as const,
    byUserMonth: (userId: string, month: string) =>
      ['shifts', 'personal', userId, month] as const,
    today: (storeId: string) =>
      ['shifts', 'today', storeId] as const,
  },
  templates: {
    all: ['templates'] as const,
    byStore: (storeId: string) =>
      ['templates', storeId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  users: {
    all: ['users'] as const,
    byStore: (storeId: string) =>
      ['users', storeId] as const,
    me: ['users', 'me'] as const,
  },
  stores: {
    all: ['stores'] as const,
    mine: ['stores', 'mine'] as const,
  },
};
```

### 6.3 Realtime Subscriptions

```typescript
// Turni: invalida cache quando cambiano shift_assignment del negozio
supabase
  .channel('shifts')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shift_assignment',
    filter: `store_id=eq.${storeId}`,
  }, () => {
    queryClient.invalidateQueries({ queryKey: ['shifts', storeId] });
  })
  .subscribe();

// Notifiche: invalida cache per nuove notifiche dell'utente
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notification',
    filter: `user_id=eq.${userId}`,
  }, () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  })
  .subscribe();
```

### 6.4 Optimistic Updates (Manager CRUD)

Per le mutazioni del manager (create/update/delete shift), usare optimistic updates di TanStack Query:
1. `onMutate`: aggiorna la cache immediatamente
2. Il server conferma o fallisce
3. `onError`: rollback alla cache precedente
4. `onSettled`: re-fetch per sincronizzare

---

## 7. Auth Flow

### 7.1 Login

```
1. Utente apre app -> middleware controlla sessione
2. Se non autenticato -> redirect a /login
3. Utente inserisce email + password
4. Supabase Auth (PKCE flow) -> session token in cookie httpOnly
5. Redirect a /home
6. middleware.ts verifica sessione ad ogni request
```

### 7.2 Middleware Next.js

```typescript
// src/app/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // 1. Refresh sessione se scaduta
  // 2. Se non autenticato e route protetta -> redirect /login
  // 3. Se autenticato e route /login -> redirect /home
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js).*)'],
};
```

### 7.3 Protezione Route Manager-Only

Le pagine `/esportazione` e le azioni CRUD nella griglia turni controllano il ruolo client-side via `useCurrentUser()`. Le RLS policies sono il vero gate di sicurezza server-side.

---

## 8. PWA Configuration

### 8.1 Serwist Setup

```typescript
// next.config.ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  register: true,
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
```

### 8.2 Service Worker

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{
      url: "/offline",
      matcher: ({ request }) => request.destination === "document",
    }],
  },
});

serwist.addEventListeners();
```

### 8.3 Manifest

```typescript
// src/app/manifest.ts
export default function manifest() {
  return {
    name: 'Factorial App',
    short_name: 'Factorial',
    description: 'Gestione turni erboristeria',
    start_url: '/home',
    display: 'standalone',
    background_color: '#fcf9f4',
    theme_color: '#234428',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

### 8.4 Offline Strategy

| Risorsa | Strategia | Note |
|---------|-----------|------|
| Pagine statiche | Precache | Cached al build |
| Font (Manrope) | CacheFirst | Cached dopo primo load |
| Immagini/icons | CacheFirst | maxAge 30 giorni |
| API shifts (personali) | StaleWhileRevalidate | Offline calendar view |
| API shifts (griglia) | NetworkFirst | Dati collaborativi, serve rete |
| API notifiche | NetworkFirst | Real-time, no cache utile |

**Scope offline:** Solo il calendario personale (Tab 2) ha supporto offline completo. La griglia turni e le notifiche richiedono connessione.

---

## 9. PDF Export Architecture

### 9.1 Flusso

```
1. Manager seleziona dipendenti (checkbox) + range date
2. Click "Esporta PDF"
3. Dynamic import: const { generateShiftReport } = await import('@/lib/pdf/generate-shift-report')
4. Query: shift_assignment WHERE user_id IN (...) AND date BETWEEN start AND end
5. Per ogni dipendente: calcola ore, split sabato/domenica, totali
6. jsPDF + AutoTable genera tabella conforme al riferimento PDF
7. Download automatico
```

### 9.2 Struttura Tabella PDF

```
HEADER:
  [Nome Azienda]          Esportazione Turni
  Dipendente: [Nome]      Da: DD/MM a DD/MM
  Data ammissione: DD/MM/YYYY

TABELLA:
  | Data          | Orario di lavoro | Ore   | Sabato | Domenica | Tipo     | Note |
  | Dom 01/03     | 14:00 - 20:00    | 6:00  | 0:00   | 6:00     | Turno    |      |
  | Lun 02/03     | 08:30 - 14:30    | 6:00  | 0:00   | 0:00     | Turno    |      |
  | Mar 03/03     |                  | 0:00  | 0:00   | 0:00     | Riposo   |      |
  |──────────────────────────────────────────────────────────────────────────────────|
  | TOTALE        |                  | 126:00| 24:00  | 24:00    |          |      |

FOOTER:
  Firma: ___________________
```

### 9.3 Logica Ore

```typescript
// lib/pdf/format-hours.ts
function calculateHours(startTime: string, endTime: string): number // minuti
function formatMinutesToHHMM(minutes: number): string              // "6:00"
function isSaturday(date: Date): boolean
function isSunday(date: Date): boolean

// Per ogni riga:
// - "Ore" = duration(start_time, end_time)
// - "Sabato" = ore se il giorno e' sabato, altrimenti "0:00"
// - "Domenica" = ore se il giorno e' domenica, altrimenti "0:00"
// - Multi-blocco: somma ore di tutti i blocchi dello stesso giorno
```

### 9.4 Dynamic Import

jsPDF (~300KB) viene caricato solo quando l'utente apre la pagina esportazione:

```typescript
const handleExport = async () => {
  const { generateShiftReport } = await import('@/lib/pdf/generate-shift-report');
  await generateShiftReport(selectedEmployees, dateRange, shifts);
};
```

---

## 10. Architectural Decision Records (ADR)

### ADR-001: Assenze come SHIFT_ASSIGNMENT (non tabella separata)

**Decisione:** Le assenze (ferie, riposi, permessi, trasferte) sono righe `shift_assignment` con `shift_type != 'work_shift'`.

**Pro:** Schema semplice, single source of truth, griglia turni mostra tutto in una vista.
**Contro:** Range insert crea N righe; no modo nativo di raggruppare una "assenza" multi-giorno.
**Verdetto:** Corretto per scala attuale (10-15 dipendenti).

### ADR-002: PDF Client-Side (jsPDF, non server-side)

**Decisione:** Generazione PDF via jsPDF + AutoTable nel browser.

**Pro:** Zero costo server, funziona offline (se dati cached), nessuna API route necessaria.
**Contro:** Bundle JS piu' pesante (~300KB), meno flessibilita' di layout vs. Puppeteer.
**Verdetto:** La tabella PDF e' semplice, ben supportata da AutoTable. Dynamic import mitiga il bundle.

### ADR-003: TanStack Query + Supabase Realtime (Hybrid)

**Decisione:** TanStack Query come layer dati primario. Supabase Realtime invalida la cache, non gestisce stato direttamente.

**Pro:** Caching, dedup, background refetch, error/loading states gratis. Realtime semplice (solo invalidation).
**Contro:** Leggero delay (~100ms) tra evento realtime e re-fetch.
**Verdetto:** Best practice standard. Pure realtime richiederebbe gestione stato manuale.

### ADR-004: Route Groups (auth) vs (main)

**Decisione:** Next.js route groups per separare layout auth (no nav) da layout main (con bottom nav).

**Pro:** Separazione pulita, pattern standard App Router.
**Contro:** Struttura cartelle leggermente piu' complessa.
**Verdetto:** Pattern raccomandato da Next.js.

### ADR-005: Zustand per UI State, TanStack Query per Server State

**Decisione:** Zustand minimale per stato UI (store filter, week cursor). Tutto il server state via TanStack Query.

**Pro:** Separazione chiara, no over-engineering.
**Contro:** Nessuno a questa scala.
**Verdetto:** Right-sized per l'applicazione.

### ADR-006: @supabase/ssr per integrazione Next.js

**Decisione:** Usare `@supabase/ssr` invece del client JS diretto per gestire sessioni in Server Components e middleware.

**Pro:** Gestione cookie corretta, refresh token automatico, compatibilita' RSC.
**Contro:** Setup leggermente piu' complesso del client base.
**Verdetto:** Necessario per Next.js App Router con auth server-side.

---

## 11. Risk Assessment

| Risk | Severita' | Descrizione | Mitigazione |
|------|----------|-------------|-------------|
| **Shift Grid mobile UX** | ALTA | Matrice employee x day su mobile richiede scroll orizzontale e target touch piccoli | Studiare mockup, possibile layout card-based su mobile |
| **PDF export accuracy** | MEDIA-ALTA | Colonne sabato/domenica richiedono logica day-of-week precisa. Multi-blocco richiede somma ore | Unit test approfonditi su `format-hours.ts` e `hours.ts` |
| **Multi-block rendering** | MEDIA | Raggruppare 2+ SHIFT_ASSIGNMENT per stessa (user, date) in una cella | Grouping query-side o client-side con Map<userId-date, shifts[]> |
| **Date range absence insert** | MEDIA | Inserire N righe senza modo nativo di raggrupparle/eliminarle come unita' | UX "elimina tutti [tipo] per questo dipendente nel range" |
| **Offline calendar** | MEDIA | Persistenza dati TanStack Query su localStorage/IndexedDB | `@tanstack/query-sync-storage-persister`, dati calendario piccoli |
| **RLS performance** | BASSA | Sub-query su `user` per role check in ogni policy | `is_manager()` con `STABLE` volatility, trascurabile con 10-15 utenti |
| **Role self-modification** | BASSA | Utente potrebbe tentare di cambiare il proprio `role` | Trigger DB o column-level check nella policy UPDATE |

---

## 12. Implementation Phases (Suggerite)

### Fase 1: Foundation
- Next.js project init con TypeScript + Tailwind
- Supabase project setup + schema migration
- Auth (login page, middleware, sessioni)
- Design system base (UI primitives da DESIGN.md)
- PWA manifest + service worker base

### Fase 2: Core (Shift Grid)
- Griglia turni (employee x day)
- Template CRUD
- Shift assignment CRUD (manager)
- Multi-block rendering
- Store filter chips
- Week navigator (fino a 3 mesi futuro)
- Bottom sheet per creazione turno

### Fase 3: Views
- Home page (turno odierno + colleghi)
- Calendario personale (vista mensile)
- Hub landing page
- Assenze (vista filtrata)
- Persone (directory)

### Fase 4: Features
- Notifiche (CRUD + realtime + badge)
- Profilo (form personale + dettagli + sicurezza)
- PDF export (jsPDF + AutoTable)
- Pubblicazione turni (published_at + notifica)

### Fase 5: Polish
- PWA offline calendar
- Optimistic updates
- Testing (E2E con Playwright)
- Responsive fine-tuning
- Deploy Vercel

---

## 13. Riferimenti Mockup

| Schermata | File | Usato per |
|-----------|------|-----------|
| Home | `Mockup/home_page_layout_pulito/` | HomePage layout |
| Calendario | `Mockup/calendario_vista_pulita_senza_consigli/` | CalendarioPage |
| Hub | `Mockup/hub_operazioni_aggiornato/` | HubPage cards |
| Turni (griglia) | `Mockup/turni_stile_verde_mentha_layout_fedele/` | ShiftGrid |
| Persone | `Mockup/persone_vista_semplificata_senza_navigazione/` | PersonePage |
| Profilo | `Mockup/profilo_senza_notifiche_aggiornato/` | ProfiloPage |
| Info Personali | `Mockup/informazioni_personali_versione_pulita/` | PersonaleForm |
| Dettagli Profilo | `Mockup/dettagli_profilo_versione_semplificata_annotata/` | DettagliForm |
| Notifiche | `Mockup/notifiche_stile_verde_mentha/` | NotifichePage |
| Design System | `Mockup/palette_globale/DESIGN.md` | Tutti i componenti UI |
| PDF Reference | `Tabella Esportazione orari/*.pdf` | PDF export format |
