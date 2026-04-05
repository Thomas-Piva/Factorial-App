/**
 * Task 1: Tests for /turni page (shift scheduling grid)
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// ── Mock export-pdf to avoid PDF generation in tests ─────────────────────────
vi.mock('@/lib/utils/export-pdf', () => ({
  exportShiftsPdf: vi.fn(),
}))

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/turni'),
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
const mockUseShiftsByStoreWeek = vi.fn()
const mockUseUsers = vi.fn()

vi.mock('@/lib/queries/users', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useUsers: () => mockUseUsers(),
}))

vi.mock('@/lib/queries/stores', () => ({
  useMyStores: (userId: string | undefined) => mockUseMyStores(userId),
}))

vi.mock('@/lib/queries/shifts', () => ({
  useShiftsByStoreWeek: (storeId: string | undefined, weekStart: string | undefined) =>
    mockUseShiftsByStoreWeek(storeId, weekStart),
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

const MOCK_USER_2 = {
  ...MOCK_USER,
  id: 'user-2',
  first_name: 'Anna',
  last_name: 'Bianchi',
  email: 'anna@test.com',
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

const MOCK_SHIFT = {
  id: 'shift-1',
  user_id: 'user-1',
  store_id: 'store-1',
  template_id: null,
  created_by: 'manager-1',
  date: '2026-03-30', // Monday of week
  shift_type: 'work_shift' as const,
  label: 'Apertura',
  start_time: '09:00',
  end_time: '14:00',
  color: '#234428',
  published_at: '2026-03-28T00:00:00Z',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// Fixed date: Sunday 2026-04-05 (week of Mar 30 - Apr 5)
const TODAY = new Date('2026-04-05')

function setupDefaultMocks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER, isLoading: false })
  mockUseMyStores.mockReturnValue({ data: [MOCK_STORE], isLoading: false })
  mockUseShiftsByStoreWeek.mockReturnValue({ data: [], isLoading: false })
  mockUseUsers.mockReturnValue({ data: [MOCK_USER], isLoading: false })
}

// ── Import after mocks ────────────────────────────────────────────────────────
import TurniContent from '../_components/turni-content'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TurniContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
    setupDefaultMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "Turni" heading', () => {
    render(<TurniContent />, { wrapper })
    expect(screen.getByRole('heading', { name: /turni/i })).toBeInTheDocument()
  })

  it('has data-testid="turni-page"', () => {
    render(<TurniContent />, { wrapper })
    expect(screen.getByTestId('turni-page')).toBeInTheDocument()
  })

  it('renders week navigator with prev/next buttons', () => {
    render(<TurniContent />, { wrapper })
    expect(screen.getByLabelText(/settimana precedente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/settimana successiva/i)).toBeInTheDocument()
  })

  it('shows current week label', () => {
    render(<TurniContent />, { wrapper })
    // Week of 2026-04-05 is week 14 in ISO, Monday = Mar 30
    // getWeekRange gives label "Settimana N: Mmm YYYY"
    expect(screen.getByText(/settimana/i)).toBeInTheDocument()
  })

  it('clicking prev week changes the week label to the previous week', () => {
    render(<TurniContent />, { wrapper })
    const initialLabel = screen.getByTestId('week-label').textContent

    const prevBtn = screen.getByLabelText(/settimana precedente/i)
    fireEvent.click(prevBtn)

    const newLabel = screen.getByTestId('week-label').textContent
    expect(newLabel).not.toBe(initialLabel)
  })

  it('clicking next week changes the week label to the next week', () => {
    render(<TurniContent />, { wrapper })
    const initialLabel = screen.getByTestId('week-label').textContent

    const nextBtn = screen.getByLabelText(/settimana successiva/i)
    fireEvent.click(nextBtn)

    const newLabel = screen.getByTestId('week-label').textContent
    expect(newLabel).not.toBe(initialLabel)
  })

  it('shows LoadingSpinner while data loads', () => {
    mockUseShiftsByStoreWeek.mockReturnValue({ data: undefined, isLoading: true })
    mockUseUsers.mockReturnValue({ data: undefined, isLoading: true })

    render(<TurniContent />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows EmptyState when no users', () => {
    mockUseUsers.mockReturnValue({ data: [], isLoading: false })
    mockUseShiftsByStoreWeek.mockReturnValue({ data: [], isLoading: false })

    render(<TurniContent />, { wrapper })
    expect(screen.getByTestId('turni-empty')).toBeInTheDocument()
  })

  it('renders shift grid with user rows when data loaded', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_USER, MOCK_USER_2], isLoading: false })
    mockUseShiftsByStoreWeek.mockReturnValue({ data: [MOCK_SHIFT], isLoading: false })

    render(<TurniContent />, { wrapper })
    expect(screen.getByTestId('turni-grid')).toBeInTheDocument()
  })

  it('each grid row shows the user display name', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_USER, MOCK_USER_2], isLoading: false })
    mockUseShiftsByStoreWeek.mockReturnValue({ data: [], isLoading: false })

    render(<TurniContent />, { wrapper })
    // Users sorted by last_name: Bianchi first, then Rossi
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Mario')).toBeInTheDocument()
  })

  it('"Esporta PDF" button is visible when grid has rows', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_USER, MOCK_USER_2], isLoading: false })
    mockUseShiftsByStoreWeek.mockReturnValue({ data: [MOCK_SHIFT], isLoading: false })

    render(<TurniContent />, { wrapper })
    expect(screen.getByTestId('export-pdf-btn')).toBeInTheDocument()
  })

  it('"Esporta PDF" button is NOT visible when grid is empty', () => {
    mockUseUsers.mockReturnValue({ data: [], isLoading: false })
    mockUseShiftsByStoreWeek.mockReturnValue({ data: [], isLoading: false })

    render(<TurniContent />, { wrapper })
    expect(screen.queryByTestId('export-pdf-btn')).not.toBeInTheDocument()
  })
})
