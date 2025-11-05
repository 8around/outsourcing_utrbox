'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MessageViewModalProps {
  isOpen: boolean
  onClose: () => void
  message: string | null
}

export function MessageViewModal({ isOpen, onClose, message }: MessageViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>관리자 메시지</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {message || '메시지가 없습니다.'}
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
