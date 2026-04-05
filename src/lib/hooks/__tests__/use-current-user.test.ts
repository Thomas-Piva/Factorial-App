import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCurrentUserHook } from "../use-current-user";
import type { User } from "@/types/database";

// ── Mock Supabase ─────────────────────────────────────────────────────────────

const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

const mockUser: User = {
  id: "user-1",
  email: "test@test.com",
  first_name: "Mario",
  last_name: "Rossi",
  preferred_name: null,
  pronouns: null,
  birth_date: null,
  legal_gender: null,
  avatar_url: null,
  role: "employee",
  admission_date: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useCurrentUserHook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user data and role helpers when authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOrder.mockResolvedValueOnce({ data: [mockUser], error: null });

    const { result } = renderHook(() => useCurrentUserHook(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isEmployee).toBe(true);
    expect(result.current.isManager).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns isManager true for manager role", async () => {
    const managerUser = { ...mockUser, role: "manager" as const };
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOrder.mockResolvedValueOnce({ data: [managerUser], error: null });

    const { result } = renderHook(() => useCurrentUserHook(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isManager).toBe(true);
    expect(result.current.isEmployee).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns isAdmin true for admin role", async () => {
    const adminUser = { ...mockUser, role: "admin" as const };
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockOrder.mockResolvedValueOnce({ data: [adminUser], error: null });

    const { result } = renderHook(() => useCurrentUserHook(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isManager).toBe(false);
  });

  it("returns null user when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useCurrentUserHook(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.isEmployee).toBe(false);
    expect(result.current.isManager).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
});
