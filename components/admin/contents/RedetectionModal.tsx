'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface RedetectionModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  featureType: 'label' | 'text'
  onSuccess: () => void
}

export function RedetectionModal({
  isOpen,
  onClose,
  contentId,
  featureType,
  onSuccess
}: RedetectionModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const featureLabel = featureType === 'label' ? '라벨' : '텍스트'

  const handleRedetect = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/vision/redetect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          featureType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // 에러 응답 처리
        toast({
          variant: 'destructive',
          title: '재검출 실패',
          description: data.message || `${featureLabel} 재검출에 실패했습니다.`
        })
        return
      }

      // 성공 응답 처리
      toast({
        title: '재검출 성공',
        description: data.message || `${featureLabel} 재검출이 완료되었습니다.`
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error(`${featureLabel} 재검출 에러:`, error)
      toast({
        variant: 'destructive',
        title: '요청 오류',
        description: error instanceof Error ? error.message : `${featureLabel} 재검출 중 오류가 발생했습니다.`
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{featureLabel} 재검출</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
            <p className="font-medium">주의</p>
            <p className="mt-1 text-xs">
              현재 {featureLabel} 검출 데이터를 덮어씁니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium text-gray-900">재검출 항목</p>
            <ul className="mt-2 list-inside list-disc text-xs text-gray-600">
              {featureType === 'label' ? (
                <>
                  <li>이미지 내 객체, 장면, 활동 등을 다시 탐지합니다.</li>
                  <li>기존 라벨 데이터는 완전히 교체됩니다.</li>
                </>
              ) : (
                <>
                  <li>이미지 내 텍스트를 다시 인식하고 추출합니다.</li>
                  <li>기존 텍스트 데이터는 완전히 교체됩니다.</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleRedetect} disabled={isLoading}>
            {isLoading ? '재검출 중...' : '재검출'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
