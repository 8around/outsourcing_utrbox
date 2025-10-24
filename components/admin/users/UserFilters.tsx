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
    onFilterChange({ ...filters, search: value || undefined })
  }

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value === 'all' ? undefined : (value as 'approved' | 'pending' | 'blocked'),
    })
  }

  const handleRoleChange = (value: string) => {
    onFilterChange({
      ...filters,
      role: value === 'all' ? undefined : (value as 'member' | 'admin'),
    })
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
          className="pl-10"
        />
      </div>

      {/* 상태 필터 */}
      <Select
        value={
          filters.status === undefined
            ? 'all'
            : filters.status === null
              ? 'pending'
              : filters.status
        }
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="approved">승인됨</SelectItem>
          <SelectItem value="pending">승인 대기</SelectItem>
          <SelectItem value="blocked">거부됨</SelectItem>
        </SelectContent>
      </Select>

      {/* 역할 필터 */}
      <Select value={filters.role ?? 'all'} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="역할" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 역할</SelectItem>
          <SelectItem value="member">일반 회원</SelectItem>
          <SelectItem value="admin">관리자</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
