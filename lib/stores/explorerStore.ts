import { create } from 'zustand'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'date' | 'size' | 'detections'

interface ExplorerStore {
  // 상태
  selectedCollectionId: string | null
  selectedContentIds: string[]
  viewMode: ViewMode
  sortBy: SortBy
  searchQuery: string
  expandedFolderIds: string[]

  // 액션
  setSelectedCollection: (id: string | null) => void
  setSelectedContents: (ids: string[]) => void
  toggleViewMode: () => void
  setSortBy: (sort: SortBy) => void
  setSearchQuery: (query: string) => void
  toggleFolder: (id: string) => void
  expandFolder: (id: string) => void
  collapseFolder: (id: string) => void
  reset: () => void
}

const initialState = {
  selectedCollectionId: null,
  selectedContentIds: [],
  viewMode: 'grid' as ViewMode,
  sortBy: 'date' as SortBy,
  searchQuery: '',
  expandedFolderIds: [],
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  ...initialState,

  setSelectedCollection: (id) =>
    set({
      selectedCollectionId: id,
      selectedContentIds: [], // 컬렉션 변경 시 선택 초기화
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

  toggleFolder: (id) =>
    set((state) => ({
      expandedFolderIds: state.expandedFolderIds.includes(id)
        ? state.expandedFolderIds.filter((folderId) => folderId !== id)
        : [...state.expandedFolderIds, id],
    })),

  expandFolder: (id) =>
    set((state) => ({
      expandedFolderIds: state.expandedFolderIds.includes(id)
        ? state.expandedFolderIds
        : [...state.expandedFolderIds, id],
    })),

  collapseFolder: (id) =>
    set((state) => ({
      expandedFolderIds: state.expandedFolderIds.filter(
        (folderId) => folderId !== id
      ),
    })),

  reset: () => set(initialState),
}))
