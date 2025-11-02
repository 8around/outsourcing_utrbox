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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface AIAnalysisRequestModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  isFirstRequest: boolean
  onSuccess: () => void
}

export function AIAnalysisRequestModal({
  isOpen,
  onClose,
  contentId,
  isFirstRequest,
  onSuccess
}: AIAnalysisRequestModalProps) {
  const [enableLabel, setEnableLabel] = useState(true)
  const [enableText, setEnableText] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRequest = async () => {
    setIsLoading(true)

    try {
      const features = []

      if (isFirstRequest) {
        if (enableLabel) features.push('label')
        if (enableText) features.push('text')
      }

      // WEB_DETECTION은 항상 포함
      features.push('web')

      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          features,
          isReanalysis: !isFirstRequest
        })
      })

      if (!response.ok) {
        throw new Error('AI 분석 요청에 실패했습니다.')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('AI 분석 요청 에러:', error)
      alert(error instanceof Error ? error.message : 'AI 분석 요청에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isFirstRequest ? 'AI 분석 요청' : 'AI 분석 추가요청'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isFirstRequest ? (
            <>
              <div className="space-y-3">
                <Label>분석 기능 선택</Label>

                <div className="space-y-3">
                  {/* 라벨 검출 */}
                  <div className="flex items-start space-x-3 rounded-md border p-3">
                    <Checkbox
                      id="label"
                      checked={enableLabel}
                      onCheckedChange={(checked) => setEnableLabel(checked as boolean)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="label" className="cursor-pointer font-medium">
                        라벨 검출 (Label Detection)
                      </Label>
                      <p className="text-xs text-gray-500">
                        이미지의 객체, 장면, 활동 등을 자동으로 탐지합니다.
                      </p>
                    </div>
                  </div>

                  {/* 텍스트 검출 */}
                  <div className="flex items-start space-x-3 rounded-md border p-3">
                    <Checkbox
                      id="text"
                      checked={enableText}
                      onCheckedChange={(checked) => setEnableText(checked as boolean)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="text" className="cursor-pointer font-medium">
                        텍스트 검출 (Text Detection)
                      </Label>
                      <p className="text-xs text-gray-500">
                        이미지 내의 텍스트를 인식하고 추출합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <p className="font-medium">이미지 검출 (Web Detection)</p>
                <p className="mt-1 text-xs">
                  웹에서 유사한 이미지를 검색하는 기능은 기본으로 포함됩니다.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
                <p className="font-medium">재요청 안내</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                  <li>이미지 검출 (WEB_DETECTION)만 재요청됩니다.</li>
                  <li>기존 결과와 중복되지 않는 새로운 결과만 추가됩니다.</li>
                  <li>
                    라벨/텍스트 재검출이 필요한 경우 해당 섹션의 새로고침 버튼을 사용하세요.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleRequest} disabled={isLoading}>
            {isLoading ? '요청 중...' : '분석 요청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
