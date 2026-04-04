export const queryKeys = {
  shifts: {
    all: ['shifts'] as const,
    byStoreWeek: (storeId: string, weekStart: string) =>
      ['shifts', storeId, weekStart] as const,
    byUserMonth: (userId: string, month: string) =>
      ['shifts', 'personal', userId, month] as const,
    today: (storeId: string) => ['shifts', 'today', storeId] as const,
  },
  templates: {
    all: ['templates'] as const,
    byStore: (storeId: string) => ['templates', storeId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  users: {
    all: ['users'] as const,
    byStore: (storeId: string) => ['users', storeId] as const,
    me: ['users', 'me'] as const,
  },
  stores: {
    all: ['stores'] as const,
    mine: ['stores', 'mine'] as const,
  },
} as const
