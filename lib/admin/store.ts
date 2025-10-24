// lib/admin/store.ts
// Zustand를 이용한 관리자 페이지 상태 관리

import { create } from 'zustand'
import { UserFilters, ContentFilters, ReviewFilters } from './types'

interface AdminState {
  // 필터 상태
  userFilters: UserFilters
  contentFilters: ContentFilters
  reviewFilters: ReviewFilters

  // 선택 상태
  selectedUserIds: string[]
  selectedContentIds: string[]

  // 액션
  setUserFilters: (filters: UserFilters) => void
  setContentFilters: (filters: ContentFilters) => void
  setReviewFilters: (filters: ReviewFilters) => void
  toggleUserSelection: (userId: string) => void
  toggleContentSelection: (contentId: string) => void
  clearSelections: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  // 초기 상태
  userFilters: {},
  contentFilters: {},
  reviewFilters: {},
  selectedUserIds: [],
  selectedContentIds: [],

  // 액션
  setUserFilters: (filters) => set({ userFilters: filters }),
  setContentFilters: (filters) => set({ contentFilters: filters }),
  setReviewFilters: (filters) => set({ reviewFilters: filters }),
  toggleUserSelection: (userId) =>
    set((state) => ({
      selectedUserIds: state.selectedUserIds.includes(userId)
        ? state.selectedUserIds.filter((id) => id !== userId)
        : [...state.selectedUserIds, userId],
    })),
  toggleContentSelection: (contentId) =>
    set((state) => ({
      selectedContentIds: state.selectedContentIds.includes(contentId)
        ? state.selectedContentIds.filter((id) => id !== contentId)
        : [...state.selectedContentIds, contentId],
    })),
  clearSelections: () => set({ selectedUserIds: [], selectedContentIds: [] }),
}))
