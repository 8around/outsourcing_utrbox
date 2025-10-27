import { create } from 'zustand'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'date' | 'size' | 'detections'

interface ExplorerStore {
  // 선택 상태
  selectedContentIds: string[]

  // 뷰 설정
  viewMode: ViewMode
  sortBy: SortBy
  searchQuery: string

  // 선택 액션
  setSelectedContents: (ids: string[]) => void

  // 뷰 설정 액션
  toggleViewMode: () => void
  setSortBy: (sort: SortBy) => void
  setSearchQuery: (query: string) => void

  // 초기화
  reset: () => void
}

const initialState = {
  selectedContentIds: [],
  viewMode: 'grid' as ViewMode,
  sortBy: 'date' as SortBy,
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

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
    }),

  reset: () => set(initialState),
}))
