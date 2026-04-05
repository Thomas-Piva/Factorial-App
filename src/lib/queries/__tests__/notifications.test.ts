import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Notification } from "@/types/database";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ── Helper: query-client wrapper ──────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const notification1: Notification = {
  id: "notif-1",
  user_id: "u-1",
  created_by: "u-admin",
  type: "shift_published",
  title: "Turno pubblicato",
  body: "Il tuo turno per lunedì è stato pubblicato.",
  is_read: false,
  created_at: "2026-04-01T10:00:00Z",
};

const notification2: Notification = {
  ...notification1,
  id: "notif-2",
  type: "communication",
  title: "Avviso",
  body: "Riunione domani.",
  is_read: true,
  created_at: "2026-04-02T09:00:00Z",
};

// ── Reset mocks ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  const chain = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
  };

  mockFrom.mockReturnValue(chain);
  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockOrder.mockResolvedValue({ data: [], error: null });
});

// ─────────────────────────────────────────────────────────────────────────────
// useNotifications
// ─────────────────────────────────────────────────────────────────────────────

import { useNotifications } from "@/lib/queries/notifications";

describe("useNotifications", () => {
  it("returns all notifications for the user", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [notification1, notification2],
      error: null,
    });

    const { result } = renderHook(() => useNotifications("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([notification1, notification2]);
  });

  it("is in loading state initially", () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useNotifications("u-1"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(() => useNotifications(undefined), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const { result } = renderHook(() => useNotifications("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("returns empty array when user has no notifications", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useNotifications("u-no-notifs"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useUnreadCount
// ─────────────────────────────────────────────────────────────────────────────

import { useUnreadCount } from "@/lib/queries/notifications";

describe("useUnreadCount", () => {
  it("returns the count of unread notifications", async () => {
    // Supabase count query returns data as array length
    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      order: mockOrder,
    });
    mockOrder.mockResolvedValueOnce({
      data: [notification1],
      error: null,
    });

    const { result } = renderHook(() => useUnreadCount("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(typeof result.current.data).toBe("number");
    expect(result.current.data).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 when all notifications are read", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useUnreadCount("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(() => useUnreadCount(undefined), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const { result } = renderHook(() => useUnreadCount("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
