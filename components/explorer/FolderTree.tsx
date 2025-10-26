'use client'

import { Collection } from '@/types/collection'
import { FolderOpen, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FolderTreeProps {
  collections: Collection[]
  selectedId?: string | null
  onSelectCollection: (id: string | null) => void
  onCreateCollection?: () => void
  onRenameCollection?: (id: string) => void
  onDeleteCollection?: (id: string) => void
}

export function FolderTree({
  collections,
  selectedId,
  onSelectCollection,
}: FolderTreeProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-semibold">컬렉션</h2>
      </div>

      {/* Tree List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Contents Option */}
          <button
            onClick={() => onSelectCollection(null)}
            className={cn(
              'hover:bg-secondary-50 flex w-full items-center gap-2 rounded-lg p-3 text-left transition-colors',
              selectedId === null && 'bg-primary-50 text-primary-600'
            )}
          >
            <FolderOpen className="h-5 w-5 flex-shrink-0" />
            <span className="truncate font-medium">모든 콘텐츠</span>
          </button>

          {/* Collections */}
          <div className="mt-2 space-y-1">
            {collections.length === 0 ? (
              <div className="text-secondary-500 py-8 text-center text-sm">
                <Folder className="text-secondary-300 mx-auto mb-2 h-8 w-8" />
                <p>컬렉션이 없습니다</p>
              </div>
            ) : (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => onSelectCollection(collection.id)}
                  className={cn(
                    'hover:bg-secondary-50 flex w-full items-center gap-2 rounded-lg p-3 text-left transition-colors',
                    selectedId === collection.id && 'bg-primary-50 text-primary-600'
                  )}
                  title={collection.description}
                >
                  <Folder className="h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{collection.name}</p>
                    <p className="text-secondary-500 truncate text-xs">
                      {collection.item_count}개 항목
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
