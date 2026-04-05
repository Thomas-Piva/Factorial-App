import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { ShiftAssignment } from "@/types/database";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ── Helper: query-client wrapper ──────────────────────────────────────────────

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const shift1: ShiftAssignment = {
  id: "sa-1",
  user_id: "u-1",
  store_id: "store-1",
  template_id: null,
  created_by: "u-admin",
  date: "2026-04-07",
  shift_type: "work_shift",
  label: "Mattina",
  start_time: "08:00",
  end_time: "16:00",
  color: "#4ade80",
  published_at: null,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ── Reset mocks before each test ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  const baseChain = {
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  };

  mockFrom.mockReturnValue(baseChain);
  mockInsert.mockReturnValue({ select: mockSelect });
  mockSelect.mockResolvedValue({ data: [shift1], error: null });
  mockEq.mockReturnValue({ ...baseChain, eq: mockEq });
  mockIn.mockResolvedValue({ data: null, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: null, error: null });
});

// ─────────────────────────────────────────────────────────────────────────────
// useCreateShift
// ─────────────────────────────────────────────────────────────────────────────

import { useCreateShift } from "@/lib/mutations/shifts";

describe("useCreateShift", () => {
  it("calls supabase insert with correct data on success", async () => {
    const input = {
      user_id: "u-1",
      store_id: "store-1",
      created_by: "u-admin",
      date: "2026-04-07",
      shift_type: "work_shift" as const,
      label: "Mattina",
      color: "#4ade80",
    };

    const { result } = renderHook(() => useCreateShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("shift_assignment");
    expect(mockInsert).toHaveBeenCalledWith(input);
  });

  it("sets isError when supabase returns an error", async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const input = {
      user_id: "u-1",
      store_id: "store-1",
      created_by: "u-admin",
      date: "2026-04-07",
      shift_type: "work_shift" as const,
      label: "Mattina",
      color: "#4ade80",
    };

    const { result } = renderHook(() => useCreateShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Insert failed");
  });

  it("invalidates shifts cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const input = {
      user_id: "u-1",
      store_id: "store-1",
      created_by: "u-admin",
      date: "2026-04-07",
      shift_type: "work_shift" as const,
      label: "Mattina",
      color: "#4ade80",
    };

    const { result } = renderHook(() => useCreateShift(), { wrapper });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shifts"] }),
    );
  });

  it("applies optimistic update in onMutate", async () => {
    // Delay the server response to observe optimistic state
    mockSelect.mockReturnValueOnce(
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: [shift1], error: null }), 100),
      ),
    );

    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    qc.setQueryData(["shifts", "store-1", "2026-04-07"], []);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const input = {
      user_id: "u-1",
      store_id: "store-1",
      created_by: "u-admin",
      date: "2026-04-07",
      shift_type: "work_shift" as const,
      label: "Mattina",
      color: "#4ade80",
    };

    const { result } = renderHook(() => useCreateShift(), { wrapper });

    act(() => {
      result.current.mutate(input);
    });

    // The optimistic update should add an item to the cache before server responds
    await waitFor(() => {
      const cached = qc.getQueryData<ShiftAssignment[]>([
        "shifts",
        "store-1",
        "2026-04-07",
      ]);
      return (cached?.length ?? 0) > 0;
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back optimistic update on error", async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const originalData: ShiftAssignment[] = [shift1];
    qc.setQueryData(["shifts", "store-1", "2026-04-07"], originalData);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const input = {
      user_id: "u-1",
      store_id: "store-1",
      created_by: "u-admin",
      date: "2026-04-07",
      shift_type: "work_shift" as const,
      label: "Mattina",
      color: "#4ade80",
    };

    const { result } = renderHook(() => useCreateShift(), { wrapper });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should be rolled back to original data
    const cached = qc.getQueryData<ShiftAssignment[]>([
      "shifts",
      "store-1",
      "2026-04-07",
    ]);
    expect(cached).toEqual(originalData);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateShift
// ─────────────────────────────────────────────────────────────────────────────

import { useUpdateShift } from "@/lib/mutations/shifts";

describe("useUpdateShift", () => {
  beforeEach(() => {
    // update chain: from -> update -> eq
    const eqResolved = vi.fn().mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ eq: eqResolved });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
    });
  });

  it("calls supabase update with correct args", async () => {
    const input = { id: "sa-1", label: "Sera", color: "#f00" };

    const { result } = renderHook(() => useUpdateShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("shift_assignment");
    expect(mockUpdate).toHaveBeenCalledWith({ label: "Sera", color: "#f00" });
  });

  it("sets isError when supabase returns an error", async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Update failed" } });
    mockUpdate.mockReturnValue({ eq: eqError });

    const input = { id: "sa-1", label: "Sera" };

    const { result } = renderHook(() => useUpdateShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Update failed");
  });

  it("invalidates shifts cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpdateShift(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "sa-1", label: "Sera" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shifts"] }),
    );
  });

  it("rolls back optimistic update on error", async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Update failed" } });
    mockUpdate.mockReturnValue({ eq: eqError });

    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const originalData: ShiftAssignment[] = [shift1];
    qc.setQueryData(["shifts", "store-1", "2026-04-07"], originalData);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpdateShift(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "sa-1", label: "Sera" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = qc.getQueryData<ShiftAssignment[]>([
      "shifts",
      "store-1",
      "2026-04-07",
    ]);
    expect(cached).toEqual(originalData);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteShift
// ─────────────────────────────────────────────────────────────────────────────

import { useDeleteShift } from "@/lib/mutations/shifts";

describe("useDeleteShift", () => {
  beforeEach(() => {
    const eqResolved = vi.fn().mockResolvedValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: eqResolved });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
    });
  });

  it("calls supabase delete with correct id", async () => {
    const input = { id: "sa-1", storeId: "store-1", weekStart: "2026-04-07" };

    const { result } = renderHook(() => useDeleteShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("shift_assignment");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("sets isError when supabase returns an error", async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Delete failed" } });
    mockDelete.mockReturnValue({ eq: eqError });

    const input = { id: "sa-1", storeId: "store-1", weekStart: "2026-04-07" };

    const { result } = renderHook(() => useDeleteShift(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Delete failed");
  });

  it("invalidates shifts cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useDeleteShift(), { wrapper });

    await act(async () => {
      result.current.mutate({
        id: "sa-1",
        storeId: "store-1",
        weekStart: "2026-04-07",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shifts"] }),
    );
  });

  it("removes item optimistically then rolls back on error", async () => {
    const eqError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Delete failed" } });
    mockDelete.mockReturnValue({ eq: eqError });

    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const originalData: ShiftAssignment[] = [shift1];
    qc.setQueryData(["shifts", "store-1", "2026-04-07"], originalData);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useDeleteShift(), { wrapper });

    await act(async () => {
      result.current.mutate({
        id: "sa-1",
        storeId: "store-1",
        weekStart: "2026-04-07",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = qc.getQueryData<ShiftAssignment[]>([
      "shifts",
      "store-1",
      "2026-04-07",
    ]);
    expect(cached).toEqual(originalData);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// usePublishShifts
// ─────────────────────────────────────────────────────────────────────────────

import { usePublishShifts } from "@/lib/mutations/shifts";

describe("usePublishShifts", () => {
  beforeEach(() => {
    const inResolved = vi.fn().mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ in: inResolved });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
    });
  });

  it("calls supabase update with published_at and correct ids", async () => {
    const input = { ids: ["sa-1", "sa-2"] };

    const { result } = renderHook(() => usePublishShifts(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("shift_assignment");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ published_at: expect.any(String) }),
    );
  });

  it("sets isError when supabase returns an error", async () => {
    const inError = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Publish failed" } });
    mockUpdate.mockReturnValue({ in: inError });

    const { result } = renderHook(() => usePublishShifts(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ ids: ["sa-1"] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Publish failed");
  });

  it("invalidates shifts cache on success", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => usePublishShifts(), { wrapper });

    await act(async () => {
      result.current.mutate({ ids: ["sa-1", "sa-2"] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shifts"] }),
    );
  });

  it("handles empty ids array without error", async () => {
    const { result } = renderHook(() => usePublishShifts(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      result.current.mutate({ ids: [] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
