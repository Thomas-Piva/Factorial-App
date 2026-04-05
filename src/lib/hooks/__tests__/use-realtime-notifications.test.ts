import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useRealtimeNotifications } from "../use-realtime-notifications";

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
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

describe("useRealtimeNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({ on: mockOn });
    mockOn.mockReturnValue({ subscribe: mockSubscribe });
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
  });

  it("subscribes to the notification channel for the given user", () => {
    renderHook(() => useRealtimeNotifications("user-1"), {
      wrapper: makeWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith("notifications:user-1");
    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "*",
        schema: "public",
        table: "notification",
        filter: "user_id=eq.user-1",
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("does not subscribe when userId is undefined", () => {
    renderHook(() => useRealtimeNotifications(undefined), {
      wrapper: makeWrapper(),
    });
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useRealtimeNotifications("user-1"), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
