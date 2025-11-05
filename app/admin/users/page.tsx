'use client'

import { useState, useEffect } from 'react'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { UserFilters } from '@/components/admin/users/UserFilters'
import { UserTable } from '@/components/admin/users/UserTable'
import { useAdminStore } from '@/lib/admin/store'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/lib/admin/types'
import { getUsersWithPagination, bulkApproveUsers, bulkBlockUsers } from '@/lib/api/users'

export default function AdminUsersPage() {
  useAdminTitle('회원 관리')
  const { toast } = useToast()
  const { userFilters, setUserFilters } = useAdminStore()
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 데이터 페칭
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const result = await getUsersWithPagination({
          page: userFilters.page,
          pageSize: 10,
          search: userFilters.search,
          is_approved: userFilters.is_approved,
          role: userFilters.role,
        })

        if (result.success && result.data) {
          setUsers(result.data)
          setTotalCount(result.totalCount)
        } else {
          toast({
            title: '오류',
            description: result.error || '사용자 목록을 불러오는데 실패했습니다.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: '오류',
          description: '사용자 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userFilters, toast])

  const handlePageChange = (page: number) => {
    setUserFilters({ page })
  }

  const handleBulkApprove = async (userIds: string[]) => {
    try {
      const result = await bulkApproveUsers(userIds)
      if (result.success) {
        toast({
          title: '승인 완료',
          description: `${userIds.length}명의 회원을 승인했습니다.`,
        })
        // 데이터 새로고침
        setUserFilters({ ...userFilters })
      } else {
        toast({
          title: '오류',
          description: result.error || '일괄 승인에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '일괄 승인에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleBulkBlock = async (userIds: string[]) => {
    try {
      const result = await bulkBlockUsers(userIds)
      if (result.success) {
        toast({
          title: '차단 완료',
          description: `${userIds.length}명의 회원을 차단했습니다.`,
          variant: 'destructive',
        })
        // 데이터 새로고침
        setUserFilters({ ...userFilters })
      } else {
        toast({
          title: '오류',
          description: result.error || '일괄 차단에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '일괄 차단에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <UserFilters filters={userFilters} onFilterChange={setUserFilters} />

      {/* 회원 테이블 */}
      <UserTable
        users={users}
        totalCount={totalCount}
        currentPage={userFilters.page}
        pageSize={10}
        loading={loading}
        onPageChange={handlePageChange}
        onBulkApprove={handleBulkApprove}
        onBulkBlock={handleBulkBlock}
      />
    </div>
  )
}
