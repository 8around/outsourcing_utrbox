'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserFilters as UserFiltersType } from '@/lib/admin/types'

interface UserFiltersProps {
  filters: UserFiltersType
  onFilterChange: (filters: UserFiltersType) => void
}

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value || undefined, page: 1 })
  }

  const handleApprovalStatusChange = (value: string) => {
    let isApproved: boolean | null | undefined

    if (value === 'all') {
      isApproved = undefined // 전체
    } else if (value === 'pending') {
      isApproved = null // 승인 대기
    } else if (value === 'approved') {
      isApproved = true // 승인됨
    } else if (value === 'blocked') {
      isApproved = false // 거부됨
    }

    onFilterChange({
      ...filters,
      is_approved: isApproved,
      page: 1, // 필터 변경 시 첫 페이지로
    })
  }

  const handleRoleChange = (value: string) => {
    onFilterChange({
      ...filters,
      role: value as 'member' | 'admin',
      page: 1,
    })
  }

  // is_approved 값을 Select value로 변환
  const getApprovalStatusValue = () => {
    if (filters.is_approved === undefined) return 'all'
    if (filters.is_approved === null) return 'pending'
    if (filters.is_approved === true) return 'approved'
    if (filters.is_approved === false) return 'blocked'
    return 'all'
  }

  return (
    <div className="flex flex-wrap gap-4">
      {/* 검색 */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="이름, 이메일, 소속 검색..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="bg-white pl-10"
        />
      </div>

      {/* 승인 상태 필터 */}
      <Select
        value={getApprovalStatusValue()}
        onValueChange={handleApprovalStatusChange}
      >
        <SelectTrigger className="bg-white w-[150px]">
          <SelectValue placeholder="승인 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="approved">승인됨</SelectItem>
          <SelectItem value="pending">승인 대기</SelectItem>
          <SelectItem value="blocked">거부됨</SelectItem>
        </SelectContent>
      </Select>

      {/* 역할 필터 - '전체 역할' 옵션 제거 */}
      <Select value={filters.role} onValueChange={handleRoleChange}>
        <SelectTrigger className="bg-white w-[150px]">
          <SelectValue placeholder="역할" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">일반 회원</SelectItem>
          <SelectItem value="admin">관리자</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
