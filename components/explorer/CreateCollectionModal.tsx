'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common'
import { useAuthStore } from '@/lib/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { createCollection } from '@/lib/api/collections'
import { Collection } from '@/types'

interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCollectionCreated?: (collection: Collection) => void
}

export function CreateCollectionModal({
  open,
  onOpenChange,
  onCollectionCreated,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const { toast } = useToast()

  const handleCreate = async () => {
    // 입력 검증
    if (!name.trim()) {
      setError('컬렉션 이름을 입력해주세요.')
      return
    }

    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await createCollection({
        name: name.trim(),
        userId: user.id,
      })

      if (response.success && response.data) {
        // 성공 처리
        toast({
          title: '컬렉션 생성 완료',
          description: `"${response.data.name}" 컬렉션이 생성되었습니다.`,
        })

        // 콜백 호출
        if (onCollectionCreated) {
          onCollectionCreated(response.data)
        }

        // 모달 닫기 및 입력 초기화
        setName('')
        setError(null)
        onOpenChange(false)
      } else {
        // 에러 처리
        setError(response.error || '컬렉션 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('컬렉션 생성 중 오류:', err)
      setError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setName('')
      setError(null)
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 컬렉션 만들기</DialogTitle>
          <DialogDescription>
            콘텐츠를 그룹화할 컬렉션을 생성하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">컬렉션 이름</Label>
            <Input
              id="collection-name"
              placeholder="예: 프로젝트 A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" />
                생성 중...
              </>
            ) : (
              '생성'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
