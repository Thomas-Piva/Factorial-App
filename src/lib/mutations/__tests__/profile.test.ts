import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockEq = vi.fn();
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
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

// ── Reset mocks ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockEq.mockResolvedValue({ data: null, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ update: mockUpdate });
});

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateProfile
// ─────────────────────────────────────────────────────────────────────────────

import { useUpdateProfile } from "@/lib/mutations/profile";

describe("useUpdateProfile", () => {
  it("calls supabase update on the user table with the correct id", async () => {
    const input = {
      id: "u-1",
      first_name: "Mario",
      last_name: "Rossi",
    };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("user");
    expect(mockEq).toHaveBeenCalledWith("id", "u-1");
  });

  it("does NOT include role in the update payload", async () => {
    const input = {
      id: "u-1",
      first_name: "Mario",
    };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty("role");
    expect(updateCall).not.toHaveProperty("id");
  });

  it("sends only changed profile fields", async () => {
    const input = {
      id: "u-1",
      preferred_name: "Mario",
      avatar_url: "https://example.com/avatar.jpg",
    };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdate).toHaveBeenCalledWith({
      preferred_name: "Mario",
      avatar_url: "https://example.com/avatar.jpg",
    });
  });

  it("sets isError when supabase returns an error", async () => {
    mockEq.mockResolvedValueOnce({
      data: null,
      error: { message: "Update failed" },
    });

    const input = { id: "u-1", first_name: "Mario" };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Update failed");
  });

  it("invalidates users.me cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "u-1", first_name: "Mario" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["users", "me"] }),
    );
  });

  it("handles null optional fields", async () => {
    const input = {
      id: "u-1",
      preferred_name: null,
      pronouns: null,
      birth_date: null,
      avatar_url: null,
    };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdate).toHaveBeenCalledWith({
      preferred_name: null,
      pronouns: null,
      birth_date: null,
      avatar_url: null,
    });
  });

  it("handles empty update (only id provided)", async () => {
    const input = { id: "u-1" };

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith({});
  });
});
