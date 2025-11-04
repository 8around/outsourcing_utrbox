'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { User } from '@/lib/admin/types'
import { CheckCircle, XCircle, Shield, ShieldOff } from 'lucide-react'

interface UserActionButtonsProps {
  user: User
  currentUserId?: string
  onApprove: () => void
  onBlock: () => void
  onRoleChange: (role: 'member' | 'admin') => void
}

export function UserActionButtons({
  user,
  currentUserId,
  onApprove,
  onBlock,
  onRoleChange,
}: UserActionButtonsProps) {
  const isSelf = user.id === currentUserId

  const handleApprove = () => {
    onApprove()
  }

  const handleBlock = () => {
    if (isSelf) return
    onBlock()
  }

  const handleRoleChange = () => {
    if (isSelf) return
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    onRoleChange(newRole)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>계정 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 승인/거부 버튼 */}
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={handleBlock}
                    disabled={user.is_approved === false || isSelf}
                    variant={user.is_approved === false ? 'outline' : 'destructive'}
                    className="w-full gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {user.is_approved === false ? '거부됨' : '거부'}
                  </Button>
                </span>
              </TooltipTrigger>
              {isSelf && (
                <TooltipContent>
                  <p>자신의 계정은 거부할 수 없습니다</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 권한 변경 버튼 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full">
                <Button
                  onClick={handleRoleChange}
                  disabled={isSelf}
                  variant="outline"
                  className="w-full gap-2"
                >
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
              </span>
            </TooltipTrigger>
            {isSelf && (
              <TooltipContent>
                <p>자신의 권한은 변경할 수 없습니다</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
