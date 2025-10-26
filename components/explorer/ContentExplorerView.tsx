'use client'

import { Content, getAnalysisStatus } from '@/types/content'
import { ViewMode } from '@/lib/stores/explorerStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Image, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { getDetectionCount } from '@/lib/mock-data/contents'

// Supabase Storage URL 생성 헬퍼 함수 (Mock 환경에서는 Unsplash 사용)
function getFileUrl(filePath: string): string {
  // 실제 환경에서는 Supabase Storage URL을 사용
  // const { data } = supabase.storage.from('contents').getPublicUrl(filePath)
  // return data.publicUrl

  // Mock 환경: 파일명 기반으로 Unsplash 이미지 반환
  const imageMap: Record<string, string> = {
    'jeju_seongsan': 'photo-1519681393784-d120267933ba',
    'busan_haeundae': 'photo-1506905925346-21bda4d32df4',
    'gyeongju_bulguksa': 'photo-1478436127897-769e1b3f0f36',
    'paris_eiffel': 'photo-1502602898657-3e91760cbb34',
    'london_bigben': 'photo-1513635269975-59663e0ac1ad',
    'newyork_liberty': 'photo-1485871981521-5b1fd3805eee',
    'promo_banner': 'photo-1558655146-d09347e92766',
    'launch_poster': 'photo-1561070791-2526d30994b5',
    'sns_ad': 'photo-1572635196237-14b3f281503f',
    'laptop_product': 'photo-1496181133206-80ce9b88a853',
    'smartphone_white': 'photo-1511707171634-5f897ff02aa9',
    'wireless_earbuds': 'photo-1590658268037-6bf12165a8df',
    'smartwatch_black': 'photo-1523275335684-37898b6baf30',
    'random_test': 'photo-1501594907352-04cda38ebc29',
    'error_test': 'photo-1469854523086-cc02fe5d8800',
    'branding_design_a': 'photo-1558655146-d09347e92766',
    'poster_design': 'photo-1561070791-2526d30994b5',
    'anniversary_event': 'photo-1511795409834-ef04bbd61622',
    'product_launch': 'photo-1505373877841-8d25f7d46678',
    'workshop_group': 'photo-1511578314322-379afb476865',
  }

  const fileKey = filePath.split('/')[1]?.split('_').slice(1).join('_').replace('.jpg', '').replace('.png', '') || ''
  const imageId = imageMap[fileKey] || 'photo-1501594907352-04cda38ebc29'
  return `https://images.unsplash.com/${imageId}`
}

// 파일 크기 계산 헬퍼 함수 (Mock 환경)
function getFileSize(filePath: string): number {
  // 실제 환경에서는 Storage metadata에서 가져옴
  // Mock: 1MB ~ 3MB 랜덤
  return Math.floor(Math.random() * 2097152) + 1048576
}

interface ContentExplorerViewProps {
  contents: Content[]
  viewMode: ViewMode
  selectedIds: string[]
  onSelectContent: (ids: string[]) => void
  onOpenContent: (id: string) => void
}

export function ContentExplorerView({
  contents,
  viewMode,
  selectedIds,
  onSelectContent,
  onOpenContent,
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
      // 일반 클릭: 단일 선택
      onSelectContent([id])
    }
  }

  if (contents.length === 0) {
    return (
      <div className="text-secondary-500 flex h-full flex-col items-center justify-center">
        <Image className="text-secondary-300 mb-4 h-16 w-16" />
        <p className="text-lg font-medium">콘텐츠가 없습니다</p>
        <p className="text-secondary-400 mt-1 text-sm">콘텐츠를 업로드해보세요</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <ScrollArea className="h-full">
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contents.map((content) => (
            <Card
              key={content.id}
              className={cn(
                'hover:border-primary group cursor-pointer overflow-hidden transition-all',
                selectedIds.includes(content.id) && 'border-primary ring-primary ring-2'
              )}
              onClick={(e) => handleContentClick(content.id, e)}
              onDoubleClick={() => onOpenContent(content.id)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-secondary-100">
                <img
                  src={getFileUrl(content.file_path)}
                  alt={content.file_name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
              <img
                src={getFileUrl(content.file_path)}
                alt={content.file_name}
                className="h-16 w-16 flex-shrink-0 rounded object-cover"
              />

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
                  {format(new Date(content.created_at), 'yyyy.MM.dd', { locale: ko })}
                </p>
                <p className="text-secondary-400 text-xs">
                  {(getFileSize(content.file_path) / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
