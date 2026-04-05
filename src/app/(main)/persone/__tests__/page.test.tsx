/**
 * Task 3: Tests for /persone page (Team directory)
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/persone'),
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
const mockUseUsers = vi.fn()

vi.mock('@/lib/queries/users', () => ({
  useUsers: () => mockUseUsers(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_EMPLOYEE = {
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

const MOCK_MANAGER = {
  id: 'user-2',
  email: 'anna@test.com',
  first_name: 'Anna',
  last_name: 'Bianchi',
  preferred_name: null,
  pronouns: null,
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: 'manager' as const,
  admission_date: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const MOCK_ADMIN = {
  id: 'user-3',
  email: 'admin@test.com',
  first_name: 'Carlo',
  last_name: 'Verdi',
  preferred_name: null,
  pronouns: null,
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: 'admin' as const,
  admission_date: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── Import after mocks ────────────────────────────────────────────────────────
import PersoneContent from '../_components/persone-content'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PersoneContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Persone" heading', () => {
    mockUseUsers.mockReturnValue({ data: [], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByRole('heading', { name: /persone/i })).toBeInTheDocument()
  })

  it('has data-testid="persone-page"', () => {
    mockUseUsers.mockReturnValue({ data: [], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByTestId('persone-page')).toBeInTheDocument()
  })

  it('shows LoadingSpinner while loading', () => {
    mockUseUsers.mockReturnValue({ data: undefined, isLoading: true })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows user list when data loads', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_EMPLOYEE, MOCK_MANAGER], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByTestId('persone-list')).toBeInTheDocument()
  })

  it('shows full name for each user', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_EMPLOYEE, MOCK_MANAGER], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
  })

  it('shows role badge "Dipendente" for employee', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_EMPLOYEE], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByText('Dipendente')).toBeInTheDocument()
  })

  it('shows role badge "Manager" for manager', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_MANAGER], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByText('Manager')).toBeInTheDocument()
  })

  it('shows role badge "Admin" for admin', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_ADMIN], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('search input filters users by last name', () => {
    mockUseUsers.mockReturnValue({
      data: [MOCK_EMPLOYEE, MOCK_MANAGER],
      isLoading: false,
    })
    render(<PersoneContent />, { wrapper })

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Rossi' } })

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.queryByText('Anna Bianchi')).not.toBeInTheDocument()
  })

  it('search input filters users by first name', () => {
    mockUseUsers.mockReturnValue({
      data: [MOCK_EMPLOYEE, MOCK_MANAGER],
      isLoading: false,
    })
    render(<PersoneContent />, { wrapper })

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Anna' } })

    expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument()
    expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
  })

  it('shows EmptyState when no users match filter', () => {
    mockUseUsers.mockReturnValue({ data: [MOCK_EMPLOYEE], isLoading: false })
    render(<PersoneContent />, { wrapper })

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'xyz-nomatch' } })

    expect(screen.getByTestId('persone-empty')).toBeInTheDocument()
  })

  it('shows EmptyState when user list is empty', () => {
    mockUseUsers.mockReturnValue({ data: [], isLoading: false })
    render(<PersoneContent />, { wrapper })
    expect(screen.getByTestId('persone-empty')).toBeInTheDocument()
  })
})
