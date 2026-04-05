import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Database, Notification } from "@/types/database";

export type CreateNotificationInput =
  Database["public"]["Tables"]["notification"]["Insert"];

// ── useMarkAsRead ─────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notification")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ── useMarkAllAsRead ──────────────────────────────────────────────────────────

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notification")
        .update({ is_read: true })
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ── useCreateNotification ─────────────────────────────────────────────────────

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, CreateNotificationInput>({
    mutationFn: async (input) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notification")
        .insert(input)
        .select();

      if (error) throw new Error(error.message);
      return (data as Notification[])[0];
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
