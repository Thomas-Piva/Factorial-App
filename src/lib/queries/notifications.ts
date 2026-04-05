import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import { queryKeys } from "./queryKeys";

// ── useNotifications ──────────────────────────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  return useQuery<Notification[]>({
    queryKey: [...queryKeys.notifications.all, userId] as const,
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("notification")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}

// ── useUnreadCount ────────────────────────────────────────────────────────────

export function useUnreadCount(userId: string | undefined) {
  return useQuery<number>({
    queryKey: queryKeys.notifications.unreadCount,
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("notification")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_read", false)
        .order("created_at");

      if (error) {
        throw new Error(error.message);
      }

      return data.length;
    },
  });
}
