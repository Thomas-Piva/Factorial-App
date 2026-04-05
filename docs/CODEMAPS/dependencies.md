<!-- Generated: 2026-04-05 | Files scanned: 62 | Token estimate: ~350 -->

# Dependencies

## Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^15.3.0 | App Router framework |
| react / react-dom | ^19.1.0 | UI layer |
| @supabase/supabase-js | 2.49.4 | DB client, auth, realtime |
| @supabase/ssr | ^0.6.1 | SSR-safe session cookies |
| @tanstack/react-query | ^5.74.4 | Server state + cache |
| @tanstack/react-query-devtools | ^5.74.4 | Dev inspector (dev only) |
| serwist | ^9.0.14 | Service worker runtime |
| @serwist/next | ^9.0.14 | Next.js PWA integration |
| jspdf | ^4.2.1 | PDF generation |
| jspdf-autotable | ^5.0.7 | PDF table helper |
| tailwindcss | ^4.1.3 | CSS utility framework |

## Dev / Tooling

| Package | Purpose |
|---------|---------|
| typescript ^5.8.3 | Type checking |
| vitest ^3.1.1 | Unit/integration test runner |
| @testing-library/react ^16.3.0 | Component testing |
| @playwright/test ^1.59.1 | E2E testing |
| eslint ^9.24.0 + eslint-config-next | Linting (flat config via FlatCompat) |
| @eslint/eslintrc | Bridge for legacy eslint-config-next |
| prettier (via Next.js) | Code formatting |
| @vitest/coverage-v8 | Coverage reports |

## External Services

| Service | Usage |
|---------|-------|
| Supabase (cloud) | Prod DB + auth + realtime (env: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) |
| Supabase (local Docker) | E2E test backend |
| Google Fonts | Material Symbols Outlined icon font (loaded in layout.tsx) |
| Vercel (planned) | Deployment target |
