import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { queryKeys } from './queryKeys'

// ── useUsers ──────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery<User[]>({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .order('last_name')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}

// ── useCurrentUser ────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: queryKeys.users.me,
    queryFn: async () => {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(authError.message)
      }

      const authUser = authData.user
      if (!authUser) {
        return null
      }

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', authUser.id)
        .order('created_at')

      if (error) {
        throw new Error(error.message)
      }

      return data?.[0] ?? null
    },
  })
}

// ── useColleaguesToday ────────────────────────────────────────────────────────

export function useColleaguesToday(storeId: string | undefined) {
  const today = new Date().toISOString().slice(0, 10)

  return useQuery<User[]>({
    queryKey: [...queryKeys.users.byStore(storeId ?? ''), 'today'] as const,
    enabled: Boolean(storeId),
    queryFn: async () => {
      const supabase = createClient()

      // Join shift_assignment → user to get colleagues with a published work_shift today.
      // Multiple rows per (user_id, date) are possible for split shifts — deduplicate below.
      const { data, error } = await supabase
        .from('shift_assignment')
        .select('user:user!user_id(*)')
        .eq('store_id', storeId!)
        .eq('date', today)
        .eq('shift_type', 'work_shift')
        .not('published_at', 'is', null)

      if (error) {
        throw new Error(error.message)
      }

      // PostgREST may return the joined relation as null for missing rows
      const rows = data as Array<{ user: User | null }>

      // Deduplicate users (split shifts produce multiple rows per user per day)
      const seen = new Set<string>()
      const users: User[] = []
      for (const row of rows) {
        if (!row.user) continue
        if (!seen.has(row.user.id)) {
          seen.add(row.user.id)
          users.push(row.user)
        }
      }

      return users.sort((a, b) => a.last_name.localeCompare(b.last_name))
    },
  })
}
