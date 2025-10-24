'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Content } from '@/lib/admin/types'
import { AnalysisStatusBadge } from './AnalysisStatusBadge'
import { AnalysisButton } from './AnalysisButton'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Trash2, Play } from 'lucide-react'
import Image from 'next/image'
import { getPlaceholderImageUrl } from '@/lib/admin/mock-data'

interface ContentTableProps {
  contents: Content[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onAnalyze?: (contentIds: string[]) => void
  onDelete?: (contentIds: string[]) => void
}

export function ContentTable({
  contents,
  selectedIds,
  onSelectionChange,
  onAnalyze,
  onDelete,
}: ContentTableProps) {
  const router = useRouter()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(contents.map((c) => c.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (contentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, contentId])
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== contentId))
    }
  }

  const handleAnalyze = (contentId: string) => {
    onAnalyze?.([contentId])
  }

  return (
    <div className="space-y-4">
      {/* 일괄 작업 버튼 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.length}개 선택됨</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAnalyze?.(selectedIds)}
              className="gap-1"
            >
              <Play className="h-4 w-4" />
              일괄 분석
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(selectedIds)}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              일괄 삭제
            </Button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === contents.length && contents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">썸네일</TableHead>
              <TableHead>파일명</TableHead>
              <TableHead>업로더</TableHead>
              <TableHead>컬렉션</TableHead>
              <TableHead>분석 상태</TableHead>
              <TableHead>발견 건수</TableHead>
              <TableHead>업로드일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              contents.map((content) => (
                <TableRow
                  key={content.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/contents/${content.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(content.id)}
                      onCheckedChange={(checked) => handleSelectOne(content.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative h-12 w-12 overflow-hidden rounded border">
                      <Image
                        src={getPlaceholderImageUrl(100, 100, content.id)}
                        alt={content.file_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{content.file_name}</TableCell>
                  <TableCell className="text-gray-600">{content.user_name || '-'}</TableCell>
                  <TableCell className="text-gray-600">{content.collection_name || '-'}</TableCell>
                  <TableCell>
                    <AnalysisStatusBadge
                      status={content.is_analyzed}
                      message={content.message || undefined}
                    />
                  </TableCell>
                  <TableCell>
                    {content.detected_count && content.detected_count > 0 ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-700 hover:bg-red-100"
                      >
                        {content.detected_count}건
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {format(new Date(content.created_at), 'PPP', { locale: ko })}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {content.is_analyzed === null && (
                        <AnalysisButton contentId={content.id} onAnalyze={handleAnalyze} />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/contents/${content.id}`)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        상세
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
