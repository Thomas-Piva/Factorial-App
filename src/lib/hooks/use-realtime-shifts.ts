import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";

export function useRealtimeShifts(storeId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`shifts:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_assignment",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
}
