import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Store } from "@/types/database";

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

const store1: Store = {
  id: "store-1",
  name: "Negozio Centro",
  code: "CTR",
  address: "Via Roma 1",
  city: "Milano",
  phone: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const store2: Store = {
  ...store1,
  id: "store-2",
  name: "Negozio Nord",
  code: "NRD",
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
// useStores
// ─────────────────────────────────────────────────────────────────────────────

import { useStores } from "@/lib/queries/stores";

describe("useStores", () => {
  it("returns all stores", async () => {
    mockOrder.mockResolvedValueOnce({ data: [store1, store2], error: null });

    const { result } = renderHook(() => useStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([store1, store2]);
  });

  it("is in loading state initially", () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useStores(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "access denied" },
    });

    const { result } = renderHook(() => useStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("returns empty array when there are no stores", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useMyStores
// ─────────────────────────────────────────────────────────────────────────────

import { useMyStores } from "@/lib/queries/stores";
import type { StoreWithMembership } from "@/lib/queries/stores";

const store1WithMembership: StoreWithMembership = {
  ...store1,
  is_primary: true,
};

describe("useMyStores", () => {
  it("returns stores the user belongs to (with is_primary)", async () => {
    // New implementation: from('store_membership').select(...).eq(...)
    // The chain ends at eq() → mockEq resolves directly
    mockEq.mockResolvedValueOnce({
      data: [{ is_primary: true, store: store1 }],
      error: null,
    });

    const { result } = renderHook(() => useMyStores("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([store1WithMembership]);
  });

  it("is in loading state initially", () => {
    mockEq.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useMyStores("u-1"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(() => useMyStores(undefined), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("sets isError when Supabase returns an error", async () => {
    mockEq.mockResolvedValueOnce({
      data: null,
      error: { message: "forbidden" },
    });

    const { result } = renderHook(() => useMyStores("u-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when user has no store memberships", async () => {
    mockEq.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useMyStores("u-new"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
