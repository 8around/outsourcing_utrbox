import { create } from 'zustand'
import { Collection } from '@/types/collection'

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

  // 컬렉션 상태
  collections: Collection[]
  currentCollection: Collection | null

  // 선택 액션
  setSelectedContents: (ids: string[]) => void

  // 뷰 설정 액션
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  setSortBy: (sort: SortBy) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  setSearchQuery: (query: string) => void

  // 컬렉션 액션
  setCollections: (collections: Collection[]) => void
  setCurrentCollection: (collection: Collection | null) => void

  // 초기화
  reset: () => void
}

const initialState = {
  selectedContentIds: [],
  viewMode: 'list' as ViewMode,
  sortBy: 'date' as SortBy,
  sortOrder: 'desc' as SortOrder,
  searchQuery: '',
  collections: [],
  currentCollection: null,
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  ...initialState,

  setSelectedContents: (ids) =>
    set({
      selectedContentIds: ids,
    }),

  setViewMode: (mode) =>
    set({
      viewMode: mode,
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

  setCollections: (collections) =>
    set({
      collections,
    }),

  setCurrentCollection: (collection) =>
    set({
      currentCollection: collection,
    }),

  reset: () => set(initialState),
}))
