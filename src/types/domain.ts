import type {
  ShiftAssignment,
  ShiftTemplate,
  Store,
  StoreMembership,
  User,
} from './database'

// ShiftAssignment with potentially multiple blocks on the same date (orari spezzati)
export interface ShiftBlock {
  id: string
  user_id: string
  store_id: string
  template_id: string | null
  date: string
  shift_type: ShiftAssignment['shift_type']
  label: string
  start_time: string | null
  end_time: string | null
  color: string
  published_at: string | null
  notes: string | null
}

// A cell in the shift grid: one user on one day, can have multiple blocks
export interface ShiftCell {
  userId: string
  date: string
  blocks: ShiftBlock[]
}

// A row in the shift grid: one employee with all their shifts for the week
export interface ShiftGridRow {
  user: UserWithInitials
  cells: Record<string, ShiftCell> // keyed by ISO date string
}

// User with computed initials (not stored in DB)
export type UserWithInitials = User & {
  initials: string
  displayName: string
}

// User enriched with their primary store
export type UserWithPrimaryStore = UserWithInitials & {
  primaryStore: Store | null
  memberships: StoreMembership[]
}

// Week range for the shift grid navigator
export interface WeekRange {
  start: Date
  end: Date
  weekNumber: number
  label: string // "Settimana 13: Mar 2026"
}

// Month range for the personal calendar
export interface MonthRange {
  year: number
  month: number // 0-indexed
  label: string // "Ottobre 2024"
}

// Shift template with its store
export type ShiftTemplateWithStore = ShiftTemplate & {
  store: Pick<Store, 'id' | 'name' | 'code'>
}

// Data passed to PDF generation
export interface PdfExportPayload {
  employee: User
  assignments: ShiftAssignment[]
  dateRange: { start: Date; end: Date }
  storeName: string
}

// Absence request input (used for range insert)
export interface AbsenceRangeInput {
  userId: string
  storeId: string
  shiftType: Exclude<ShiftAssignment['shift_type'], 'work_shift'>
  label: string
  color: string
  startDate: string // ISO date
  endDate: string   // ISO date
}
