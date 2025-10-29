import { create } from 'zustand'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'date'
export type SortOrder = 'asc' | 'desc'

interface ExplorerStore {
  // 선택 상태
  selectedContentIds: string[]

  // 뷰 설정
  viewMode: ViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  searchQuery: string

  // 선택 액션
  setSelectedContents: (ids: string[]) => void

  // 뷰 설정 액션
  toggleViewMode: () => void
  setSortBy: (sort: SortBy) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  setSearchQuery: (query: string) => void

  // 초기화
  reset: () => void
}

const initialState = {
  selectedContentIds: [],
  viewMode: 'grid' as ViewMode,
  sortBy: 'date' as SortBy,
  sortOrder: 'desc' as SortOrder,
  searchQuery: '',
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  ...initialState,

  setSelectedContents: (ids) =>
    set({
      selectedContentIds: ids,
    }),

  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'grid' ? 'list' : 'grid',
    })),

  setSortBy: (sort) =>
    set({
      sortBy: sort,
    }),

  setSortOrder: (order) =>
    set({
      sortOrder: order,
    }),

  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
    }),

  reset: () => set(initialState),
}))
