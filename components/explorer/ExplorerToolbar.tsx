'use client'

import { ViewMode, SortBy } from '@/lib/stores/explorerStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Grid, List, Search, Upload } from 'lucide-react'
import Link from 'next/link'

interface ExplorerToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ExplorerToolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: ExplorerToolbarProps) {
  return (
    <div className="border-b bg-background p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-secondary-400 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="콘텐츠 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortBy)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">최신순</SelectItem>
            <SelectItem value="name">이름순</SelectItem>
            <SelectItem value="size">크기순</SelectItem>
            <SelectItem value="detections">발견 건수순</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8 p-0"
            title="그리드 뷰"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8 p-0"
            title="리스트 뷰"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Upload Button */}
        <Link href="/contents/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">업로드</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
