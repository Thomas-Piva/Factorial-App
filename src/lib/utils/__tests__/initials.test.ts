import { describe, it, expect } from 'vitest'
import { getInitials, getDisplayName } from '../initials'

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('Marco', 'Rossi')).toBe('MR')
  })

  it('handles lowercase names', () => {
    expect(getInitials('giulia', 'bianchi')).toBe('GB')
  })

  it('handles single-character names', () => {
    expect(getInitials('A', 'B')).toBe('AB')
  })

  it('handles accented characters', () => {
    expect(getInitials('Élena', 'Ó Brien')).toBe('EO')
  })
})

describe('getDisplayName', () => {
  it('returns preferred_name when set', () => {
    expect(getDisplayName('Marco', 'marco')).toBe('marco')
  })

  it('falls back to first_name when preferred_name is null', () => {
    expect(getDisplayName('Marco', null)).toBe('Marco')
  })

  it('falls back to first_name when preferred_name is empty string', () => {
    expect(getDisplayName('Marco', '')).toBe('Marco')
  })
})
