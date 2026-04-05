import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { ShiftTemplate } from "@/types/database";

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

const template1: ShiftTemplate = {
  id: "tmpl-1",
  store_id: "store-1",
  created_by: "u-admin",
  name: "Mattina",
  shift_type: "work_shift",
  start_time: "08:00",
  end_time: "16:00",
  color: "#4ade80",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const template2: ShiftTemplate = {
  ...template1,
  id: "tmpl-2",
  store_id: "store-2",
  name: "Pomeriggio",
};

// ── Reset mocks before each test ──────────────────────────────────────────────

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
// useTemplatesByStore
// ─────────────────────────────────────────────────────────────────────────────

import { useTemplatesByStore } from "@/lib/queries/templates";

describe("useTemplatesByStore", () => {
  it("returns templates for the given store", async () => {
    mockOrder.mockResolvedValueOnce({ data: [template1], error: null });

    const { result } = renderHook(() => useTemplatesByStore("store-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([template1]);
  });

  it("is in loading state initially", () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useTemplatesByStore("store-1"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when storeId is undefined", () => {
    const { result } = renderHook(() => useTemplatesByStore(undefined), {
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

    const { result } = renderHook(() => useTemplatesByStore("store-1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("returns empty array when store has no templates", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useTemplatesByStore("store-empty"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useTemplates
// ─────────────────────────────────────────────────────────────────────────────

import { useTemplates } from "@/lib/queries/templates";

describe("useTemplates", () => {
  it("returns all templates", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [template1, template2],
      error: null,
    });

    const { result } = renderHook(() => useTemplates(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("is in loading state initially", () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useTemplates(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("sets isError when Supabase returns an error", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "connection failed" },
    });

    const { result } = renderHook(() => useTemplates(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when there are no templates", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useTemplates(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
