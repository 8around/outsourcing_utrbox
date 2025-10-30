// lib/admin/store.ts
// Zustand를 이용한 관리자 페이지 상태 관리

import { create } from 'zustand'
import { UserFilters, ContentFilters, ReviewFilters } from './types'

// 초기값 정의
const initialUserFilters: UserFilters = {
  search: undefined,
  is_approved: undefined, // 전체 상태
  role: 'member', // 기본값: 일반 회원
  page: 1,
}

const initialContentFilters: ContentFilters = {
  page: 1,
  search: undefined,
  is_analyzed: undefined,
}

interface AdminState {
  // 필터 상태
  userFilters: UserFilters
  contentFilters: ContentFilters
  reviewFilters: ReviewFilters

  // 선택 상태 (사용자만 유지, 콘텐츠는 제거)
  selectedUserIds: string[]

  // 액션
  setUserFilters: (filters: Partial<UserFilters>) => void
  resetUserFilters: () => void
  setContentFilters: (filters: Partial<ContentFilters>) => void
  setReviewFilters: (filters: ReviewFilters) => void
  toggleUserSelection: (userId: string) => void
  clearUserSelections: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  // 초기 상태
  userFilters: initialUserFilters,
  contentFilters: initialContentFilters,
  reviewFilters: {},
  selectedUserIds: [],

  // 액션
  setUserFilters: (filters) =>
    set((state) => ({
      userFilters: { ...state.userFilters, ...filters },
    })),
  resetUserFilters: () => set({ userFilters: initialUserFilters }),
  setContentFilters: (filters) =>
    set((state) => ({
      contentFilters: { ...state.contentFilters, ...filters },
    })),
  setReviewFilters: (filters) => set({ reviewFilters: filters }),
  toggleUserSelection: (userId) =>
    set((state) => ({
      selectedUserIds: state.selectedUserIds.includes(userId)
        ? state.selectedUserIds.filter((id) => id !== userId)
        : [...state.selectedUserIds, userId],
    })),
  clearUserSelections: () => set({ selectedUserIds: [] }),
}))
