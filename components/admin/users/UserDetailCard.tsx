'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { User as UserIcon, Mail, Building2, Calendar, Clock, Edit, Save, X } from 'lucide-react'

interface UserDetailCardProps {
  user: User
  onUpdate: (data: { name?: string; organization?: string }) => Promise<void>
}

export function UserDetailCard({ user, onUpdate }: UserDetailCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: user.name,
    organization: user.organization || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const getStatusBadge = (isApproved: boolean | null) => {
    if (isApproved === true) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">승인됨</Badge>
    } else if (isApproved === null) {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">승인 대기</Badge>
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          거부됨
        </Badge>
      )
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default">관리자</Badge>
    }
    return <Badge variant="outline">일반 회원</Badge>
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditData({
      name: user.name,
      organization: user.organization || '',
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editData.name.trim()) return

    setIsSaving(true)
    try {
      await onUpdate({
        name: editData.name.trim(),
        organization: editData.organization.trim() || undefined,
      })
      setIsEditing(false)
    } catch {
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>회원 정보</span>
          <div className="flex gap-2">
            {getStatusBadge(user.is_approved)}
            {getRoleBadge(user.role)}
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1">
                <Edit className="h-3 w-3" />
                편집
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={!editData.name.trim() || isSaving}
                  className="gap-1"
                  size="sm"
                >
                  <Save className="h-3 w-3" />
                  저장
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <X className="h-3 w-3" />
                  취소
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 이름 필드 */}
          <div className="flex items-start gap-3">
            <UserIcon className="mt-0.5 h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">이름</p>
              {isEditing ? (
                <Input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  disabled={isSaving}
                  className="mt-1"
                />
              ) : (
                <p className="text-base font-semibold text-gray-900">{user.name}</p>
              )}
            </div>
          </div>

          {/* 소속 필드 */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">소속</p>
              {isEditing ? (
                <Input
                  type="text"
                  value={editData.organization}
                  onChange={(e) => setEditData({ ...editData, organization: e.target.value })}
                  placeholder="소속을 입력하세요 (선택사항)"
                  disabled={isSaving}
                  className="mt-1"
                />
              ) : (
                <p className="text-base text-gray-900">{user.organization || '-'}</p>
              )}
            </div>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">이메일</p>
              <p className="text-base text-gray-900">{user.email}</p>
            </div>
          </div>

          {/* 가입일 (읽기 전용) */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">가입일</p>
              <p className="text-base text-gray-900">
                {format(new Date(user.created_at), 'PPP', { locale: ko })}
              </p>
            </div>
          </div>

          {/* 마지막 로그인 (읽기 전용) */}
          {user.last_login && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">마지막 로그인</p>
                <p className="text-base text-gray-900">
                  {format(new Date(user.last_login), 'PPP p', { locale: ko })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
