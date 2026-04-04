import { create } from 'zustand'

interface StoreFilterState {
  /** Currently selected store ID for the shift grid filter. null = all stores */
  selectedStoreId: string | null
  setSelectedStoreId: (storeId: string | null) => void
  /** ISO date string (YYYY-MM-DD) of the Monday of the currently viewed week */
  weekStart: string | null
  setWeekStart: (date: string) => void
}

export const useStoreFilter = create<StoreFilterState>((set) => ({
  selectedStoreId: null,
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
  weekStart: null,
  setWeekStart: (date) => set({ weekStart: date }),
}))
