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

      // Fetch users who have a shift assignment at this store today
      // by joining through shift_assignment
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('store_id', storeId!)
        .eq('date', today)
        .order('last_name')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}
