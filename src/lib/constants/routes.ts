export const ROUTES = {
  // Auth
  LOGIN: '/login',

  // Main
  HOME: '/home',
  CALENDARIO: '/calendario',

  // Hub
  HUB: '/hub',
  HUB_TURNI: '/hub/turni',
  HUB_ASSENZE: '/hub/assenze',
  HUB_PERSONE: '/hub/persone',

  // Profilo
  PROFILO: '/profilo',
  PROFILO_PERSONALE: '/profilo/personale',
  PROFILO_DETTAGLI: '/profilo/dettagli',
  PROFILO_SICUREZZA: '/profilo/sicurezza',

  // Other
  NOTIFICHE: '/notifiche',
  ESPORTAZIONE: '/esportazione',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
