import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/calendario"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── Supabase client mock ──────────────────────────────────────────────────────
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const chainBase = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  not: vi.fn(),
  gte: mockGte,
  lte: mockLte,
};

// ── TanStack Query wrapper ────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

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

const TODAY = new Date("2026-04-05"); // fixed date for tests

// ── Setup ─────────────────────────────────────────────────────────────────────
function setupMocks() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockFrom.mockReturnValue(chainBase);
  mockSelect.mockReturnValue(chainBase);
  mockEq.mockReturnValue(chainBase);
  mockGte.mockReturnValue(chainBase);
  mockLte.mockResolvedValue({ data: [], error: null });
  mockOrder.mockResolvedValue({ data: [MOCK_USER], error: null });
}

// ── Import after mocks ────────────────────────────────────────────────────────
import CalendarioPage from "../page";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CalendarioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    // Freeze to known date for stable assertions
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Month navigator", () => {
    it("renders the current month and year as header", () => {
      render(<CalendarioPage />, { wrapper });
      // April 2026 in Italian = "Aprile 2026"
      expect(screen.getByText(/aprile 2026/i)).toBeInTheDocument();
    });

    it("renders left chevron navigation button", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByLabelText(/mese precedente/i)).toBeInTheDocument();
    });

    it("renders right chevron navigation button", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByLabelText(/mese successivo/i)).toBeInTheDocument();
    });

    it("navigates to previous month on left chevron click", () => {
      render(<CalendarioPage />, { wrapper });
      const prevBtn = screen.getByLabelText(/mese precedente/i);
      fireEvent.click(prevBtn);
      expect(screen.getByText(/marzo 2026/i)).toBeInTheDocument();
    });

    it("navigates to next month on right chevron click", () => {
      render(<CalendarioPage />, { wrapper });
      const nextBtn = screen.getByLabelText(/mese successivo/i);
      fireEvent.click(nextBtn);
      expect(screen.getByText(/maggio 2026/i)).toBeInTheDocument();
    });

    it("navigates back across year boundary (Jan → Dec)", () => {
      vi.setSystemTime(new Date("2026-01-15"));
      render(<CalendarioPage />, { wrapper });
      const prevBtn = screen.getByLabelText(/mese precedente/i);
      fireEvent.click(prevBtn);
      expect(screen.getByText(/dicembre 2025/i)).toBeInTheDocument();
    });

    it("renders chevron_left icon text", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByText("chevron_left")).toBeInTheDocument();
    });

    it("renders chevron_right icon text", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByText("chevron_right")).toBeInTheDocument();
    });
  });

  describe("7-column week grid", () => {
    it("renders all 7 day-of-week headers", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByText("Lun")).toBeInTheDocument();
      expect(screen.getByText("Mar")).toBeInTheDocument();
      expect(screen.getByText("Mer")).toBeInTheDocument();
      expect(screen.getByText("Gio")).toBeInTheDocument();
      expect(screen.getByText("Ven")).toBeInTheDocument();
      expect(screen.getByText("Sab")).toBeInTheDocument();
      expect(screen.getByText("Dom")).toBeInTheDocument();
    });

    it("renders the day numbers of the current month", () => {
      render(<CalendarioPage />, { wrapper });
      // April has 30 days — check a few
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "15" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "30" })).toBeInTheDocument();
    });

    it("shows today (5) with a selected indicator by default", () => {
      render(<CalendarioPage />, { wrapper });
      // The "today" button should be visually distinct — test by aria-pressed or class
      const todayBtn = screen.getByRole("button", { name: "5" });
      expect(todayBtn).toHaveAttribute("data-selected", "true");
    });

    it("changing month clears same-number-day indicator from previous month", () => {
      render(<CalendarioPage />, { wrapper });
      // Go to May
      const nextBtn = screen.getByLabelText(/mese successivo/i);
      fireEvent.click(nextBtn);
      // Day 5 in May should NOT be selected
      const day5 = screen.getByRole("button", { name: "5" });
      expect(day5).not.toHaveAttribute("data-selected", "true");
    });
  });

  describe("Day selection", () => {
    it("selects a day when clicked", () => {
      render(<CalendarioPage />, { wrapper });
      const day10 = screen.getByRole("button", { name: "10" });
      fireEvent.click(day10);
      expect(day10).toHaveAttribute("data-selected", "true");
    });

    it("deselects previously selected day when new day is clicked", () => {
      render(<CalendarioPage />, { wrapper });
      const day5 = screen.getByRole("button", { name: "5" });
      const day10 = screen.getByRole("button", { name: "10" });
      fireEvent.click(day10);
      expect(day5).not.toHaveAttribute("data-selected", "true");
      expect(day10).toHaveAttribute("data-selected", "true");
    });
  });

  describe("Shift detail card below the grid", () => {
    it("renders a shift detail section below the calendar grid", () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByTestId("shift-detail-section")).toBeInTheDocument();
    });

    it("shows EmptyState or loading state for the shift detail section", () => {
      render(<CalendarioPage />, { wrapper });
      // Either loading spinner or empty state should be present
      const spinner = screen.queryByRole("status");
      const emptyMsgs = screen.queryAllByText(/nessun turno/i);
      expect(spinner !== null || emptyMsgs.length > 0).toBe(true);
    });
  });

  describe("page structure", () => {
    it("renders the Calendario heading", () => {
      render(<CalendarioPage />, { wrapper });
      expect(
        screen.getByRole("heading", { name: /calendario/i }),
      ).toBeInTheDocument();
    });

    it('has data-testid="calendario-page"', () => {
      render(<CalendarioPage />, { wrapper });
      expect(screen.getByTestId("calendario-page")).toBeInTheDocument();
    });
  });
});
