import type { ShiftAssignment, User } from '@/types/database'
import type { ShiftBlock, ShiftCell, ShiftGridRow, UserWithInitials } from '@/types/domain'
import { getInitials, getDisplayName } from './initials'

/**
 * Build a shift grid from a flat list of ShiftAssignment rows and a list of users.
 *
 * - Groups assignments by user, then by date → ShiftCell[]
 * - Each cell may contain multiple ShiftBlock objects (split shifts)
 * - Rows are sorted by user last_name (case-insensitive, locale-aware)
 * - Assignments for users not present in the `users` list are silently ignored
 */
export function buildShiftGrid(
  assignments: ShiftAssignment[],
  users: User[],
): ShiftGridRow[] {
  // Build a lookup map: userId → UserWithInitials
  const userMap = new Map<string, UserWithInitials>()
  for (const user of users) {
    userMap.set(user.id, enrichUser(user))
  }

  // Accumulate cells per user: userId → (date → ShiftCell)
  const cellsByUser = new Map<string, Record<string, ShiftCell>>()

  // Initialise every known user with an empty cells record
  for (const user of users) {
    cellsByUser.set(user.id, {})
  }

  // Place each assignment into the correct cell
  for (const assignment of assignments) {
    const userId = assignment.user_id

    // Ignore assignments for users not in the provided list
    if (!userMap.has(userId)) {
      continue
    }

    const cells = cellsByUser.get(userId)! // always defined thanks to init above
    const date = assignment.date

    if (!cells[date]) {
      cells[date] = { userId, date, blocks: [] }
    }

    cells[date].blocks.push(toShiftBlock(assignment))
  }

  // Build sorted rows
  const rows: ShiftGridRow[] = []
  for (const user of users) {
    rows.push({
      user: userMap.get(user.id)!,
      cells: cellsByUser.get(user.id)!,
    })
  }

  // Sort by last_name ascending (Italian locale)
  rows.sort((a, b) => a.user.last_name.localeCompare(b.user.last_name, 'it', { sensitivity: 'base' }))

  return rows
}

// ── Private helpers ───────────────────────────────────────────────────────────

function enrichUser(user: User): UserWithInitials {
  return {
    ...user,
    initials: getInitials(user.first_name, user.last_name),
    displayName: getDisplayName(user.first_name, user.preferred_name),
  }
}

function toShiftBlock(assignment: ShiftAssignment): ShiftBlock {
  return {
    id: assignment.id,
    user_id: assignment.user_id,
    store_id: assignment.store_id,
    template_id: assignment.template_id,
    date: assignment.date,
    shift_type: assignment.shift_type,
    label: assignment.label,
    start_time: assignment.start_time,
    end_time: assignment.end_time,
    color: assignment.color,
    published_at: assignment.published_at,
    notes: assignment.notes,
  }
}
