import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/queryKeys";
import type { Database, ShiftAssignment } from "@/types/database";

export type CreateShiftInput =
  Database["public"]["Tables"]["shift_assignment"]["Insert"];

export type UpdateShiftInput = {
  id: string;
} & Database["public"]["Tables"]["shift_assignment"]["Update"];

export type DeleteShiftInput = {
  id: string;
  storeId: string;
  weekStart: string;
};

export type PublishShiftsInput = { ids: string[] };

// ── useCreateShift ────────────────────────────────────────────────────────────

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation<ShiftAssignment, Error, CreateShiftInput>({
    mutationFn: async (input) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shift_assignment")
        .insert(input)
        .select();

      if (error) throw new Error(error.message);
      return (data as ShiftAssignment[])[0];
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.all });

      const storeId = input.store_id;
      const weekStart = input.date;

      const cacheKey = queryKeys.shifts.byStoreWeek(storeId, weekStart);
      const snapshot = queryClient.getQueryData<ShiftAssignment[]>(cacheKey);

      if (snapshot !== undefined) {
        const optimistic: ShiftAssignment = {
          id: `optimistic-${Date.now()}`,
          template_id: null,
          start_time: null,
          end_time: null,
          published_at: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...input,
        } as ShiftAssignment;

        queryClient.setQueryData<ShiftAssignment[]>(cacheKey, [
          ...snapshot,
          optimistic,
        ]);
      }

      return { snapshot, cacheKey };
    },

    onError: (_err, input, context) => {
      const ctx = context as
        | {
            snapshot: ShiftAssignment[] | undefined;
            cacheKey: readonly string[];
          }
        | undefined;

      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(ctx.cacheKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
    },
  });
}

// ── useUpdateShift ────────────────────────────────────────────────────────────

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateShiftInput>({
    mutationFn: async ({ id, ...fields }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("shift_assignment")
        .update(fields)
        .eq("id", id);

      if (error) throw new Error(error.message);
    },

    onMutate: async ({ id, ...fields }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.all });

      const snapshots = new Map<string, ShiftAssignment[]>();

      queryClient
        .getQueriesData<ShiftAssignment[]>({ queryKey: queryKeys.shifts.all })
        .forEach(([key, data]) => {
          if (data) {
            snapshots.set(JSON.stringify(key), data);
            queryClient.setQueryData<ShiftAssignment[]>(
              key as string[],
              data.map((s) => (s.id === id ? { ...s, ...fields } : s)),
            );
          }
        });

      return { snapshots };
    },

    onError: (_err, _input, context) => {
      const ctx = context as
        | { snapshots: Map<string, ShiftAssignment[]> }
        | undefined;

      if (ctx?.snapshots) {
        ctx.snapshots.forEach((data, keyStr) => {
          queryClient.setQueryData(JSON.parse(keyStr), data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
    },
  });
}

// ── useDeleteShift ────────────────────────────────────────────────────────────

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteShiftInput>({
    mutationFn: async ({ id }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("shift_assignment")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },

    onMutate: async ({ id, storeId, weekStart }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.all });

      const cacheKey = queryKeys.shifts.byStoreWeek(storeId, weekStart);
      const snapshot = queryClient.getQueryData<ShiftAssignment[]>(cacheKey);

      if (snapshot !== undefined) {
        queryClient.setQueryData<ShiftAssignment[]>(
          cacheKey,
          snapshot.filter((s) => s.id !== id),
        );
      }

      return { snapshot, cacheKey };
    },

    onError: (_err, _input, context) => {
      const ctx = context as
        | {
            snapshot: ShiftAssignment[] | undefined;
            cacheKey: readonly string[];
          }
        | undefined;

      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(ctx.cacheKey, ctx.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
    },
  });
}

// ── usePublishShifts ──────────────────────────────────────────────────────────

export function usePublishShifts() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PublishShiftsInput>({
    mutationFn: async ({ ids }) => {
      if (ids.length === 0) return;

      const supabase = createClient();
      const { error } = await supabase
        .from("shift_assignment")
        .update({ published_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw new Error(error.message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
    },
  });
}
