import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ShiftTemplate } from "@/types/database";
import { queryKeys } from "./queryKeys";

// ── useTemplatesByStore ───────────────────────────────────────────────────────

export function useTemplatesByStore(storeId: string | undefined) {
  return useQuery<ShiftTemplate[]>({
    queryKey: queryKeys.templates.byStore(storeId ?? ""),
    enabled: Boolean(storeId),
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("shift_template")
        .select("*")
        .eq("store_id", storeId!)
        .order("name");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}

// ── useTemplates ──────────────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery<ShiftTemplate[]>({
    queryKey: queryKeys.templates.all,
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("shift_template")
        .select("*")
        .order("name");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}
