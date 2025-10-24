'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from '@/lib/admin/types'
import { CheckCircle, XCircle, Shield, ShieldOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserActionButtonsProps {
  user: User
  onApprove: () => void
  onBlock: () => void
  onRoleChange: (role: 'member' | 'admin') => void
}

export function UserActionButtons({
  user,
  onApprove,
  onBlock,
  onRoleChange,
}: UserActionButtonsProps) {
  const { toast } = useToast()

  const handleApprove = () => {
    onApprove()
    toast({
      title: '승인 완료',
      description: `${user.name}님의 계정을 승인했습니다.`,
    })
  }

  const handleBlock = () => {
    onBlock()
    toast({
      title: '차단 완료',
      description: `${user.name}님의 계정을 차단했습니다.`,
      variant: 'destructive',
    })
  }

  const handleRoleChange = () => {
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    onRoleChange(newRole)
    toast({
      title: '권한 변경 완료',
      description: `${user.name}님을 ${newRole === 'admin' ? '관리자' : '일반 회원'}으로 변경했습니다.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>계정 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 승인/차단 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleApprove}
            disabled={user.is_approved === true}
            variant={user.is_approved === true ? 'outline' : 'default'}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {user.is_approved === true ? '승인됨' : '승인'}
          </Button>
          <Button
            onClick={handleBlock}
            disabled={user.is_approved === false}
            variant={user.is_approved === false ? 'outline' : 'destructive'}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {user.is_approved === false ? '차단됨' : '차단'}
          </Button>
        </div>

        {/* 권한 변경 버튼 */}
        <Button onClick={handleRoleChange} variant="outline" className="w-full gap-2">
          {user.role === 'admin' ? (
            <>
              <ShieldOff className="h-4 w-4" />
              일반 회원으로 변경
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              관리자로 변경
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
