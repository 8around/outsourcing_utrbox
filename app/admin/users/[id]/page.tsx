'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { supabase } from '@/lib/supabase/client'
import { UserDetailCard } from '@/components/admin/users/UserDetailCard'
import { UserActionButtons } from '@/components/admin/users/UserActionButtons'
import { UserContentToolbar } from '@/components/admin/users/UserContentToolbar'
import { UserContentTable } from '@/components/admin/users/UserContentTable'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import { getUser, updateUserInfo, updateUserApproval, updateUserRole } from '@/lib/api/users'
import { getUserContentsWithPagination } from '@/lib/api/contents'
import { getCollections } from '@/lib/api/collections'
import { User } from '@/lib/admin/types'
import { Content } from '@/types'
import { Collection } from '@/types/collection'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminUserDetailPage() {
  useAdminTitle('회원 상세')
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { toast } = useToast()

  // 상태 관리
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [contents, setContents] = useState<Content[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [contentsLoading, setContentsLoading] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [contentFilters, setContentFilters] = useState({
    page: 1,
    search: '',
    sortBy: 'date' as 'name' | 'date',
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  // 현재 로그인한 사용자 정보 조회
  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  // 사용자 정보 조회
  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      try {
        const result = await getUser(userId)
        if (result.success && result.data) {
          setUser(result.data)
        } else {
          toast({
            title: '오류',
            description: '회원 정보를 불러오는데 실패했습니다.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: '오류',
          description: '회원 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // 컬렉션 목록 조회
  useEffect(() => {
    if (!user) return

    async function fetchCollections() {
      try {
        const result = await getCollections(userId)
        if (result.success && result.data) {
          setCollections(result.data)
        }
      } catch (error) {
        console.error('컬렉션 조회 중 오류:', error)
      }
    }
    fetchCollections()
  }, [userId, user])

  // 콘텐츠 조회
  useEffect(() => {
    if (!user) return

    async function fetchContents() {
      setContentsLoading(true)
      try {
        const result = await getUserContentsWithPagination(userId, {
          page: contentFilters.page,
          pageSize: 10,
          search: contentFilters.search || undefined,
          sortBy: contentFilters.sortBy,
          sortOrder: contentFilters.sortOrder,
          collection_id: selectedCollectionId,
        })

        if (result.success && result.data) {
          setContents(result.data)
          setTotalCount(result.totalCount)
        } else {
          toast({
            title: '오류',
            description: '콘텐츠 목록을 불러오는데 실패했습니다.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: '오류',
          description: '콘텐츠 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setContentsLoading(false)
      }
    }
    fetchContents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user, contentFilters, selectedCollectionId])

  // 이벤트 핸들러: 회원 정보 수정
  const handleUpdateUserInfo = async (data: { name?: string; organization?: string }) => {
    try {
      const result = await updateUserInfo(userId, data)
      if (result.success) {
        toast({
          title: '수정 완료',
          description: '회원 정보를 수정했습니다.',
        })
        // 사용자 정보 새로고침
        const userResult = await getUser(userId)
        if (userResult.success && userResult.data) {
          setUser(userResult.data)
        }
      } else {
        toast({
          title: '오류',
          description: '회원 정보 수정에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '오류',
        description: '회원 정보 수정에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 이벤트 핸들러: 승인
  const handleApprove = async () => {
    try {
      const result = await updateUserApproval(userId, true)
      if (result.success) {
        toast({
          title: '승인 완료',
          description: `${user?.name}님의 계정을 승인했습니다.`,
        })
        const userResult = await getUser(userId)
        if (userResult.success && userResult.data) {
          setUser(userResult.data)
        }
      } else {
        toast({
          title: '오류',
          description: '승인에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '오류',
        description: '승인에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 이벤트 핸들러: 거부
  const handleBlock = async () => {
    try {
      const result = await updateUserApproval(userId, false)
      if (result.success) {
        toast({
          title: '거부 완료',
          description: `${user?.name}님의 계정을 거부했습니다.`,
          variant: 'destructive',
        })
        const userResult = await getUser(userId)
        if (userResult.success && userResult.data) {
          setUser(userResult.data)
        }
      } else {
        toast({
          title: '오류',
          description: '거부에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '오류',
        description: '거부에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 이벤트 핸들러: 권한 변경
  const handleRoleChange = async (role: 'member' | 'admin') => {
    try {
      const logoutResponse = await fetch(`/api/admin/users/${userId}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_user_id: userId }),
      })

      const { success: logoutSuccess } = await logoutResponse.json()

      if (!logoutSuccess) {
        throw new Error()
      }

      const result = await updateUserRole(userId, role)
      if (result.success) {
        toast({
          title: '권한 변경 완료',
          description: `${user?.name}님을 ${role === 'admin' ? '관리자' : '일반 회원'}으로 변경했습니다.`,
        })
        const userResult = await getUser(userId)
        if (userResult.success && userResult.data) {
          setUser(userResult.data)
        }
      } else {
        toast({
          title: '오류',
          description: '권한 변경에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: '오류',
        description: '권한 변경에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 콘텐츠 필터 핸들러
  const handleSearchChange = (search: string) => {
    setContentFilters({ ...contentFilters, search, page: 1 })
  }

  const handleSortByChange = (sortBy: 'name' | 'date') => {
    setContentFilters({ ...contentFilters, sortBy, page: 1 })
  }

  const handleSortOrderToggle = () => {
    setContentFilters({
      ...contentFilters,
      sortOrder: contentFilters.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    })
  }

  const handlePageChange = (page: number) => {
    setContentFilters({ ...contentFilters, page })
  }

  const handleCollectionChange = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId)
    setContentFilters({ ...contentFilters, page: 1 })
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner className="text-gray-400" />
      </div>
    )
  }

  // 사용자 없음
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">회원을 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 버튼 */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        회원 목록으로
      </Button>

      {/* 회원 정보 및 작업 버튼 */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserDetailCard user={user} onUpdate={handleUpdateUserInfo} />
        <UserActionButtons
          user={user}
          currentUserId={currentUserId || undefined}
          onApprove={handleApprove}
          onBlock={handleBlock}
          onRoleChange={handleRoleChange}
        />
      </div>

      {/* 업로드한 콘텐츠 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">업로드한 콘텐츠 ({totalCount}개)</h2>

        <UserContentToolbar
          searchQuery={contentFilters.search}
          sortBy={contentFilters.sortBy}
          sortOrder={contentFilters.sortOrder}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSearchChange={handleSearchChange}
          onSortByChange={handleSortByChange}
          onSortOrderToggle={handleSortOrderToggle}
          onCollectionChange={handleCollectionChange}
        />

        <UserContentTable
          contents={contents}
          totalCount={totalCount}
          currentPage={contentFilters.page}
          pageSize={10}
          loading={contentsLoading}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
