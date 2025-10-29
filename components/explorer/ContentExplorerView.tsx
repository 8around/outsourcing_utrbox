'use client'

import { Content, getAnalysisStatus } from '@/types/content'
import { Collection } from '@/types/collection'
import { ViewMode } from '@/lib/stores/explorerStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { getDetectionCount } from '@/lib/mock-data/contents'
import Image from 'next/image'

interface ContentExplorerViewProps {
  contents: Content[]
  collections: Collection[]
  viewMode: ViewMode
  selectedIds: string[]
  onSelectContent: (ids: string[]) => void
  onOpenContent: (id: string) => void
  isLoading?: boolean
}

export function ContentExplorerView({
  contents,
  collections,
  viewMode,
  selectedIds,
  onSelectContent,
  onOpenContent,
  isLoading = false,
}: ContentExplorerViewProps) {
  const getStatusColor = (content: Content) => {
    const status = getAnalysisStatus(content)
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success'
      case 'analyzing':
        return 'bg-primary/10 text-primary'
      case 'pending':
        return 'bg-warning/10 text-warning'
      case 'failed':
        return 'bg-error/10 text-error'
      default:
        return 'bg-secondary-100 text-secondary-600'
    }
  }

  const getStatusText = (content: Content) => {
    const status = getAnalysisStatus(content)
    switch (status) {
      case 'completed':
        return '분석 완료'
      case 'analyzing':
        return '분석 중'
      case 'pending':
        return '대기 중'
      case 'failed':
        return '실패'
      default:
        return status
    }
  }

  const handleContentClick = (id: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: 다중 선택
      if (selectedIds.includes(id)) {
        onSelectContent(selectedIds.filter((selectedId) => selectedId !== id))
      } else {
        onSelectContent([...selectedIds, id])
      }
    } else if (event.shiftKey && selectedIds.length > 0) {
      // Shift + Click: 범위 선택 (구현 생략, 기본 다중 선택으로 대체)
      onSelectContent([...selectedIds, id])
    } else {
      // 일반 클릭: 상세 페이지로 이동 (컬렉션과 동일)
      onOpenContent(id)
    }
  }

  // 로딩 중일 때 Skeleton 표시
  if (isLoading) {
    if (viewMode === 'grid') {
      return (
        <ScrollArea className="h-full">
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )
    } else {
      return (
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="divide-y rounded-lg border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-16 h-16 rounded" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )
    }
  }

  if (collections.length === 0 && contents.length === 0) {
    return (
      <div className="text-secondary-500 flex h-full flex-col items-center justify-center">
        <ImageIcon className="text-secondary-300 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">콘텐츠가 없습니다</p>
        <p className="text-secondary-400 mt-1 text-sm">콘텐츠를 업로드해보세요</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <ScrollArea className="h-full">
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 콘텐츠 카드 렌더링 */}
          {contents.map((content) => (
            <Card
              key={content.id}
              className={cn(
                'hover:border-primary group cursor-pointer overflow-hidden transition-all',
                selectedIds.includes(content.id) && 'border-primary ring-primary ring-2'
              )}
              onClick={(e) => handleContentClick(content.id, e)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <Image
                  src={content.file_path}
                  alt={content.file_name}
                  className="transition-transform group-hover:scale-105"
                  fill
                  objectFit="contain"
                  loading="lazy"
                  unoptimized
                />
                {getDetectionCount(content.id) > 0 && (
                  <div className="absolute right-2 top-2">
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getDetectionCount(content.id)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="truncate font-medium">{content.file_name}</h3>
                <p className="text-secondary-500 mt-1 truncate text-sm">
                  {content.message || ''}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="secondary" className={getStatusColor(content)}>
                    {getStatusText(content)}
                  </Badge>
                  <span className="text-secondary-400 text-xs">
                    {format(new Date(content.created_at), 'MM.dd', { locale: ko })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    )
  }

  // List View
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="divide-y rounded-lg border">
          {/* 콘텐츠 행 렌더링 */}
          {contents.map((content) => (
            <Link
              key={content.id}
              href={`/contents/${content.id}`}
              className={cn(
                'hover:bg-secondary-50 flex items-center gap-4 p-4 transition-colors',
                selectedIds.includes(content.id) && 'bg-primary-50'
              )}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                  e.preventDefault()
                  handleContentClick(content.id, e as React.MouseEvent<HTMLAnchorElement>)
                }
              }}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 overflow-hidden bg-secondary rounded">
                <Image
                  src={content.file_path}
                  alt={content.file_name}
                  fill
                  objectFit="contain"
                  loading="lazy"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{content.file_name}</h3>
                <p className="text-secondary-500 truncate text-sm">{content.message || ''}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className={getStatusColor(content)}>
                    {getStatusText(content)}
                  </Badge>
                  {getDetectionCount(content.id) > 0 && (
                    <span className="text-error flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {getDetectionCount(content.id)}건
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex-shrink-0 text-right">
                <p className="text-secondary-500 text-sm">
                  {format(new Date(content.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
