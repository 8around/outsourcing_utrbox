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
import { ContentFilters as ContentFiltersType } from '@/lib/admin/types'

interface ContentFiltersProps {
  filters: ContentFiltersType
  onFilterChange: (filters: ContentFiltersType) => void
}

export function ContentFilters({ filters, onFilterChange }: ContentFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value || undefined })
  }

  const handleAnalysisStatusChange = (value: string) => {
    if (value === 'all') {
      onFilterChange({ ...filters, is_analyzed: undefined })
    } else if (value === 'pending') {
      onFilterChange({ ...filters, is_analyzed: null })
    } else if (value === 'analyzing') {
      onFilterChange({ ...filters, is_analyzed: false })
    } else if (value === 'completed') {
      onFilterChange({ ...filters, is_analyzed: true })
    }
  }

  const getAnalysisStatusValue = () => {
    if (filters.is_analyzed === undefined) return 'all'
    if (filters.is_analyzed === null) return 'pending'
    if (filters.is_analyzed === false) return 'analyzing'
    if (filters.is_analyzed === true) return 'completed'
    return 'all'
  }

  return (
    <div className="flex flex-wrap gap-4">
      {/* 검색 */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="파일명 검색..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 분석 상태 필터 */}
      <Select value={getAnalysisStatusValue()} onValueChange={handleAnalysisStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="분석 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="pending">대기</SelectItem>
          <SelectItem value="analyzing">분석 중</SelectItem>
          <SelectItem value="completed">완료</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
