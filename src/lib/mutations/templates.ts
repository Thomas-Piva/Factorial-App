import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/queries/queryKeys'
import type { Database, ShiftTemplate } from '@/types/database'

export type CreateTemplateInput =
  Database['public']['Tables']['shift_template']['Insert']

export type UpdateTemplateInput = { id: string } & Database['public']['Tables']['shift_template']['Update']

// ── useCreateTemplate ─────────────────────────────────────────────────────────

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation<ShiftTemplate, Error, CreateTemplateInput>({
    mutationFn: async (input) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shift_template')
        .insert(input)
        .select()

      if (error) throw new Error(error.message)
      return (data as ShiftTemplate[])[0]
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
    },
  })
}

// ── useUpdateTemplate ─────────────────────────────────────────────────────────

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateTemplateInput>({
    mutationFn: async ({ id, ...fields }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('shift_template')
        .update(fields)
        .eq('id', id)

      if (error) throw new Error(error.message)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
    },
  })
}
