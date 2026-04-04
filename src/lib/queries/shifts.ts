import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ShiftAssignment } from '@/types/database'
import { queryKeys } from './queryKeys'

// ── useShiftsByStoreWeek ──────────────────────────────────────────────────────

export function useShiftsByStoreWeek(
  storeId: string | undefined,
  weekStart: string | undefined,
) {
  return useQuery<ShiftAssignment[]>({
    queryKey: queryKeys.shifts.byStoreWeek(storeId ?? '', weekStart ?? ''),
    enabled: Boolean(storeId && weekStart),
    queryFn: async () => {
      const supabase = createClient()
      // weekStart is YYYY-MM-DD (Monday); derive weekEnd (Sunday = +6 days)
      const start = weekStart!
      const end = new Date(weekStart!)
      end.setDate(end.getDate() + 6)
      const weekEnd = end.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('shift_assignment')
        .select('*')
        .eq('store_id', storeId!)
        .gte('date', start)
        .lte('date', weekEnd)
        .order('date')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}

// ── useMyShiftsToday ──────────────────────────────────────────────────────────

export function useMyShiftsToday(
  userId: string | undefined,
  storeId: string | undefined,
) {
  const today = new Date().toISOString().slice(0, 10)

  return useQuery<ShiftAssignment[]>({
    queryKey: queryKeys.shifts.today(storeId ?? ''),
    enabled: Boolean(userId && storeId),
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('shift_assignment')
        .select('*')
        .eq('user_id', userId!)
        .eq('store_id', storeId!)
        .eq('date', today)
        .order('start_time')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}

// ── useShiftsByUserMonth ──────────────────────────────────────────────────────

export function useShiftsByUserMonth(
  userId: string | undefined,
  month: string | undefined, // format: YYYY-MM
) {
  return useQuery<ShiftAssignment[]>({
    queryKey: queryKeys.shifts.byUserMonth(userId ?? '', month ?? ''),
    enabled: Boolean(userId && month),
    queryFn: async () => {
      const supabase = createClient()

      // Derive first and last day of the month
      const [year, mon] = month!.split('-').map(Number)
      const firstDay = `${month}-01`
      const lastDay = new Date(year, mon, 0).toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('shift_assignment')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date')

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}
