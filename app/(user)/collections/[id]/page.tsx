'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { getContentsByCollection } from '@/lib/api/contents'
import { ContentExplorerView, Pagination } from '@/components/explorer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { FullHeightContainer } from '@/components/layout'
import { Content } from '@/types'

export default function CollectionPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const { user } = useAuthStore()
  const [userContents, setUserContents] = useState<Content[]>([])
  const [totalContents, setTotalContents] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContents, setIsLoadingContents] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 12

  const { selectedContentIds, viewMode, sortBy, sortOrder, searchQuery, setSelectedContents } =
    useExplorerStore()

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const contentsRes = await getContentsByCollection(
          user.id,
          collectionId,
          sortBy,
          sortOrder,
          1,
          PAGE_SIZE
        )

        if (contentsRes.success && contentsRes.data) {
          setUserContents(contentsRes.data)
          setTotalContents(contentsRes.totalCount)
        } else {
          setError(contentsRes.error || '콘텐츠를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('데이터 로드 오류:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [user, collectionId, sortBy, sortOrder])

  // 페이지 변경 시 콘텐츠만 다시 로드
  useEffect(() => {
    const loadContents = async () => {
      if (!user || isLoading || currentPage === 1) return

      setIsLoadingContents(true)
      setError(null)

      try {
        const contentsRes = await getContentsByCollection(
          user.id,
          collectionId,
          sortBy,
          sortOrder,
          currentPage,
          PAGE_SIZE
        )

        if (contentsRes.success && contentsRes.data) {
          setUserContents(contentsRes.data)
          setTotalContents(contentsRes.totalCount)
        } else {
          setError(contentsRes.error || '콘텐츠를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('콘텐츠 로드 오류:', err)
        setError('콘텐츠를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoadingContents(false)
      }
    }

    loadContents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  // 새로고침 이벤트 리스너
  useEffect(() => {
    const handleRefreshEvent = async () => {
      if (!user) return

      setIsLoadingContents(true)
      try {
        const contentsRes = await getContentsByCollection(
          user.id,
          collectionId,
          sortBy,
          sortOrder,
          currentPage,
          PAGE_SIZE
        )

        if (contentsRes.success && contentsRes.data) {
          setUserContents(contentsRes.data)
          setTotalContents(contentsRes.totalCount)
        }
      } catch (err) {
        console.error('콘텐츠 로드 오류:', err)
      } finally {
        setIsLoadingContents(false)
      }
    }

    window.addEventListener('refresh-explorer-contents', handleRefreshEvent)
    return () => window.removeEventListener('refresh-explorer-contents', handleRefreshEvent)
  }, [user, collectionId, sortBy, sortOrder, currentPage])

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // displayData: 컬렉션 뷰 (콘텐츠만)
  const displayData = useMemo(() => {
    return {
      contents: userContents,
    }
  }, [userContents])

  // 클라이언트 사이드 검색 (서버 pagination 후)
  const filteredContents = useMemo(() => {
    let filtered = displayData.contents

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.file_name.toLowerCase().includes(query) ||
          (c.message && c.message.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [displayData.contents, searchQuery])

  // 페이지 총 개수 계산
  const totalPages = Math.ceil(totalContents / PAGE_SIZE)

  const handleOpenContent = (id: string) => {
    router.push(`/contents/${id}`)
  }

  if (error) {
    return (
      <FullHeightContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터 로드 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/collections')}>
          컬렉션 목록으로 돌아가기
        </Button>
      </FullHeightContainer>
    )
  }

  return (
    <FullHeightContainer>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ContentExplorerView
          contents={filteredContents}
          viewMode={viewMode}
          selectedIds={selectedContentIds}
          onSelectContent={setSelectedContents}
          onOpenContent={handleOpenContent}
          isLoading={isLoading || isLoadingContents}
        />

        {/* Pagination */}
        {totalPages > 1 && !isLoadingContents && (
          <div className="border-t p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={isLoadingContents}
            />
          </div>
        )}
      </div>
    </FullHeightContainer>
  )
}
