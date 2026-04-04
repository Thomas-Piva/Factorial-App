import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { ShiftTemplate } from '@/types/database'

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// ── Helper ────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const template1: ShiftTemplate = {
  id: 'tmpl-1',
  store_id: 'store-1',
  created_by: 'u-admin',
  name: 'Mattina',
  shift_type: 'work_shift',
  start_time: '08:00',
  end_time: '16:00',
  color: '#4ade80',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── Reset mocks ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockInsert.mockReturnValue({ select: mockSelect })
  mockSelect.mockResolvedValue({ data: [template1], error: null })
  mockEq.mockResolvedValue({ data: null, error: null })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    eq: mockEq,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useCreateTemplate
// ─────────────────────────────────────────────────────────────────────────────

import { useCreateTemplate } from '@/lib/mutations/templates'

describe('useCreateTemplate', () => {
  it('calls supabase insert with correct data', async () => {
    const input = {
      store_id: 'store-1',
      created_by: 'u-admin',
      name: 'Mattina',
      shift_type: 'work_shift' as const,
      color: '#4ade80',
    }

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFrom).toHaveBeenCalledWith('shift_template')
    expect(mockInsert).toHaveBeenCalledWith(input)
  })

  it('returns the created template on success', async () => {
    const input = {
      store_id: 'store-1',
      created_by: 'u-admin',
      name: 'Mattina',
      shift_type: 'work_shift' as const,
      color: '#4ade80',
    }

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(template1)
  })

  it('sets isError when supabase returns an error', async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insert failed' },
    })

    const input = {
      store_id: 'store-1',
      created_by: 'u-admin',
      name: 'Mattina',
      shift_type: 'work_shift' as const,
      color: '#4ade80',
    }

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('Insert failed')
  })

  it('invalidates templates cache on success', async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const input = {
      store_id: 'store-1',
      created_by: 'u-admin',
      name: 'Mattina',
      shift_type: 'work_shift' as const,
      color: '#4ade80',
    }

    const { result } = renderHook(() => useCreateTemplate(), { wrapper })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] }),
    )
  })

  it('handles null optional fields without error', async () => {
    const input = {
      store_id: 'store-1',
      created_by: 'u-admin',
      name: 'Rest Day',
      shift_type: 'rest_day' as const,
      color: '#gray',
      start_time: null,
      end_time: null,
    }

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInsert).toHaveBeenCalledWith(input)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateTemplate
// ─────────────────────────────────────────────────────────────────────────────

import { useUpdateTemplate } from '@/lib/mutations/templates'

describe('useUpdateTemplate', () => {
  it('calls supabase update with correct fields (excluding id)', async () => {
    const input = { id: 'tmpl-1', name: 'Serata', color: '#f00' }

    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFrom).toHaveBeenCalledWith('shift_template')
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Serata', color: '#f00' })
  })

  it('calls eq with the correct id', async () => {
    const input = { id: 'tmpl-1', name: 'Serata' }

    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockEq).toHaveBeenCalledWith('id', 'tmpl-1')
  })

  it('sets isError when supabase returns an error', async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'Update failed' } })
    mockUpdate.mockReturnValue({ eq: eqError })

    const input = { id: 'tmpl-1', name: 'Serata' }

    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('Update failed')
  })

  it('invalidates templates cache on success', async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const { result } = renderHook(() => useUpdateTemplate(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'tmpl-1', name: 'Serata' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['templates'] }),
    )
  })

  it('handles is_active false update', async () => {
    const input = { id: 'tmpl-1', is_active: false }

    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false })
  })
})
