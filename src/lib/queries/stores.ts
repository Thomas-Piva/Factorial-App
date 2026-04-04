import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Store } from '@/types/database'
import { queryKeys } from './queryKeys'

// ── useStores ─────────────────────────────────────────────────────────────────

export function useStores() {
  return useQuery<Store[]>({
    queryKey: queryKeys.stores.all,
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('store')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}

// ── useMyStores ───────────────────────────────────────────────────────────────

export function useMyStores(userId: string | undefined) {
  return useQuery<Store[]>({
    queryKey: queryKeys.stores.mine,
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient()

      // Fetch stores through store_membership join
      const { data, error } = await supabase
        .from('store')
        .select('*')
        .eq('user_id', userId!)
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}
