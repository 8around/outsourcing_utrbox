'use client'

import { useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { DetectionList } from '@/components/admin/review/DetectionList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockDetectedContents } from '@/lib/admin/mock-data'
import { useAdminStore } from '@/lib/admin/store'

export default function AdminReviewPage() {
  useAdminTitle('비교 검토')
  const router = useRouter()
  const { reviewFilters, setReviewFilters } = useAdminStore()

  // 필터링된 발견 콘텐츠 (검토 대기만)
  const filteredDetections = mockDetectedContents.filter((detection) => {
    // 기본적으로 검토 대기만 표시
    if (detection.admin_review_status !== 'pending') {
      return false
    }

    // 검출 유형 필터
    if (reviewFilters.detection_type && detection.detection_type !== reviewFilters.detection_type) {
      return false
    }

    return true
  })

  const handleDetectionClick = (detectionId: string) => {
    router.push(`/admin/review/${detectionId}`)
  }

  const handleDetectionTypeChange = (value: string) => {
    setReviewFilters({
      ...reviewFilters,
      detection_type: value === 'all' ? undefined : (value as 'full' | 'partial' | 'similar'),
    })
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">검토 대기 {filteredDetections.length}건</div>

        <Select
          value={reviewFilters.detection_type || 'all'}
          onValueChange={handleDetectionTypeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="검출 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="full">완전 일치</SelectItem>
            <SelectItem value="partial">부분 일치</SelectItem>
            <SelectItem value="similar">시각적 유사</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 검토 대기 리스트 */}
      <DetectionList detections={filteredDetections} onDetectionClick={handleDetectionClick} />
    </div>
  )
}
