/**
 * Task 4: Tests for /assenze page (Absence management)
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/assenze'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

// ── TanStack Query wrapper ────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

// ── Query hook mocks ──────────────────────────────────────────────────────────
const mockUseCurrentUser = vi.fn()
const mockUseMyStores = vi.fn()
const mockUseAbsencesByStoreMonth = vi.fn()

vi.mock('@/lib/queries/users', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

vi.mock('@/lib/queries/stores', () => ({
  useMyStores: (userId: string | undefined) => mockUseMyStores(userId),
}))

vi.mock('@/lib/queries/shifts', () => ({
  useAbsencesByStoreMonth: (
    storeId: string | undefined,
    month: string | undefined,
  ) => mockUseAbsencesByStoreMonth(storeId, month),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: 'user-1',
  email: 'mario@test.com',
  first_name: 'Mario',
  last_name: 'Rossi',
  preferred_name: null,
  pronouns: null,
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: 'employee' as const,
  admission_date: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const MOCK_STORE = {
  id: 'store-1',
  name: 'Negozio Centro',
  code: 'NCT',
  address: 'Via Roma 1',
  city: 'Milano',
  phone: null,
  is_active: true,
  is_primary: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const MOCK_ABSENCE = {
  id: 'absence-1',
  user_id: 'user-1',
  store_id: 'store-1',
  template_id: null,
  created_by: 'manager-1',
  date: '2026-04-10',
  shift_type: 'rest_day' as const,
  label: 'Riposo',
  start_time: null,
  end_time: null,
  color: '#FF0000',
  published_at: '2026-04-01T00:00:00Z',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  user: MOCK_USER,
}

// Fixed date: 2026-04-05
const TODAY = new Date('2026-04-05')

function setupDefaultMocks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER, isLoading: false })
  mockUseMyStores.mockReturnValue({ data: [MOCK_STORE], isLoading: false })
  mockUseAbsencesByStoreMonth.mockReturnValue({ data: [], isLoading: false })
}

// ── Import after mocks ────────────────────────────────────────────────────────
import AssenzeContent from '../_components/assenze-content'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AssenzeContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
    setupDefaultMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "Assenze" heading', () => {
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByRole('heading', { name: /assenze/i })).toBeInTheDocument()
  })

  it('has data-testid="assenze-page"', () => {
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByTestId('assenze-page')).toBeInTheDocument()
  })

  it('renders month navigator with current month label in Italian', () => {
    render(<AssenzeContent />, { wrapper })
    // April 2026 = "Aprile 2026"
    expect(screen.getByText(/aprile 2026/i)).toBeInTheDocument()
  })

  it('left chevron navigates to previous month', () => {
    render(<AssenzeContent />, { wrapper })
    const prevBtn = screen.getByLabelText(/mese precedente/i)
    fireEvent.click(prevBtn)
    expect(screen.getByText(/marzo 2026/i)).toBeInTheDocument()
  })

  it('right chevron navigates to next month', () => {
    render(<AssenzeContent />, { wrapper })
    const nextBtn = screen.getByLabelText(/mese successivo/i)
    fireEvent.click(nextBtn)
    expect(screen.getByText(/maggio 2026/i)).toBeInTheDocument()
  })

  it('shows LoadingSpinner while loading', () => {
    mockUseAbsencesByStoreMonth.mockReturnValue({ data: undefined, isLoading: true })
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows absence list when data loads', () => {
    mockUseAbsencesByStoreMonth.mockReturnValue({
      data: [MOCK_ABSENCE],
      isLoading: false,
    })
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByTestId('assenze-list')).toBeInTheDocument()
  })

  it('each absence row shows user full name', () => {
    mockUseAbsencesByStoreMonth.mockReturnValue({
      data: [MOCK_ABSENCE],
      isLoading: false,
    })
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
  })

  it('each absence row shows the date', () => {
    mockUseAbsencesByStoreMonth.mockReturnValue({
      data: [MOCK_ABSENCE],
      isLoading: false,
    })
    render(<AssenzeContent />, { wrapper })
    // date 2026-04-10 — formatted
    expect(screen.getByText(/10\/04/)).toBeInTheDocument()
  })

  it('shows EmptyState when no absences for month', () => {
    mockUseAbsencesByStoreMonth.mockReturnValue({ data: [], isLoading: false })
    render(<AssenzeContent />, { wrapper })
    expect(screen.getByTestId('assenze-empty')).toBeInTheDocument()
  })
})
