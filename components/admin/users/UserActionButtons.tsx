'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { User } from '@/lib/admin/types'
import { CheckCircle, XCircle, Shield, ShieldOff } from 'lucide-react'

interface UserActionButtonsProps {
  user: User
  currentUserId?: string
  onApprove: () => void
  onBlock: () => void
  onRoleChange: (role: 'member' | 'admin') => Promise<void>
}

export function UserActionButtons({
  user,
  currentUserId,
  onApprove,
  onBlock,
  onRoleChange,
}: UserActionButtonsProps) {
  const isSelf = user.id === currentUserId

  // 역할 변경 다이얼로그 상태
  const [toAdminDialogOpen, setToAdminDialogOpen] = useState(false)
  const [toMemberDialogOpen, setToMemberDialogOpen] = useState(false)
  const [isChangingRole, setIsChangingRole] = useState(false)

  const handleApprove = () => {
    onApprove()
  }

  const handleBlock = () => {
    if (isSelf) return
    onBlock()
  }

  const handleRoleChangeClick = () => {
    if (isSelf) return

    // 현재 역할에 따라 적절한 다이얼로그 표시
    if (user.role === 'member') {
      setToAdminDialogOpen(true) // 관리자로 변경
    } else {
      setToMemberDialogOpen(true) // 일반회원으로 변경
    }
  }

  const confirmRoleChange = async (newRole: 'admin' | 'member') => {
    // 로딩 상태, 실제 권한 변경
    setIsChangingRole(true)
    await onRoleChange(newRole)
    setIsChangingRole(false)

    // 다이얼로그 닫기
    setToAdminDialogOpen(false)
    setToMemberDialogOpen(false)
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
                  onClick={handleRoleChangeClick}
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

        {/* 관리자로 변경 확인 다이얼로그 */}
        <ConfirmDialog
          open={toAdminDialogOpen}
          title="관리자로 변경"
          description={`${user.name} (${user.email})을(를) 관리자로 권한을 변경하시겠습니까?\n해당 사용자의 재로그인 이후 적용됩니다.`}
          confirmText="변경"
          cancelText="취소"
          isDestructive={true}
          isLoading={isChangingRole}
          onConfirm={() => confirmRoleChange('admin')}
          onCancel={() => setToAdminDialogOpen(false)}
        />

        {/* 일반회원으로 변경 확인 다이얼로그 */}
        <ConfirmDialog
          open={toMemberDialogOpen}
          title="일반 회원으로 변경"
          description={`${user.name} (${user.email})을(를) 일반회원으로 권한을 변경하시겠습니까?\n해당 사용자의 재로그인 이후 적용됩니다.`}
          confirmText="변경"
          cancelText="취소"
          isDestructive={false}
          isLoading={isChangingRole}
          onConfirm={() => confirmRoleChange('member')}
          onCancel={() => setToMemberDialogOpen(false)}
        />
      </CardContent>
    </Card>
  )
}
