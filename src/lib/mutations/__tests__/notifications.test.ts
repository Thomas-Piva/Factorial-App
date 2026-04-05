import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Notification } from "@/types/database";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const notification1: Notification = {
  id: "notif-1",
  user_id: "u-1",
  created_by: "u-admin",
  type: "shift_published",
  title: "Turni pubblicati",
  body: "I turni della prossima settimana sono stati pubblicati.",
  is_read: false,
  created_at: "2026-01-01T00:00:00Z",
};

// ── Reset mocks ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockInsert.mockReturnValue({ select: mockSelect });
  mockSelect.mockResolvedValue({ data: [notification1], error: null });
  mockEq.mockResolvedValue({ data: null, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    eq: mockEq,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useMarkAsRead
// ─────────────────────────────────────────────────────────────────────────────

import { useMarkAsRead } from "@/lib/mutations/notifications";

describe("useMarkAsRead", () => {
  it("calls supabase update with is_read=true for the given id", async () => {
    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "notif-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("notification");
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    expect(mockEq).toHaveBeenCalledWith("id", "notif-1");
  });

  it("sets isError when supabase returns an error", async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Update failed" } });
    mockUpdate.mockReturnValue({ eq: eqError });

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "notif-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Update failed");
  });

  it("invalidates notifications cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useMarkAsRead(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "notif-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useMarkAllAsRead
// ─────────────────────────────────────────────────────────────────────────────

import { useMarkAllAsRead } from "@/lib/mutations/notifications";

describe("useMarkAllAsRead", () => {
  beforeEach(() => {
    // useMarkAllAsRead uses two chained eq calls: update -> eq('is_read', false) -> eq('user_id', userId)
    const secondEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockUpdate.mockReturnValue({ eq: firstEq });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
      eq: mockEq,
    });
  });

  it("calls supabase update with is_read=true filtered by user_id", async () => {
    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ userId: "u-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("notification");
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
  });

  it("filters by user_id when marking all as read", async () => {
    const secondEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockUpdate.mockReturnValue({ eq: firstEq });

    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ userId: "u-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(firstEq).toHaveBeenCalledWith("user_id", "u-1");
  });

  it("sets isError when supabase returns an error", async () => {
    const eqError = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Bulk update failed" },
    });
    mockUpdate.mockReturnValue({ eq: eqError });

    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ userId: "u-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Bulk update failed");
  });

  it("invalidates notifications cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const secondEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockUpdate.mockReturnValue({ eq: firstEq });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });

    await act(async () => {
      result.current.mutate({ userId: "u-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useCreateNotification
// ─────────────────────────────────────────────────────────────────────────────

import { useCreateNotification } from "@/lib/mutations/notifications";

describe("useCreateNotification", () => {
  it("calls supabase insert with correct data", async () => {
    const input = {
      user_id: "u-1",
      type: "shift_published" as const,
      title: "Turni pubblicati",
      body: "I turni sono stati pubblicati.",
    };

    const { result } = renderHook(() => useCreateNotification(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("notification");
    expect(mockInsert).toHaveBeenCalledWith(input);
  });

  it("returns the created notification on success", async () => {
    const input = {
      user_id: "u-1",
      type: "communication" as const,
      title: "Avviso",
      body: "Messaggio importante.",
    };

    const { result } = renderHook(() => useCreateNotification(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(notification1);
  });

  it("sets isError when supabase returns an error", async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const input = {
      user_id: "u-1",
      type: "shift_published" as const,
      title: "Test",
      body: "Body",
    };

    const { result } = renderHook(() => useCreateNotification(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Insert failed");
  });

  it("invalidates notifications cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const input = {
      user_id: "u-1",
      type: "new_shift" as const,
      title: "Nuovo turno",
      body: "Hai un nuovo turno assegnato.",
    };

    const { result } = renderHook(() => useCreateNotification(), { wrapper });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] }),
    );
  });

  it("supports all notification types", async () => {
    const types = [
      "shift_published",
      "absence_approved",
      "communication",
      "new_shift",
    ] as const;

    for (const type of types) {
      vi.clearAllMocks();
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockResolvedValue({ data: [notification1], error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const input = { user_id: "u-1", type, title: "T", body: "B" };

      const { result } = renderHook(() => useCreateNotification(), {
        wrapper: makeWrapper(),
      });

      await act(async () => {
        result.current.mutate(input);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    }
  });
});
