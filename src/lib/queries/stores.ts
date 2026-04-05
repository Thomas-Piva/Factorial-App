import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Store } from "@/types/database";
import { queryKeys } from "./queryKeys";

// Store enriched with membership info
export type StoreWithMembership = Store & { is_primary: boolean };

// ── useStores ─────────────────────────────────────────────────────────────────

export function useStores() {
  return useQuery<Store[]>({
    queryKey: queryKeys.stores.all,
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("store")
        .select("*")
        .order("name");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
}

// ── useMyStores ───────────────────────────────────────────────────────────────

export function useMyStores(userId: string | undefined) {
  return useQuery<StoreWithMembership[]>({
    queryKey: queryKeys.stores.mine,
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();

      // Fetch store memberships with store data joined
      const { data, error } = await supabase
        .from("store_membership")
        .select("is_primary, store:store_id(*)")
        .eq("user_id", userId!);

      if (error) {
        throw new Error(error.message);
      }

      // Flatten the join result: embed is_primary into each store.
      // PostgREST joins can return null for the relation; the type predicate in the
      // filter narrows store to non-null before the spread in the map.
      const rows = data as Array<{ is_primary: boolean; store: Store | null }>;
      return rows
        .filter(
          (row): row is { is_primary: boolean; store: Store } =>
            row.store !== null,
        )
        .map((row) => ({ ...row.store, is_primary: row.is_primary }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
