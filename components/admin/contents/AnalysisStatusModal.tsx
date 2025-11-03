'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

interface AnalysisStatusModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  currentStatus: boolean | null
  currentMessage: string | null
  onUpdate: () => void
}

export function AnalysisStatusModal({
  isOpen,
  onClose,
  contentId,
  currentStatus,
  currentMessage,
  onUpdate,
}: AnalysisStatusModalProps) {
  const [status, setStatus] = useState<string>(
    currentStatus === null ? 'null' : currentStatus === true ? 'true' : 'false'
  )
  const [message, setMessage] = useState(currentMessage || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/contents/${contentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_analyzed: status === 'null' ? null : status === 'true',
          message: message || null,
        }),
      })

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('상태 업데이트 에러:', error)

      toast({
        title: '상태 업데이트 에러',
        description: error instanceof Error ? error.message : '상태 업데이트에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'null':
        return <Badge className="bg-yellow-100 text-yellow-700">대기 중</Badge>
      case 'false':
        return <Badge className="bg-blue-100 text-blue-700">분석 중</Badge>
      case 'true':
        return <Badge className="bg-green-100 text-green-700">분석 완료</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>분석 상태 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 분석 상태 선택 */}
          <div className="space-y-2">
            <Label htmlFor="status">분석 상태</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null" disabled={currentStatus !== null}>
                  <div className="flex items-center gap-2">
                    {getStatusBadge('null')}
                    <span>대기 중</span>
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    {getStatusBadge('false')}
                    <span>분석 중</span>
                  </div>
                </SelectItem>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    {getStatusBadge('true')}
                    <span>분석 완료 (별도 메시지 전달 가능)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 메시지 입력 */}
          <div className="space-y-2">
            <Label htmlFor="message">메시지 (선택)</Label>
            <Textarea
              id="message"
              placeholder="사용자 전달 메시지 또는 에러 메시지를 입력하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              분석 완료 시 사용자에게 전달할 메시지나 에러 발생 시 에러 메시지를 입력할 수 있습니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
