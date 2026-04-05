/**
 * Task 0: Tests for storeId fix in home-content.tsx
 * Verifies that useMyStores is used to derive storeId (primary store first).
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/home"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [k: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// ── TanStack Query mocks ──────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Query hook mocks ──────────────────────────────────────────────────────────
const mockUseCurrentUser = vi.fn();
const mockUseMyStores = vi.fn();
const mockUseMyShiftsToday = vi.fn();
const mockUseColleaguesToday = vi.fn();

vi.mock("@/lib/queries/users", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useColleaguesToday: () => mockUseColleaguesToday(),
}));

vi.mock("@/lib/queries/stores", () => ({
  useMyStores: (userId: string | undefined) => mockUseMyStores(userId),
}));

vi.mock("@/lib/queries/shifts", () => ({
  useMyShiftsToday: (userId: string | undefined, storeId: string | undefined) =>
    mockUseMyShiftsToday(userId, storeId),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: "user-1",
  email: "mario@test.com",
  first_name: "Mario",
  last_name: "Rossi",
  preferred_name: null,
  pronouns: null,
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: "employee" as const,
  admission_date: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MOCK_PRIMARY_STORE = {
  id: "store-primary",
  name: "Negozio Centro",
  code: "NCT",
  address: "Via Roma 1",
  city: "Milano",
  phone: null,
  is_active: true,
  is_primary: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MOCK_SECONDARY_STORE = {
  id: "store-secondary",
  name: "Negozio Periferia",
  code: "NPF",
  address: "Via Garibaldi 10",
  city: "Milano",
  phone: null,
  is_active: true,
  is_primary: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function setupDefaultMocks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER, isLoading: false });
  mockUseMyShiftsToday.mockReturnValue({ data: [], isLoading: false });
  mockUseColleaguesToday.mockReturnValue({ data: [], isLoading: false });
}

// ── Import after mocks ────────────────────────────────────────────────────────
import HomeContent from "../_components/home-content";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HomeContent — storeId from useMyStores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("calls useMyShiftsToday with primary store id when user has a primary store", () => {
    mockUseMyStores.mockReturnValue({
      data: [MOCK_SECONDARY_STORE, MOCK_PRIMARY_STORE],
      isLoading: false,
    });

    render(<HomeContent />, { wrapper });

    expect(mockUseMyShiftsToday).toHaveBeenCalledWith(
      "user-1",
      "store-primary",
    );
  });

  it("calls useMyShiftsToday with first store id when user has no primary store", () => {
    mockUseMyStores.mockReturnValue({
      data: [{ ...MOCK_SECONDARY_STORE, is_primary: false }],
      isLoading: false,
    });

    render(<HomeContent />, { wrapper });

    expect(mockUseMyShiftsToday).toHaveBeenCalledWith(
      "user-1",
      "store-secondary",
    );
  });

  it("calls useMyShiftsToday with undefined storeId when user has no store memberships", () => {
    mockUseMyStores.mockReturnValue({ data: [], isLoading: false });

    render(<HomeContent />, { wrapper });

    // With no stores, storeId is undefined — query should be disabled
    expect(mockUseMyShiftsToday).toHaveBeenCalledWith("user-1", undefined);
  });

  it("shows loading state when stores are loading", () => {
    mockUseMyStores.mockReturnValue({ data: undefined, isLoading: true });
    mockUseMyShiftsToday.mockReturnValue({ data: [], isLoading: true });

    render(<HomeContent />, { wrapper });

    // When loading, at least one spinner should appear (TurnoOggiCard)
    const spinners = screen.queryAllByRole("status");
    expect(spinners.length).toBeGreaterThan(0);
  });
});
