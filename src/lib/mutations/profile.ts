import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Database } from "@/types/database";

type UpdateProfileInput = Database["public"]["Tables"]["user"]["Update"] & {
  id: string;
};

// ── useUpdateProfile ──────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateProfileInput>({
    mutationFn: async ({ id, ...fields }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude role from update payload
      const { role: _role, ...safeFields } = fields as typeof fields & {
        role?: unknown;
      };

      const supabase = createClient();
      const { error } = await supabase
        .from("user")
        .update(safeFields)
        .eq("id", id);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}
