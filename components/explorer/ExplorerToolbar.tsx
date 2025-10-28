'use client'

import { useState } from 'react'
import { ViewMode, SortBy } from '@/lib/stores/explorerStore'
import { Collection } from '@/types/collection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Grid, List, Search, Upload, FolderPlus } from 'lucide-react'
import { UploadModal } from './UploadModal'
import { CreateCollectionModal } from './CreateCollectionModal'

interface ExplorerToolbarProps {
  currentPath: string | null
  currentCollection: Collection | null
  collections?: Collection[] // 사용자의 컬렉션 목록
  onNavigateToRoot: () => void
  onRefresh?: () => void // 목록 갱신 콜백
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ExplorerToolbar({
  currentPath,
  currentCollection,
  collections = [],
  onNavigateToRoot,
  onRefresh,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: ExplorerToolbarProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false)

  const isRootPath = currentCollection === null

  return (
    <>
    <div className="border-b bg-background">
      {/* Breadcrumb */}
      <div className="border-b px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer hover:text-primary"
                onClick={onNavigateToRoot}
              >
                모든 콘텐츠
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentPath && currentCollection && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-foreground">
                    {currentCollection.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Toolbar */}
      <div className="p-4">
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

        {/* Collection Button (루트 경로에서만 표시) */}
        {isRootPath && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsCreateCollectionModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">컬렉션 추가</span>
          </Button>
        )}

        {/* Upload Button (항상 표시) */}
        <Button className="gap-2" onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">업로드</span>
        </Button>
        </div>
      </div>
    </div>

    {/* Create Collection Modal */}
    <CreateCollectionModal
      open={isCreateCollectionModalOpen}
      onOpenChange={setIsCreateCollectionModalOpen}
      onCollectionCreated={() => {
        if (onRefresh) {
          onRefresh()
        }
      }}
    />

    {/* Upload Modal */}
    <UploadModal
      open={isUploadModalOpen}
      onOpenChange={setIsUploadModalOpen}
      defaultCollectionId={currentCollection?.id || null}
      collections={collections}
      onUploadComplete={() => {
        if (onRefresh) {
          onRefresh()
        }
      }}
    />
    </>
  )
}
