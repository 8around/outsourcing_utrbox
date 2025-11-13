'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

interface ReviewStatusModalProps {
  isOpen: boolean
  onClose: () => void
  detectionId: string
  currentStatus: string | null
  onUpdate: () => void
}

type ReviewStatus = 'pending' | 'match' | 'no_match' | 'cannot_compare'

export function ReviewStatusModal({
  isOpen,
  onClose,
  detectionId,
  currentStatus,
  onUpdate,
}: ReviewStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(
    (currentStatus || 'pending') as ReviewStatus
  )
  const [isLoading, setIsLoading] = useState(false)

  // currentStatus 또는 모달이 열릴 때마다 selectedStatus 동기화
  useEffect(() => {
    setSelectedStatus((currentStatus || 'pending') as ReviewStatus)
  }, [currentStatus, isOpen])

  const statuses: Array<{
    value: ReviewStatus
    label: string
    badge: React.ReactNode
  }> = [
    {
      value: 'match',
      label: '일치',
      badge: (
        <Badge className="bg-error/10 text-error pointer-events-none">
          일치
        </Badge>
      ),
    },
    {
      value: 'no_match',
      label: '불일치',
      badge: <Badge className="bg-success/10 text-success pointer-events-none">불일치</Badge>,
    },
    {
      value: 'cannot_compare',
      label: '비교 불가',
      badge: <Badge className="bg-gray-100 text-gray-700 pointer-events-none">비교 불가</Badge>,
    },
    {
      value: 'pending',
      label: '대기',
      badge: <Badge className="bg-yellow-100 text-yellow-700 pointer-events-none">대기</Badge>,
    },
  ]

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/detected-contents/${detectionId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_review_status: selectedStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('판정 업데이트에 실패했습니다.')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('판정 업데이트 에러:', error)
      alert(error instanceof Error ? error.message : '판정 업데이트에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>판정 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>판정 상태</Label>
            <RadioGroup
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as ReviewStatus)}
            >
              <div className="space-y-3">
                {statuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={status.value} id={status.value} />
                    <Label
                      htmlFor={status.value}
                      className="flex cursor-pointer items-center gap-2 font-normal"
                    >
                      {status.badge}
                      <span>{status.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium">판정 기준</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
              <li>일치: 원본과 발견 이미지가 동일하다고 판단</li>
              <li>불일치: 원본과 발견 이미지가 다르다고 판단</li>
              <li>비교 불가: 이미지 품질 등의 이유로 비교가 어려운 경우</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading || selectedStatus === currentStatus}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
