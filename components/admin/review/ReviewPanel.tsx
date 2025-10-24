'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'

type ReviewStatus = 'match' | 'no_match' | 'cannot_compare'

interface ReviewPanelProps {
  onReview: (status: ReviewStatus, memo?: string) => void
}

export function ReviewPanel({ onReview }: ReviewPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('match')
  const [memo, setMemo] = useState('')

  const handleSubmit = () => {
    onReview(selectedStatus, memo || undefined)
  }

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">판정 결과</h3>
        <RadioGroup
          value={selectedStatus}
          onValueChange={(v) => setSelectedStatus(v as ReviewStatus)}
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <RadioGroupItem value="match" id="match" />
              <Label
                htmlFor="match"
                className="flex flex-1 cursor-pointer items-center gap-2 font-medium"
              >
                <CheckCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-900">일치</p>
                  <p className="text-xs text-red-600">
                    원본과 발견 이미지가 동일하거나 저작권 침해로 판단됩니다.
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-4">
              <RadioGroupItem value="no_match" id="no_match" />
              <Label
                htmlFor="no_match"
                className="flex flex-1 cursor-pointer items-center gap-2 font-medium"
              >
                <XCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-900">불일치</p>
                  <p className="text-xs text-green-600">
                    원본과 발견 이미지가 다르며 저작권 침해가 아닙니다.
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <RadioGroupItem value="cannot_compare" id="cannot_compare" />
              <Label
                htmlFor="cannot_compare"
                className="flex flex-1 cursor-pointer items-center gap-2 font-medium"
              >
                <HelpCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-gray-900">비교 불가</p>
                  <p className="text-xs text-gray-600">
                    이미지를 비교할 수 없거나 판정이 어렵습니다.
                  </p>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="memo">판정 사유 (선택)</Label>
        <Textarea
          id="memo"
          placeholder="판정 사유를 입력하세요..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-2 h-24"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full" size="lg">
        판정 완료
      </Button>
    </div>
  )
}
