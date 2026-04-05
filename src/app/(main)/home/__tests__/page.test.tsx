import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/home'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// ── Supabase client mock ──────────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockNot = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

const chainBase = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  not: mockNot,
  gte: vi.fn(),
  lte: vi.fn(),
}

// ── TanStack Query wrapper ────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

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

const MOCK_SHIFT = {
  id: 'shift-1',
  user_id: 'user-1',
  store_id: 'store-1',
  template_id: null,
  created_by: 'manager-1',
  date: new Date().toISOString().slice(0, 10),
  shift_type: 'work_shift' as const,
  label: 'Apertura',
  start_time: '09:00',
  end_time: '14:00',
  color: '#234428',
  published_at: '2026-04-01T00:00:00Z',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const MOCK_COLLEAGUE = {
  ...MOCK_USER,
  id: 'user-2',
  first_name: 'Anna',
  last_name: 'Bianchi',
  email: 'anna@test.com',
}

// ── Test setup ────────────────────────────────────────────────────────────────

function setupAuthMock(user = MOCK_USER) {
  mockGetUser.mockResolvedValue({ data: { user: { id: user.id } }, error: null })
  mockFrom.mockReturnValue(chainBase)
  mockSelect.mockReturnValue(chainBase)
  mockEq.mockReturnValue(chainBase)
  mockNot.mockReturnValue(chainBase)
}

// ── Imports (after mocks) ─────────────────────────────────────────────────────

// These are imported after mocks are set up to avoid module-load-time Supabase errors
import GreetingSection from '../_components/greeting-section'
import TurnoOggiCard from '../_components/turno-oggi-card'
import ColleghiOggiCard from '../_components/colleghi-oggi-card'
import ComunicazioniCard from '../_components/comunicazioni-card'

// ── GreetingSection tests ─────────────────────────────────────────────────────

describe('GreetingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthMock()
  })

  it('renders the greeting with displayName', () => {
    render(<GreetingSection displayName="Mario" />, { wrapper })
    expect(screen.getByText(/buongiorno/i)).toBeInTheDocument()
    expect(screen.getByText(/Mario/)).toBeInTheDocument()
  })

  it('renders Avatar with correct initials when no src', () => {
    render(<GreetingSection displayName="Mario" firstName="Mario" lastName="Rossi" />, { wrapper })
    expect(screen.getByText('MR')).toBeInTheDocument()
  })

  it('renders a greeting message that includes the name', () => {
    render(<GreetingSection displayName="Julieta" />, { wrapper })
    expect(screen.getByText(/Julieta/)).toBeInTheDocument()
  })
})

// ── TurnoOggiCard tests ───────────────────────────────────────────────────────

describe('TurnoOggiCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows EmptyState when shifts array is empty', () => {
    render(<TurnoOggiCard userId="user-1" storeId="store-1" shifts={[]} isLoading={false} />, { wrapper })
    expect(screen.getByText(/nessun turno oggi/i)).toBeInTheDocument()
  })

  it('shows a loading spinner while loading', () => {
    render(<TurnoOggiCard userId="user-1" storeId="store-1" shifts={[]} isLoading={true} />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders shift blocks when shifts are provided', () => {
    render(
      <TurnoOggiCard
        userId="user-1"
        storeId="store-1"
        shifts={[MOCK_SHIFT]}
        isLoading={false}
      />,
      { wrapper }
    )
    expect(screen.getByText('Apertura')).toBeInTheDocument()
  })

  it('renders multiple shift blocks for split shifts', () => {
    const shifts = [
      MOCK_SHIFT,
      { ...MOCK_SHIFT, id: 'shift-2', label: 'Pomeriggio', start_time: '15:00', end_time: '20:00' },
    ]
    render(
      <TurnoOggiCard userId="user-1" storeId="store-1" shifts={shifts} isLoading={false} />,
      { wrapper }
    )
    expect(screen.getByText('Apertura')).toBeInTheDocument()
    expect(screen.getByText('Pomeriggio')).toBeInTheDocument()
  })

  it('shows calendar_today icon in EmptyState', () => {
    render(<TurnoOggiCard userId="user-1" storeId="store-1" shifts={[]} isLoading={false} />, { wrapper })
    expect(screen.getByText('calendar_today')).toBeInTheDocument()
  })

  it('shows "Il tuo turno oggi" card title', () => {
    render(<TurnoOggiCard userId="user-1" storeId="store-1" shifts={[MOCK_SHIFT]} isLoading={false} />, { wrapper })
    expect(screen.getByText(/il tuo turno oggi/i)).toBeInTheDocument()
  })
})

// ── ColleghiOggiCard tests ────────────────────────────────────────────────────

describe('ColleghiOggiCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows EmptyState when colleagues list is empty', () => {
    render(<ColleghiOggiCard storeId="store-1" colleagues={[]} isLoading={false} />, { wrapper })
    expect(screen.getByText(/nessun collega in servizio oggi/i)).toBeInTheDocument()
  })

  it('shows a loading spinner while loading', () => {
    render(<ColleghiOggiCard storeId="store-1" colleagues={[]} isLoading={true} />, { wrapper })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders avatars for each colleague', () => {
    render(
      <ColleghiOggiCard
        storeId="store-1"
        colleagues={[MOCK_COLLEAGUE]}
        isLoading={false}
      />,
      { wrapper }
    )
    // Avatar initials = AB
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('renders a group icon in EmptyState', () => {
    render(<ColleghiOggiCard storeId="store-1" colleagues={[]} isLoading={false} />, { wrapper })
    expect(screen.getByText('group')).toBeInTheDocument()
  })

  it('shows "Colleghi oggi" card title', () => {
    render(<ColleghiOggiCard storeId="store-1" colleagues={[MOCK_COLLEAGUE]} isLoading={false} />, { wrapper })
    expect(screen.getByText(/colleghi oggi/i)).toBeInTheDocument()
  })

  it('shows colleague full name or initials', () => {
    render(
      <ColleghiOggiCard storeId="store-1" colleagues={[MOCK_COLLEAGUE]} isLoading={false} />,
      { wrapper }
    )
    // Avatar initials visible for user without src
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})

// ── ComunicazioniCard tests ───────────────────────────────────────────────────

describe('ComunicazioniCard', () => {
  it('renders a comunicazioni card with placeholder text', () => {
    render(<ComunicazioniCard />, { wrapper })
    expect(screen.getByText(/comunicazioni/i)).toBeInTheDocument()
    expect(screen.getByText(/nessuna nuova comunicazione/i)).toBeInTheDocument()
  })

  it('renders the notifications icon', () => {
    render(<ComunicazioniCard />, { wrapper })
    expect(screen.getByText('notifications')).toBeInTheDocument()
  })
})
