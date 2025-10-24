'use client'

import { useMemo } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { UserFilters } from '@/components/admin/users/UserFilters'
import { UserTable } from '@/components/admin/users/UserTable'
import { mockUsers } from '@/lib/admin/mock-data'
import { useAdminStore } from '@/lib/admin/store'
import { useToast } from '@/hooks/use-toast'

export default function AdminUsersPage() {
  const { toast } = useToast()
  const { userFilters, setUserFilters, selectedUserIds, toggleUserSelection, clearSelections } =
    useAdminStore()

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    let result = [...mockUsers]

    // 검색 필터
    if (userFilters.search) {
      const searchLower = userFilters.search.toLowerCase()
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.organization?.toLowerCase().includes(searchLower)
      )
    }

    // 상태 필터
    if (userFilters.status !== undefined) {
      if (userFilters.status === 'approved') {
        result = result.filter((user) => user.is_approved === true)
      } else if (userFilters.status === 'pending') {
        result = result.filter((user) => user.is_approved === null)
      } else if (userFilters.status === 'blocked') {
        result = result.filter((user) => user.is_approved === false)
      }
    }

    // 역할 필터
    if (userFilters.role) {
      result = result.filter((user) => user.role === userFilters.role)
    }

    return result
  }, [userFilters])

  const handleSelectionChange = (ids: string[]) => {
    // Zustand 스토어 업데이트
    clearSelections()
    ids.forEach((id) => toggleUserSelection(id))
  }

  const handleBulkApprove = (userIds: string[]) => {
    // Mock 일괄 승인 - 실제로는 Supabase API 호출
    console.log('Bulk approve users:', userIds)
    toast({
      title: '승인 완료',
      description: `${userIds.length}명의 회원을 승인했습니다.`,
    })
    clearSelections()
  }

  const handleBulkBlock = (userIds: string[]) => {
    // Mock 일괄 차단 - 실제로는 Supabase API 호출
    console.log('Bulk block users:', userIds)
    toast({
      title: '차단 완료',
      description: `${userIds.length}명의 회원을 차단했습니다.`,
      variant: 'destructive',
    })
    clearSelections()
  }

  return (
    <AdminLayout title="회원 관리">
      <div className="space-y-6">
        {/* 필터 */}
        <UserFilters filters={userFilters} onFilterChange={setUserFilters} />

        {/* 결과 요약 */}
        <div className="text-sm text-gray-600">
          전체 {mockUsers.length}명 중 {filteredUsers.length}명
        </div>

        {/* 회원 테이블 */}
        <UserTable
          users={filteredUsers}
          selectedIds={selectedUserIds}
          onSelectionChange={handleSelectionChange}
          onBulkApprove={handleBulkApprove}
          onBulkBlock={handleBulkBlock}
        />
      </div>
    </AdminLayout>
  )
}
