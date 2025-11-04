'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, ArrowRight, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getUsersWithPagination, updateUserApproval } from '@/lib/api/users'
import { useToast } from '@/hooks/use-toast'
import { useAdminStore } from '@/lib/admin/store'
import type { User } from '@/lib/admin/types'

export function PendingUsersCard() {
  const router = useRouter()
  const { toast } = useToast()
  const { setUserFilters } = useAdminStore()

  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set())

  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)

  const loadUsers = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const result = await getUsersWithPagination({
        page: currentPage,
        pageSize,
        is_approved: null, // 승인 대기만
        role: 'member',
      })

      if (result.success && result.data) {
        setUsers(result.data)
        setTotalCount(result.totalCount)
      } else {
        toast({
          variant: 'destructive',
          title: '가입 요청 조회 실패',
          description: result.error || '가입 요청을 불러올 수 없습니다.',
        })
      }
    } catch (error) {
      console.error('가입 요청 로드 중 오류:', error)
      toast({
        variant: 'destructive',
        title: '가입 요청 조회 실패',
        description: '가입 요청을 불러올 수 없습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(page)
  }, [page])

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      })
    } catch {
      return '알 수 없음'
    }
  }

  const handleViewAllUsers = () => {
    setUserFilters({
      is_approved: null,
      role: 'member',
      page: 1,
      search: undefined,
    })
    router.push('/admin/users')
  }

  const handleApproveUser = async (userId: string, userName: string) => {
    if (processingUsers.has(userId)) return

    setProcessingUsers((prev) => new Set(prev).add(userId))

    try {
      const result = await updateUserApproval(userId, true)

      if (result.success) {
        toast({
          title: '승인 완료',
          description: `${userName} 님의 가입을 승인했습니다.`,
        })
        // 현재 페이지 새로고침
        await loadUsers(page)
      } else {
        toast({
          variant: 'destructive',
          title: '승인 실패',
          description: result.error || '승인 처리 중 오류가 발생했습니다.',
        })
      }
    } catch (error) {
      console.error('사용자 승인 중 오류:', error)
      toast({
        variant: 'destructive',
        title: '승인 실패',
        description: '승인 처리 중 오류가 발생했습니다.',
      })
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleRejectUser = async (userId: string, userName: string) => {
    if (processingUsers.has(userId)) return

    setProcessingUsers((prev) => new Set(prev).add(userId))

    try {
      const result = await updateUserApproval(userId, false)

      if (result.success) {
        toast({
          title: '거부 완료',
          description: `${userName} 님의 가입을 거부했습니다.`,
        })
        // 현재 페이지 새로고침
        await loadUsers(page)
      } else {
        toast({
          variant: 'destructive',
          title: '거부 실패',
          description: result.error || '거부 처리 중 오류가 발생했습니다.',
        })
      }
    } catch (error) {
      console.error('사용자 거부 중 오류:', error)
      toast({
        variant: 'destructive',
        title: '거부 실패',
        description: '거부 처리 중 오류가 발생했습니다.',
      })
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-green-600" />
          최근 가입 요청
        </CardTitle>
        {/* {users.length > 0 && ( */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAllUsers}
          className="gap-1 text-gray-600 hover:text-gray-700"
        >
          전체보기
          <ArrowRight className="h-4 w-4" />
        </Button>
        {/* )} */}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between border-b pb-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">가입 요청이 없습니다.</p>
        ) : (
          <>
            <div className="space-y-4">
              {users.map((user) => {
                const isProcessing = processingUsers.has(user.id)
                return (
                  <div
                    key={user.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.organization && (
                        <p className="mt-0.5 text-xs text-gray-400">{user.organization}</p>
                      )}
                      <span className="mt-1 block text-xs text-gray-400">
                        {getTimeAgo(user.created_at)}
                      </span>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-2"
                        onClick={() => handleApproveUser(user.id, user.name)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleRejectUser(user.id, user.name)}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4" />
                        거부
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-gray-600">
                  {totalCount}건 중 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, totalCount)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm text-gray-500">/ {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
