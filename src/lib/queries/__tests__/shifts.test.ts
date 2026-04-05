import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { ShiftAssignment } from "@/types/database";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
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

const shift2: ShiftAssignment = {
  ...shift1,
  id: "sa-2",
  date: "2026-04-08",
};

// ── Reset mocks before each test ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default chainable mock: each method returns an object that chains further
  const chain = {
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
  };

  mockFrom.mockReturnValue(chain);
  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockGte.mockReturnValue(chain);
  mockLte.mockReturnValue(chain);
  mockOrder.mockResolvedValue({ data: [], error: null });
});

// ─────────────────────────────────────────────────────────────────────────────
// useShiftsByStoreWeek
// ─────────────────────────────────────────────────────────────────────────────

import { useShiftsByStoreWeek } from "@/lib/queries/shifts";

describe("useShiftsByStoreWeek", () => {
  it("returns shifts data on success", async () => {
    mockOrder.mockResolvedValueOnce({ data: [shift1, shift2], error: null });

    const { result } = renderHook(
      () => useShiftsByStoreWeek("store-1", "2026-04-07"),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([shift1, shift2]);
  });

  it("is in loading state initially", () => {
    // Never resolves during this check
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(
      () => useShiftsByStoreWeek("store-1", "2026-04-07"),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when storeId is undefined", () => {
    const { result } = renderHook(
      () => useShiftsByStoreWeek(undefined, "2026-04-07"),
      { wrapper: makeWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when weekStart is undefined", () => {
    const { result } = renderHook(
      () => useShiftsByStoreWeek("store-1", undefined),
      { wrapper: makeWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error", code: "500" },
    });

    const { result } = renderHook(
      () => useShiftsByStoreWeek("store-1", "2026-04-07"),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useMyShiftsToday
// ─────────────────────────────────────────────────────────────────────────────

import { useMyShiftsToday } from "@/lib/queries/shifts";

describe("useMyShiftsToday", () => {
  it("returns todays shifts for a user", async () => {
    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
    });
    mockOrder.mockResolvedValueOnce({ data: [shift1], error: null });

    const { result } = renderHook(() => useMyShiftsToday("u-1", "store-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([shift1]);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(
      () => useMyShiftsToday(undefined, "store-1"),
      { wrapper: makeWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when storeId is undefined", () => {
    const { result } = renderHook(() => useMyShiftsToday("u-1", undefined), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const { result } = renderHook(() => useMyShiftsToday("u-1", "store-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useShiftsByUserMonth
// ─────────────────────────────────────────────────────────────────────────────

import { useShiftsByUserMonth } from "@/lib/queries/shifts";

describe("useShiftsByUserMonth", () => {
  it("returns shifts for the given user and month", async () => {
    mockOrder.mockResolvedValueOnce({ data: [shift1, shift2], error: null });

    const { result } = renderHook(
      () => useShiftsByUserMonth("u-1", "2026-04"),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(
      () => useShiftsByUserMonth(undefined, "2026-04"),
      { wrapper: makeWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when month is undefined", () => {
    const { result } = renderHook(
      () => useShiftsByUserMonth("u-1", undefined),
      { wrapper: makeWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const { result } = renderHook(
      () => useShiftsByUserMonth("u-1", "2026-04"),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
