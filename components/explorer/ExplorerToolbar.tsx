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
import { Grid, List, Search, Upload, SortAsc, SortDesc, RefreshCw } from 'lucide-react'
import { UploadModal } from './UploadModal'
import { CollectionSelect } from './CollectionSelect'

interface ExplorerToolbarProps {
  currentCollection: Collection | null
  collections: Collection[]
  onCollectionChange: (collectionId: string | null) => void
  onCreateCollection: () => void
  onRefresh?: () => void
}

export function ExplorerToolbar({
  currentCollection,
  collections,
  onCollectionChange,
  onCreateCollection,
  onRefresh,
}: ExplorerToolbarProps) {
  const { viewMode, sortBy, sortOrder, searchQuery, toggleViewMode, setSortBy, toggleSortOrder, setSearchQuery } =
    useExplorerStore()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <div className="rounded-xl border bg-background shadow">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Collection Select */}
            <CollectionSelect
              collections={collections}
              currentCollectionId={currentCollection?.id}
              onCollectionChange={onCollectionChange}
              onCreateCollection={onCreateCollection}
            />

            {/* Refresh Button */}
            {onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh} title="새로고침">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

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
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
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

            {/* Upload Button */}
            <Button className="gap-2" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">업로드</span>
            </Button>
          </div>
        </div>
      </div>

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
