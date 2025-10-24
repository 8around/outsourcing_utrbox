'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { User } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, CheckCircle, XCircle } from 'lucide-react'

interface UserTableProps {
  users: User[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onBulkApprove?: (userIds: string[]) => void
  onBulkBlock?: (userIds: string[]) => void
}

export function UserTable({
  users,
  selectedIds,
  onSelectionChange,
  onBulkApprove,
  onBulkBlock,
}: UserTableProps) {
  const router = useRouter()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users.map((u) => u.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, userId])
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== userId))
    }
  }

  const getStatusBadge = (isApproved: boolean | null) => {
    if (isApproved === true) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">승인됨</Badge>
    } else if (isApproved === null) {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기 중</Badge>
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

  return (
    <div className="space-y-4">
      {/* 일괄 작업 버튼 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.length}명 선택됨</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkApprove?.(selectedIds)}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              일괄 승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkBlock?.(selectedIds)}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
              일괄 차단
            </Button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>소속</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell className="text-gray-600">{user.organization || '-'}</TableCell>
                  <TableCell>{getStatusBadge(user.is_approved)}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-gray-600">
                    {format(new Date(user.created_at), 'PPP', { locale: ko })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
