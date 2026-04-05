import { describe, it, expect } from 'vitest'
import { buildShiftGrid } from '../shift-grid'
import type { ShiftAssignment, User } from '@/types/database'
import type { ShiftGridRow } from '@/types/domain'

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'Mario',
    last_name: 'Rossi',
    preferred_name: null,
    pronouns: null,
    birth_date: null,
    legal_gender: null,
    avatar_url: null,
    role: 'employee',
    admission_date: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeAssignment(overrides: Partial<ShiftAssignment> = {}): ShiftAssignment {
  return {
    id: 'assign-1',
    user_id: 'user-1',
    store_id: 'store-1',
    template_id: null,
    created_by: 'manager-1',
    date: '2026-04-07',
    shift_type: 'work_shift',
    label: 'Apertura',
    start_time: '09:00',
    end_time: '14:00',
    color: '#234428',
    published_at: '2026-04-01T00:00:00Z',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const USER_1 = makeUser({ id: 'user-1', first_name: 'Mario', last_name: 'Rossi' })
const USER_2 = makeUser({ id: 'user-2', first_name: 'Anna', last_name: 'Bianchi' })
const USER_3 = makeUser({ id: 'user-3', first_name: 'Carlo', last_name: 'Zeri' })

// ── Tests ────────────────────────────────────────────────────────────────────

describe('buildShiftGrid', () => {
  describe('empty / null input', () => {
    it('returns empty array for empty assignments list', () => {
      const result = buildShiftGrid([], [])
      expect(result).toEqual([])
    })

    it('returns empty array when users list is empty', () => {
      const assignments = [makeAssignment()]
      const result = buildShiftGrid(assignments, [])
      expect(result).toEqual([])
    })

    it('returns empty cells for users with no assignments', () => {
      const result = buildShiftGrid([], [USER_1])
      expect(result).toHaveLength(1)
      expect(result[0].cells).toEqual({})
    })
  })

  describe('single user, single assignment', () => {
    it('creates one row for one user', () => {
      const assignment = makeAssignment({ user_id: USER_1.id })
      const result = buildShiftGrid([assignment], [USER_1])
      expect(result).toHaveLength(1)
    })

    it('populates the cell for the correct date', () => {
      const assignment = makeAssignment({ user_id: USER_1.id, date: '2026-04-07' })
      const result = buildShiftGrid([assignment], [USER_1])
      expect(result[0].cells['2026-04-07']).toBeDefined()
    })

    it('includes the shift block in the cell', () => {
      const assignment = makeAssignment({ user_id: USER_1.id, date: '2026-04-07', label: 'Apertura' })
      const result = buildShiftGrid([assignment], [USER_1])
      const cell = result[0].cells['2026-04-07']
      expect(cell.blocks).toHaveLength(1)
      expect(cell.blocks[0].label).toBe('Apertura')
    })

    it('maps ShiftAssignment fields to ShiftBlock correctly', () => {
      const assignment = makeAssignment({
        id: 'assign-99',
        user_id: USER_1.id,
        store_id: 'store-99',
        date: '2026-04-07',
        label: 'Chiusura',
        start_time: '14:00',
        end_time: '20:00',
        color: '#FF0000',
        shift_type: 'work_shift',
        published_at: '2026-04-01T00:00:00Z',
        notes: 'test note',
        template_id: 'tmpl-1',
      })
      const result = buildShiftGrid([assignment], [USER_1])
      const block = result[0].cells['2026-04-07'].blocks[0]
      expect(block.id).toBe('assign-99')
      expect(block.user_id).toBe(USER_1.id)
      expect(block.store_id).toBe('store-99')
      expect(block.template_id).toBe('tmpl-1')
      expect(block.start_time).toBe('14:00')
      expect(block.end_time).toBe('20:00')
      expect(block.color).toBe('#FF0000')
      expect(block.shift_type).toBe('work_shift')
      expect(block.notes).toBe('test note')
      expect(block.published_at).toBe('2026-04-01T00:00:00Z')
    })
  })

  describe('split shifts (multiple blocks per user per day)', () => {
    it('groups multiple assignments on the same date into one cell', () => {
      const a1 = makeAssignment({ id: 'a1', user_id: USER_1.id, date: '2026-04-07', label: 'Mattina', start_time: '09:00', end_time: '13:00' })
      const a2 = makeAssignment({ id: 'a2', user_id: USER_1.id, date: '2026-04-07', label: 'Pomeriggio', start_time: '15:00', end_time: '19:00' })
      const result = buildShiftGrid([a1, a2], [USER_1])
      const cell = result[0].cells['2026-04-07']
      expect(cell.blocks).toHaveLength(2)
    })

    it('preserves the order of blocks within a cell (by insertion order)', () => {
      const a1 = makeAssignment({ id: 'a1', user_id: USER_1.id, date: '2026-04-07', label: 'First' })
      const a2 = makeAssignment({ id: 'a2', user_id: USER_1.id, date: '2026-04-07', label: 'Second' })
      const result = buildShiftGrid([a1, a2], [USER_1])
      const cell = result[0].cells['2026-04-07']
      expect(cell.blocks[0].label).toBe('First')
      expect(cell.blocks[1].label).toBe('Second')
    })
  })

  describe('multiple users', () => {
    it('creates one row per user', () => {
      const a1 = makeAssignment({ user_id: USER_1.id })
      const a2 = makeAssignment({ id: 'a2', user_id: USER_2.id })
      const result = buildShiftGrid([a1, a2], [USER_1, USER_2])
      expect(result).toHaveLength(2)
    })

    it('does not mix assignments between users', () => {
      const a1 = makeAssignment({ id: 'a1', user_id: USER_1.id, date: '2026-04-07', label: 'Rossi shift' })
      const a2 = makeAssignment({ id: 'a2', user_id: USER_2.id, date: '2026-04-07', label: 'Bianchi shift' })
      const result = buildShiftGrid([a1, a2], [USER_1, USER_2])
      const rossiRow = result.find((r: ShiftGridRow) => r.user.id === USER_1.id)!
      const bianchiRow = result.find((r: ShiftGridRow) => r.user.id === USER_2.id)!
      expect(rossiRow.cells['2026-04-07'].blocks[0].label).toBe('Rossi shift')
      expect(bianchiRow.cells['2026-04-07'].blocks[0].label).toBe('Bianchi shift')
    })
  })

  describe('sorting by last_name', () => {
    it('sorts rows alphabetically by last_name', () => {
      const aZeri = makeAssignment({ id: 'a1', user_id: USER_3.id })
      const aBianchi = makeAssignment({ id: 'a2', user_id: USER_2.id })
      const aRossi = makeAssignment({ id: 'a3', user_id: USER_1.id })
      const result = buildShiftGrid([aZeri, aBianchi, aRossi], [USER_3, USER_2, USER_1])
      expect(result[0].user.last_name).toBe('Bianchi')
      expect(result[1].user.last_name).toBe('Rossi')
      expect(result[2].user.last_name).toBe('Zeri')
    })

    it('includes users with no assignments in sorted position', () => {
      // USER_2 (Bianchi) has no assignment
      const aRossi = makeAssignment({ id: 'a1', user_id: USER_1.id })
      const aZeri = makeAssignment({ id: 'a2', user_id: USER_3.id })
      const result = buildShiftGrid([aRossi, aZeri], [USER_1, USER_2, USER_3])
      expect(result[0].user.last_name).toBe('Bianchi')
      expect(result[1].user.last_name).toBe('Rossi')
      expect(result[2].user.last_name).toBe('Zeri')
    })
  })

  describe('user enrichment (UserWithInitials)', () => {
    it('computes initials from first_name and last_name', () => {
      const result = buildShiftGrid([], [USER_1])
      expect(result[0].user.initials).toBe('MR')
    })

    it('computes displayName using preferred_name when set', () => {
      const user = makeUser({ id: 'u', first_name: 'Mario', last_name: 'Rossi', preferred_name: 'Marietto' })
      const result = buildShiftGrid([], [user])
      expect(result[0].user.displayName).toBe('Marietto')
    })

    it('falls back to first_name when preferred_name is null', () => {
      const user = makeUser({ id: 'u', first_name: 'Mario', last_name: 'Rossi', preferred_name: null })
      const result = buildShiftGrid([], [user])
      expect(result[0].user.displayName).toBe('Mario')
    })

    it('handles accented characters in initials', () => {
      const user = makeUser({ id: 'u', first_name: 'Élise', last_name: 'Ören' })
      const result = buildShiftGrid([], [user])
      expect(result[0].user.initials).toBe('EO')
    })
  })

  describe('ShiftCell metadata', () => {
    it('cell contains userId and date', () => {
      const assignment = makeAssignment({ user_id: USER_1.id, date: '2026-04-08' })
      const result = buildShiftGrid([assignment], [USER_1])
      const cell = result[0].cells['2026-04-08']
      expect(cell.userId).toBe(USER_1.id)
      expect(cell.date).toBe('2026-04-08')
    })
  })

  describe('multiple dates', () => {
    it('creates separate cells for different dates', () => {
      const a1 = makeAssignment({ id: 'a1', user_id: USER_1.id, date: '2026-04-07' })
      const a2 = makeAssignment({ id: 'a2', user_id: USER_1.id, date: '2026-04-08' })
      const result = buildShiftGrid([a1, a2], [USER_1])
      expect(result[0].cells['2026-04-07']).toBeDefined()
      expect(result[0].cells['2026-04-08']).toBeDefined()
      expect(Object.keys(result[0].cells)).toHaveLength(2)
    })
  })

  describe('assignments for unknown users (defensive)', () => {
    it('ignores assignments for users not in the users list', () => {
      const assignment = makeAssignment({ user_id: 'unknown-user' })
      const result = buildShiftGrid([assignment], [USER_1])
      // USER_1 row should have no cells for that date
      expect(result[0].cells['2026-04-07']).toBeUndefined()
    })
  })

  describe('large dataset (performance sanity)', () => {
    it('handles 100 users with 5 assignments each without error', () => {
      const users: User[] = Array.from({ length: 100 }, (_, i) =>
        makeUser({ id: `user-${i}`, first_name: 'Name', last_name: `Last${String(i).padStart(3, '0')}` })
      )
      const assignments: ShiftAssignment[] = users.flatMap((u, i) =>
        Array.from({ length: 5 }, (_, j) =>
          makeAssignment({ id: `a-${i}-${j}`, user_id: u.id, date: `2026-04-${String(j + 1).padStart(2, '0')}` })
        )
      )
      const result = buildShiftGrid(assignments, users)
      expect(result).toHaveLength(100)
      expect(result[0].user.last_name).toBe('Last000')
    })
  })
})
