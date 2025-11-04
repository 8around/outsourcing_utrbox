'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, SortAsc, SortDesc, Folder } from 'lucide-react'
import { Collection } from '@/types/collection'

interface UserContentToolbarProps {
  searchQuery: string
  sortBy: 'name' | 'date'
  sortOrder: 'asc' | 'desc'
  collections: Collection[]
  selectedCollectionId: string | null
  onSearchChange: (query: string) => void
  onSortByChange: (sortBy: 'name' | 'date') => void
  onSortOrderToggle: () => void
  onCollectionChange: (collectionId: string | null) => void
}

export function UserContentToolbar({
  searchQuery,
  sortBy,
  sortOrder,
  collections,
  selectedCollectionId,
  onSearchChange,
  onSortByChange,
  onSortOrderToggle,
  onCollectionChange,
}: UserContentToolbarProps) {
  return (
    <div className="rounded-xl border bg-background shadow">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Collection Select */}
          <Select
            value={selectedCollectionId || 'all'}
            onValueChange={(val) => {
              onCollectionChange(val === 'all' ? null : val)
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="모든 컨텐츠" />
            </SelectTrigger>
            <SelectContent>
              {/* 모든 컨텐츠 옵션 */}
              <SelectItem value="all">
                <div className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  모든 컨텐츠
                </div>
              </SelectItem>

              {/* 컬렉션 목록 */}
              {collections.length > 0 && (
                <ScrollArea className="max-h-[300px]">
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <div className="flex items-center">
                        <Folder className="mr-2 h-4 w-4" />
                        {collection.name}
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              )}
            </SelectContent>
          </Select>

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
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={onSortByChange}>
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
              onClick={onSortOrderToggle}
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
