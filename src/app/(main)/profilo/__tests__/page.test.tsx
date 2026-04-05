/**
 * Phase 5: Tests for /profilo page
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/profilo"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── TanStack Query wrapper ────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Hook mocks ────────────────────────────────────────────────────────────────
const mockUseCurrentUser = vi.fn();
const mockMutate = vi.fn();
const mockUseUpdateProfile = vi.fn();

vi.mock("@/lib/queries/users", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/lib/mutations/profile", () => ({
  useUpdateProfile: () => mockUseUpdateProfile(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: "user-1",
  email: "mario@test.com",
  first_name: "Mario",
  last_name: "Rossi",
  preferred_name: "Mario R.",
  pronouns: "lui/lui",
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: "employee" as const,
  admission_date: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MOCK_MANAGER = { ...MOCK_USER, id: "user-2", role: "manager" as const };
const MOCK_ADMIN = { ...MOCK_USER, id: "user-3", role: "admin" as const };

function setupDefaultMocks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER, isLoading: false });
  mockUseUpdateProfile.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  });
}

// ── Import after mocks ────────────────────────────────────────────────────────
import ProfiloContent from "../_components/profilo-content";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProfiloContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('renders "Profilo" heading', () => {
    render(<ProfiloContent />, { wrapper });
    expect(
      screen.getByRole("heading", { name: /profilo/i }),
    ).toBeInTheDocument();
  });

  it('has data-testid="profilo-page"', () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByTestId("profilo-page")).toBeInTheDocument();
  });

  it("shows loading spinner when useCurrentUser is loading", () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined, isLoading: true });
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows user full name when loaded", () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("shows user email", () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByText("mario@test.com")).toBeInTheDocument();
  });

  it('shows role badge "Dipendente" for employee', () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByText("Dipendente")).toBeInTheDocument();
  });

  it('shows role badge "Manager" for manager', () => {
    mockUseCurrentUser.mockReturnValue({
      data: MOCK_MANAGER,
      isLoading: false,
    });
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it('shows role badge "Admin" for admin', () => {
    mockUseCurrentUser.mockReturnValue({ data: MOCK_ADMIN, isLoading: false });
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it('shows "Modifica" button', () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.getByTestId("profilo-edit-btn")).toBeInTheDocument();
    expect(screen.getByTestId("profilo-edit-btn")).toHaveTextContent(
      /modifica/i,
    );
  });

  it("clicking Modifica shows the edit form", () => {
    render(<ProfiloContent />, { wrapper });
    expect(screen.queryByTestId("profilo-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("profilo-edit-btn"));
    expect(screen.getByTestId("profilo-form")).toBeInTheDocument();
  });

  it("form fields are pre-populated with current user values", () => {
    render(<ProfiloContent />, { wrapper });
    fireEvent.click(screen.getByTestId("profilo-edit-btn"));

    const firstNameInput = screen.getByDisplayValue("Mario");
    const lastNameInput = screen.getByDisplayValue("Rossi");
    expect(firstNameInput).toBeInTheDocument();
    expect(lastNameInput).toBeInTheDocument();
  });

  it("renders only the heading when user is null and not loading", () => {
    mockUseCurrentUser.mockReturnValue({ data: null, isLoading: false });
    render(<ProfiloContent />, { wrapper });
    expect(
      screen.getByRole("heading", { name: /profilo/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Mario Rossi")).not.toBeInTheDocument();
  });

  it("clicking Annulla hides the edit form", () => {
    render(<ProfiloContent />, { wrapper });
    fireEvent.click(screen.getByTestId("profilo-edit-btn"));
    expect(screen.getByTestId("profilo-form")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/annulla/i));
    expect(screen.queryByTestId("profilo-form")).not.toBeInTheDocument();
  });

  it("clicking save calls updateProfile.mutate with correct payload", () => {
    render(<ProfiloContent />, { wrapper });
    fireEvent.click(screen.getByTestId("profilo-edit-btn"));

    fireEvent.click(screen.getByTestId("profilo-save-btn"));

    expect(mockMutate).toHaveBeenCalledWith({
      id: "user-1",
      first_name: "Mario",
      last_name: "Rossi",
      preferred_name: "Mario R.",
      pronouns: "lui/lui",
    });
  });
});
