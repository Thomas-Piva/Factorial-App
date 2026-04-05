<!-- Generated: 2026-04-05 | Files scanned: 62 | Token estimate: ~600 -->

# Architecture

## Type
Next.js 15 App Router · PWA (Serwist) · Supabase backend · Single-tenant per store

## Request Flow

```
Browser
  └─ Next.js middleware (src/middleware.ts)
       ├─ unauthenticated → redirect /login
       ├─ authenticated on /login → redirect /home
       └─ pass-through → App Router
            ├─ (auth)/login       → LoginPage (server shell + client form)
            └─ (main)/*           → MainLayout + BottomNav + page
                                       └─ React Query (TanStack) → Supabase JS
```

## Route Groups

| Group | Layout | Pages |
|-------|--------|-------|
| `(auth)` | auth/layout.tsx (no nav) | /login |
| `(main)` | main/layout.tsx + MainLayout + BottomNav | /home /turni /assenze /calendario /hub /persone /notifiche /profilo |

## Auth
- `src/middleware.ts` — SSR session check via `@supabase/ssr` `createServerClient`
- Client: `src/lib/supabase/client.ts` — `createBrowserClient`
- Session cookies managed by Supabase SSR (no manual JWT handling)

## State Management
- Server state: TanStack React Query v5 (staleTime 60s)
- Client state: local React state only (no Zustand/Redux)
- Realtime: Supabase channels in `use-realtime-shifts` / `use-realtime-notifications`

## PWA
- `src/app/sw.ts` — Serwist service worker (precache + runtime cache)
- `src/app/manifest.ts` — Web manifest
- Registered via `@serwist/next` in `next.config.ts`
