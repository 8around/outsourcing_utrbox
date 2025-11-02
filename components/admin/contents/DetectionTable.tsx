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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Eye, ExternalLink } from 'lucide-react'

interface DetectedContent {
  id: string
  content_id: string
  source_url: string | null
  image_url: string
  page_title: string | null
  detection_type: string
  admin_review_status: string | null
  created_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

interface DetectionTableProps {
  detections: DetectedContent[]
  selectedDetection: DetectedContent | null
  onDetectionClick: (detection: DetectedContent) => void
}

export function DetectionTable({
  detections,
  selectedDetection,
  onDetectionClick
}: DetectionTableProps) {
  // Collapsible 상태 관리 - 기본으로 완전 일치 섹션만 열림
  const [openSections, setOpenSections] = useState<string[]>(['full'])

  // 섹션 토글 함수
  const toggleSection = (type: string) => {
    setOpenSections(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // detection_type 별 그룹화
  const detectionGroups = [
    {
      type: 'full',
      label: '완전 일치',
      badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100',
      detections: detections.filter(d => d.detection_type === 'full')
    },
    {
      type: 'partial',
      label: '부분 일치',
      badgeClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      detections: detections.filter(d => d.detection_type === 'partial')
    },
    {
      type: 'similar',
      label: '시각적 유사',
      badgeClass: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
      detections: detections.filter(d => d.detection_type === 'similar')
    }
  ]

  const getDetectionTypeBadge = (type: string, badgeClass: string) => {
    const labels = {
      full: '완전 일치',
      partial: '부분 일치',
      similar: '시각적 유사'
    }
    return (
      <Badge className={badgeClass}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    )
  }

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
      {detectionGroups.map(group => {
        const isOpen = openSections.includes(group.type)

        // 해당 타입의 검출이 없으면 섹션을 렌더링하지 않음
        if (group.detections.length === 0) return null

        return (
          <Collapsible
            key={group.type}
            open={isOpen}
            onOpenChange={() => toggleSection(group.type)}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer rounded-lg border bg-gray-50 px-4 py-3 hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-semibold text-gray-900">{group.label}</span>
                  <Badge variant="outline" className="ml-2">
                    {group.detections.length}건
                  </Badge>
                </div>
                {getDetectionTypeBadge(group.type, group.badgeClass)}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>발견 이미지</TableHead>
                      <TableHead>페이지 제목</TableHead>
                      <TableHead>검출 유형</TableHead>
                      <TableHead>검토 상태</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.detections.map(detection => (
                      <TableRow
                        key={detection.id}
                        className={`hover:bg-gray-50 transition ${
                          selectedDetection?.id === detection.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="relative h-12 w-12 overflow-hidden rounded border">
                            <Image
                              src={detection.image_url}
                              alt="Detected"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <a
                              href={detection.source_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="truncate max-w-xs">
                                {detection.page_title || '(제목 없음)'}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                            {detection.source_url && (
                              <p className="max-w-xs truncate text-xs text-gray-500 mt-1">
                                {detection.source_url}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDetectionTypeBadge(group.type, group.badgeClass)}
                        </TableCell>
                        <TableCell>
                          {getReviewStatusBadge(detection.admin_review_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDetectionClick(detection)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            보기
                          </Button>
                        </TableCell>
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
