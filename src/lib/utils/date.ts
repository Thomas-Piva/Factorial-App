import type { WeekRange, MonthRange } from '@/types/domain'

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

/** Format as "Dom 04/04" */
export function formatDate(date: Date): string {
  const dayName = DAYS_IT[date.getDay()]
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dayName} ${dd}/${mm}`
}

/** Format as "DD/MM/YYYY" */
export function formatDateShort(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Convert a Date to ISO date string "YYYY-MM-DD" (local time). */
export function toISODate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Add (or subtract) days to/from a date, returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Return every day in [start, end] inclusive. */
export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

/**
 * Given any date, return the ISO week's Monday–Sunday range.
 * Week starts on Monday (Italian/European convention).
 */
export function getWeekRange(date: Date): WeekRange {
  const d = new Date(date)
  // getDay(): 0=Sun, 1=Mon ... 6=Sat -> shift so Mon=0
  const dayOfWeek = (d.getDay() + 6) % 7
  const monday = addDays(d, -dayOfWeek)
  const sunday = addDays(monday, 6)

  const weekNumber = getISOWeekNumber(monday)
  const monthName = MONTHS_IT[monday.getMonth()]
  const year = monday.getFullYear()
  const label = `Settimana ${weekNumber}: ${monthName.slice(0, 3)} ${year}`

  return { start: monday, end: sunday, weekNumber, label }
}

/** Return the start and end Date of a calendar month (0-indexed month). */
export function getMonthRange(year: number, month: number): MonthRange & { start: Date; end: Date } {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0) // day 0 of next month = last day of this month
  const label = `${MONTHS_IT[month]} ${year}`
  return { year, month, label, start, end }
}

/** ISO 8601 week number (Mon-based). */
function getISOWeekNumber(monday: Date): number {
  // The ISO week containing 4 January always starts the new year's first week
  const jan4 = new Date(monday.getFullYear(), 0, 4)
  const startOfWeek1 = addDays(jan4, -((jan4.getDay() + 6) % 7))
  const diff = monday.getTime() - startOfWeek1.getTime()
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}
