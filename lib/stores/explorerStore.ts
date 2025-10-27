import { create } from 'zustand'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'date' | 'size' | 'detections'

interface ExplorerStore {
  // 네비게이션 상태
  currentPath: string | null // null = 루트, collectionId = 컬렉션 내부

  // 선택 상태
  selectedContentIds: string[]

  // 뷰 설정
  viewMode: ViewMode
  sortBy: SortBy
  searchQuery: string

  // 네비게이션 액션
  navigateToCollection: (collectionId: string) => void
  navigateToRoot: () => void

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
  currentPath: null,
  selectedContentIds: [],
  viewMode: 'grid' as ViewMode,
  sortBy: 'date' as SortBy,
  searchQuery: '',
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  ...initialState,

  navigateToCollection: (collectionId) =>
    set({
      currentPath: collectionId,
      selectedContentIds: [], // 네비게이션 시 선택 초기화
    }),

  navigateToRoot: () =>
    set({
      currentPath: null,
      selectedContentIds: [], // 네비게이션 시 선택 초기화
    }),

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
