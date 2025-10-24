'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DetectedContent } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye } from 'lucide-react'
import Image from 'next/image'
import { getPlaceholderImageUrl } from '@/lib/admin/mock-data'

interface DetectionListProps {
  detections: DetectedContent[]
  onDetectionClick: (detectionId: string) => void
}

export function DetectionList({ detections, onDetectionClick }: DetectionListProps) {
  const getDetectionTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
            완전 일치
          </Badge>
        )
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">부분 일치</Badge>
        )
      case 'similar':
        return <Badge variant="secondary">시각적 유사</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">원본</TableHead>
            <TableHead className="w-20">발견</TableHead>
            <TableHead>원본 파일명</TableHead>
            <TableHead>페이지 제목</TableHead>
            <TableHead>검출 유형</TableHead>
            <TableHead>발견일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                검토 대기 중인 항목이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            detections.map((detection) => (
              <TableRow
                key={detection.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onDetectionClick(detection.id)}
              >
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded border">
                    <Image
                      src={getPlaceholderImageUrl(
                        100,
                        100,
                        detection.original_file_name || 'original'
                      )}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded border">
                    <Image
                      src={getPlaceholderImageUrl(100, 100, detection.id)}
                      alt="Detected"
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{detection.original_file_name || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {detection.page_title || '(제목 없음)'}
                </TableCell>
                <TableCell>{getDetectionTypeBadge(detection.detection_type)}</TableCell>
                <TableCell className="text-gray-600">
                  {format(new Date(detection.created_at), 'PPP', { locale: ko })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDetectionClick(detection.id)
                    }}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    검토
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
