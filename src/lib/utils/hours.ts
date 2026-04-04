/**
 * Calculate duration in minutes between two HH:MM time strings.
 * Returns 0 if either argument is null.
 */
export function calculateDurationMinutes(
  startTime: string | null,
  endTime: string | null
): number {
  if (!startTime || !endTime) return 0

  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)

  return (eh * 60 + em) - (sh * 60 + sm)
}

/**
 * Format a duration in minutes as "H:MM" (e.g. 90 -> "1:30", 7560 -> "126:00").
 */
export function formatMinutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Returns true if the given Date falls on a Saturday. */
export function isSaturday(date: Date): boolean {
  return date.getDay() === 6
}

/** Returns true if the given Date falls on a Sunday. */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}
