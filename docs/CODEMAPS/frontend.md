<!-- Generated: 2026-04-05 | Files scanned: 62 | Token estimate: ~750 -->

# Frontend

## Page Tree

```
/login          (auth)/login/page.tsx
                  └─ LoginPage (server) → client form component
/home           (main)/home/page.tsx
                  └─ HomeContent → GreetingSection
                                 → TurnoOggiCard     (useMyShiftsToday)
                                 → ColleghiOggiCard  (useColleaguesToday)
                                 → ComunicazioniCard (useNotifications)
/turni          (main)/turni/page.tsx
                  └─ TurniContent    → week grid, useShifts, useTemplates
/assenze        (main)/assenze/page.tsx
                  └─ AssenzeContent  → useAbsences
/calendario     (main)/calendario/page.tsx (personal monthly calendar)
/hub            (main)/hub/page.tsx (manager hub, links to turni/assenze/persone)
/persone        (main)/persone/page.tsx
                  └─ PersoneContent  → useUsers
/notifiche      (main)/notifiche/page.tsx
                  └─ NotificheContent → useNotifications, useMarkAsRead
/profilo        (main)/profilo/page.tsx
                  └─ ProfiloContent  → useCurrentUser, useUpdateProfile, exportPdf
```

## Shared Layout Components
```
src/components/layout/
  main-layout.tsx    wrapper with padding/max-width
  bottom-nav.tsx     5-tab nav (Home/Turni/Hub/Notifiche/Profilo)
  page-header.tsx    title + optional back button
```

## UI Primitives
```
src/components/ui/
  avatar.tsx         user initials/photo circle
  badge.tsx          colored status chips
  button.tsx         primary/secondary/ghost variants
  empty-state.tsx    icon + message for empty lists
  input.tsx          controlled text input
  loading-spinner.tsx  centered spinner
  shift-block.tsx    colored shift card (label, time, type)
```

## Hooks
```
src/lib/hooks/
  use-current-user.ts             → queryKeys.users.me
  use-online-status.ts            → navigator.onLine
  use-realtime-notifications.ts   → Supabase channel "notifications"
  use-realtime-shifts.ts          → Supabase channel "shifts"
```

## Key Utilities
```
src/lib/utils/
  date.ts       week/month range helpers, ISO formatters
  hours.ts      shift duration calculation
  initials.ts   first+last name → initials + displayName
  shift-grid.ts shift_assignments → ShiftGridRow[] matrix
  export-pdf.ts jsPDF table export for profilo page
```

## Query / Mutation Map
```
Query file                  → hook exported           → queryKey
queries/shifts.ts           useShifts, useAbsences    shifts.*
queries/users.ts            useUsers, useMe           users.*
queries/stores.ts           useMyStores               stores.*
queries/templates.ts        useTemplates              templates.*
queries/notifications.ts    useNotifications          notifications.*

Mutation file               → hook exported
mutations/shifts.ts         useCreateShift, useUpdateShift, useDeleteShift, usePublishShifts
mutations/templates.ts      useCreateTemplate, useUpdateTemplate
mutations/notifications.ts  useCreateNotification, useMarkAsRead
mutations/profile.ts        useUpdateProfile
```
