import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useRealtimeShifts } from "../use-realtime-shifts";

// ── Mock Supabase client ──────────────────────────────────────────────────────

const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn(() => ({ unsubscribe: mockUnsubscribe }));
const mockOn = vi.fn(() => ({ subscribe: mockSubscribe }));
const mockChannel = vi.fn(() => ({ on: mockOn }));
const mockRemoveChannel = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  })),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useRealtimeShifts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({ on: mockOn });
    mockOn.mockReturnValue({ subscribe: mockSubscribe });
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
  });

  it("subscribes to the shift_assignment channel for the given store", () => {
    renderHook(() => useRealtimeShifts("store-1"), { wrapper: makeWrapper() });

    expect(mockChannel).toHaveBeenCalledWith("shifts:store-1");
    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "*",
        schema: "public",
        table: "shift_assignment",
        filter: "store_id=eq.store-1",
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("does not subscribe when storeId is undefined", () => {
    renderHook(() => useRealtimeShifts(undefined), { wrapper: makeWrapper() });
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useRealtimeShifts("store-1"), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
