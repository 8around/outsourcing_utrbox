'use client'

import { Collection } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, Plus } from 'lucide-react'

interface CollectionSelectProps {
  collections: Collection[]
  currentCollectionId?: string | null
  onCollectionChange: (collectionId: string | null) => void
  onCreateCollection: () => void
}

export function CollectionSelect({
  collections,
  currentCollectionId,
  onCollectionChange,
  onCreateCollection,
}: CollectionSelectProps) {
  const value = currentCollectionId || 'all'

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onCollectionChange(val === 'all' ? null : val)
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="모든 컨텐츠" />
      </SelectTrigger>
      <SelectContent>
        {/* 컬렉션 추가 버튼 */}
        <div className="p-2 border-b">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateCollection()
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            새 컬렉션
          </Button>
        </div>

        {/* 모든 컨텐츠 옵션 */}
        <SelectItem value="all">
          <div className="flex items-center">
            <Folder className="mr-2 h-4 w-4" />
            모든 컨텐츠
          </div>
        </SelectItem>

        {/* 컬렉션 목록 - 스크롤 영역 */}
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
  )
}
