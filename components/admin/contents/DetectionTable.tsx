'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Circle, CheckCircle2 } from 'lucide-react'
import { DetectedContent } from '@/types'

interface DetectionTableProps {
  detections: DetectedContent[]
  selectedDetection: DetectedContent | null
  onDetectionClick: (detection: DetectedContent) => void
  variant?: 'admin' | 'user' // 기본값: 'admin'
}

export function DetectionTable({
  detections,
  selectedDetection,
  onDetectionClick,
  variant = 'admin',
}: DetectionTableProps) {
  // Collapsible 상태 관리 - 기본으로 완전 일치 섹션만 열림
  const [openSections, setOpenSections] = useState<string[]>(['full'])

  // 섹션 토글 함수
  const toggleSection = (type: string) => {
    setOpenSections((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // detection_type 별 그룹화
  const detectionGroups = [
    {
      type: 'full',
      label: '완전 일치',
      badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100',
      detections: detections.filter((d) => d.detection_type === 'full'),
    },
    {
      type: 'partial',
      label: '부분 일치',
      badgeClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      detections: detections.filter((d) => d.detection_type === 'partial'),
    },
    {
      type: 'similar',
      label: '시각적 유사',
      badgeClass: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      detections: detections.filter((d) => d.detection_type === 'similar'),
    },
  ]

  const getReviewStatusBadge = (status: string | null) => {
    if (!status) status = 'pending'
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기</Badge>
      case 'match':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
            일치
          </Badge>
        )
      case 'no_match':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">불일치</Badge>
      case 'cannot_compare':
        return <Badge variant="secondary">비교 불가</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {detectionGroups.map((group) => {
        const isOpen = openSections.includes(group.type)

        // 해당 타입의 검출이 없으면 섹션을 렌더링하지 않음
        if (group.detections.length === 0) return null

        const pendingCount = group.detections.filter(
          (d) => (d.admin_review_status || 'pending') === 'pending'
        ).length

        const completedCount = group.detections.length - pendingCount

        return (
          <Collapsible
            key={group.type}
            open={isOpen}
            onOpenChange={() => toggleSection(group.type)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-lg border bg-gray-50 px-4 py-3 transition hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-semibold text-gray-900">{group.label}</span>
                </div>
                <div>
                  {variant === 'admin' ? (
                    <>
                      {pendingCount > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                          {pendingCount}건 대기중
                        </Badge>
                      )}
                      {completedCount > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {completedCount}건 검토 완료
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline">{group.detections.length}건</Badge>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">발견 이미지</TableHead>
                      <TableHead className="whitespace-nowrap">페이지 제목</TableHead>
                      {variant === 'admin' && (
                        <>
                          <TableHead className="whitespace-nowrap text-right">검토 상태</TableHead>
                          <TableHead className="whitespace-nowrap text-right">작업</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.detections.map((detection) => (
                      <TableRow
                        key={detection.id}
                        className={`transition hover:bg-gray-50 ${
                          selectedDetection?.id === detection.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="relative h-12 w-12 overflow-hidden rounded border">
                            <Image
                              referrerPolicy="no-referrer"
                              src={detection.image_url}
                              alt="출력불가"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </TableCell>
                        <TableCell
                          className={`min-w-0 max-w-xs ${variant === 'user' ? 'cursor-pointer' : ''}`}
                          onClick={variant === 'user' ? () => onDetectionClick(detection) : undefined}
                        >
                          <div className="flex w-full min-w-0 flex-col">
                            <span className="min-w-0 truncate font-medium text-gray-900">
                              {detection.page_title || '(제목 없음)'}
                            </span>
                            {detection.source_url && (
                              <a
                                href={detection.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 min-w-0 truncate text-xs text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {detection.source_url}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        {variant === 'admin' && (
                          <>
                            <TableCell className="text-right">
                              {getReviewStatusBadge(detection.admin_review_status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDetectionClick(detection)}
                                className="gap-1"
                              >
                                {selectedDetection?.id === detection.id ? (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-400" />
                                )}
                                비교
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
