/**
 * Phase 5: Tests for /notifiche page
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/notifiche"),
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
const mockUseNotifications = vi.fn();
const mockMarkAsReadMutate = vi.fn();
const mockMarkAllAsReadMutate = vi.fn();
const mockUseMarkAsRead = vi.fn();
const mockUseMarkAllAsRead = vi.fn();

vi.mock("@/lib/queries/users", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/lib/queries/notifications", () => ({
  useNotifications: (userId: string | undefined) =>
    mockUseNotifications(userId),
}));

vi.mock("@/lib/mutations/notifications", () => ({
  useMarkAsRead: () => mockUseMarkAsRead(),
  useMarkAllAsRead: () => mockUseMarkAllAsRead(),
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

const MOCK_NOTIFICATION_UNREAD = {
  id: "notif-1",
  user_id: "user-1",
  title: "Turno pubblicato",
  body: "Il turno di lunedì è stato pubblicato.",
  is_read: false,
  created_at: "2026-04-01T10:00:00Z",
  type: "shift_published" as const,
};

const MOCK_NOTIFICATION_READ = {
  id: "notif-2",
  user_id: "user-1",
  title: "Assenza approvata",
  body: "La tua richiesta di assenza è stata approvata.",
  is_read: true,
  created_at: "2026-04-02T10:00:00Z",
  type: "absence_approved" as const,
};

function setupDefaultMocks() {
  mockUseCurrentUser.mockReturnValue({ data: MOCK_USER, isLoading: false });
  mockUseNotifications.mockReturnValue({ data: [], isLoading: false });
  mockUseMarkAsRead.mockReturnValue({
    mutate: mockMarkAsReadMutate,
    isPending: false,
  });
  mockUseMarkAllAsRead.mockReturnValue({
    mutate: mockMarkAllAsReadMutate,
    isPending: false,
  });
}

// ── Import after mocks ────────────────────────────────────────────────────────
import NotificheContent from "../_components/notifiche-content";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NotificheContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('renders "Notifiche" heading', () => {
    render(<NotificheContent />, { wrapper });
    expect(
      screen.getByRole("heading", { name: /notifiche/i }),
    ).toBeInTheDocument();
  });

  it('has data-testid="notifiche-page"', () => {
    render(<NotificheContent />, { wrapper });
    expect(screen.getByTestId("notifiche-page")).toBeInTheDocument();
  });

  it("shows loading spinner while loading", () => {
    mockUseNotifications.mockReturnValue({ data: undefined, isLoading: true });
    render(<NotificheContent />, { wrapper });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    mockUseNotifications.mockReturnValue({ data: [], isLoading: false });
    render(<NotificheContent />, { wrapper });
    expect(screen.getByTestId("notifiche-empty")).toBeInTheDocument();
  });

  it('renders notification list with data-testid="notifiche-list"', () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD, MOCK_NOTIFICATION_READ],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    expect(screen.getByTestId("notifiche-list")).toBeInTheDocument();
  });

  it("shows notification title", () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    expect(screen.getByText("Turno pubblicato")).toBeInTheDocument();
  });

  it("shows notification body", () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    expect(
      screen.getByText("Il turno di lunedì è stato pubblicato."),
    ).toBeInTheDocument();
  });

  it("unread notification title has font-bold visual indicator", () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    // The unread indicator is expressed as font-bold on the title paragraph,
    // not on the button wrapper. Verify the title text carries the class.
    const titleEl = screen.getByText("Turno pubblicato");
    expect(titleEl).toHaveClass("font-bold");
  });

  it("clicking unread notification calls markAsRead.mutate", () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    fireEvent.click(screen.getByTestId("notif-notif-1"));
    expect(mockMarkAsReadMutate).toHaveBeenCalledWith({ id: "notif-1" });
  });

  it('"Segna tutto come letto" button is visible when unread count > 0', () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    expect(screen.getByTestId("mark-all-read-btn")).toBeInTheDocument();
  });

  it('"Segna tutto come letto" button is NOT visible when all read', () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_READ],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    expect(screen.queryByTestId("mark-all-read-btn")).not.toBeInTheDocument();
  });

  it("clicking mark-all calls markAllAsRead.mutate", () => {
    mockUseNotifications.mockReturnValue({
      data: [MOCK_NOTIFICATION_UNREAD],
      isLoading: false,
    });
    render(<NotificheContent />, { wrapper });
    fireEvent.click(screen.getByTestId("mark-all-read-btn"));
    expect(mockMarkAllAsReadMutate).toHaveBeenCalledWith({ userId: "user-1" });
  });
});
