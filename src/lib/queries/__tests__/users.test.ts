import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { User } from '@/types/database'

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockNot = vi.fn()
const mockFrom = vi.fn()
const mockAuth = {
  getUser: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: mockAuth,
  })),
}))

// ── Helper: query-client wrapper ──────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const user1: User = {
  id: 'u-1',
  email: 'alice@example.com',
  first_name: 'Alice',
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
}

const user2: User = {
  ...user1,
  id: 'u-2',
  email: 'bob@example.com',
  first_name: 'Bob',
  last_name: 'Verdi',
}

// ── Reset mocks ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  const chain = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    not: mockNot,
  }

  mockFrom.mockReturnValue(chain)
  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockNot.mockResolvedValue({ data: [], error: null })

  mockAuth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useUsers
// ─────────────────────────────────────────────────────────────────────────────

import { useUsers } from '@/lib/queries/users'

describe('useUsers', () => {
  it('returns all users', async () => {
    mockOrder.mockResolvedValueOnce({ data: [user1, user2], error: null })

    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([user1, user2])
  })

  it('is in loading state initially', () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}))

    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('sets isError when Supabase returns an error', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'forbidden' },
    })

    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('returns empty array when there are no users', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null })

    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useCurrentUser
// ─────────────────────────────────────────────────────────────────────────────

import { useCurrentUser } from '@/lib/queries/users'

describe('useCurrentUser', () => {
  it('returns the current authenticated user profile', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u-1' } },
      error: null,
    })
    mockOrder.mockResolvedValueOnce({ data: [user1], error: null })

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(user1)
  })

  it('returns null when user profile does not exist in the database', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u-ghost' } },
      error: null,
    })
    mockOrder.mockResolvedValueOnce({ data: [], error: null })

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('returns null when no authenticated session exists', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('sets isError when auth.getUser returns an error', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    })

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('sets isError when the user profile DB query fails', async () => {
    mockAuth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u-1' } },
      error: null,
    })
    // The profile select call resolves with an error
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'row not found' },
    })

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useColleaguesToday
// ─────────────────────────────────────────────────────────────────────────────

import { useColleaguesToday } from '@/lib/queries/users'

describe('useColleaguesToday', () => {
  it('returns users working at the store today via shift_assignment join', async () => {
    // The implementation queries shift_assignment with user:user_id(*) join,
    // then deduplicates and sorts by last_name.
    mockNot.mockResolvedValueOnce({
      data: [{ user: user1 }, { user: user2 }],
      error: null,
    })

    const { result } = renderHook(
      () => useColleaguesToday('store-1'),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Sorted by last_name: Rossi (user1) < Verdi (user2)
    expect(result.current.data).toEqual([user1, user2])
  })

  it('deduplicates users with split shifts (multiple rows per user per day)', async () => {
    // user1 appears twice because they have two shift blocks on the same day
    mockNot.mockResolvedValueOnce({
      data: [{ user: user1 }, { user: user1 }],
      error: null,
    })

    const { result } = renderHook(
      () => useColleaguesToday('store-1'),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([user1])
  })

  it('is disabled when storeId is undefined', () => {
    const { result } = renderHook(
      () => useColleaguesToday(undefined),
      { wrapper: makeWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('sets isError when Supabase returns an error', async () => {
    mockNot.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error' },
    })

    const { result } = renderHook(
      () => useColleaguesToday('store-1'),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
