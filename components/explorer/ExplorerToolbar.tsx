'use client'

import { useState } from 'react'
import { useExplorerStore } from '@/lib/stores/explorerStore'
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
import { Grid, List, Search, Upload, FolderPlus, ArrowUpDown } from 'lucide-react'
import { UploadModal } from './UploadModal'
import { CreateCollectionModal } from './CreateCollectionModal'

interface ExplorerToolbarProps {
  currentPath: string | null
  currentCollection: Collection | null
  collections?: Collection[] // 사용자의 컬렉션 목록
  onNavigateToRoot: () => void
  onRefresh?: () => void // 목록 갱신 콜백
}

export function ExplorerToolbar({
  currentPath,
  currentCollection,
  collections = [],
  onNavigateToRoot,
  onRefresh,
}: ExplorerToolbarProps) {
  const { viewMode, sortBy, sortOrder, searchQuery, toggleViewMode, setSortBy, toggleSortOrder, setSearchQuery } =
    useExplorerStore()
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">업로드순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode */}
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleViewMode()}
            className="h-8 w-8 p-0"
            title="그리드 뷰"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleViewMode()}
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
