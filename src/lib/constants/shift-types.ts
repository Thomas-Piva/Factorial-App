import type { ShiftType } from '@/types/database'

export const SHIFT_TYPES = {
  WORK_SHIFT: 'work_shift' as const,
  REST_DAY: 'rest_day' as const,
  HOLIDAY: 'holiday' as const,
  TRANSFER: 'transfer' as const,
  PERMISSION: 'permission' as const,
} satisfies Record<string, ShiftType>

export const ALL_SHIFT_TYPES: ShiftType[] = [
  'work_shift',
  'rest_day',
  'holiday',
  'transfer',
  'permission',
]

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  work_shift: 'Turno lavorativo',
  rest_day: 'Giorno di riposo',
  holiday: 'Ferie',
  transfer: 'Trasferta',
  permission: 'Permesso',
}

/** Default calendar colors per shift type (Botanical Editorial palette) */
export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  work_shift: '#234428', // Deep Forest Green
  rest_day: '#9e9e9e',   // Grey
  holiday: '#f9a825',    // Yellow
  transfer: '#1565c0',   // Blue
  permission: '#e65100', // Orange
}

/** Whether the shift type requires start_time / end_time */
export const SHIFT_TYPE_HAS_TIME: Record<ShiftType, boolean> = {
  work_shift: true,
  rest_day: false,
  holiday: false,
  transfer: true,
  permission: false,
}
