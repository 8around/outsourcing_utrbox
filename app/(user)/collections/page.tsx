'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { getCollections } from '@/lib/api/collections'
import { getContentsByCollection } from '@/lib/api/contents'
import { StatsCards, ContentExplorerView, ExplorerToolbar, Pagination } from '@/components/explorer'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FullHeightContainer } from '@/components/layout'
import { Content, Collection } from '@/types'

export default function ExplorerPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [userContents, setUserContents] = useState<Content[]>([])
  const [userCollections, setUserCollections] = useState<Collection[]>([])
  const [totalContents, setTotalContents] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContents, setIsLoadingContents] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 12

  const {
    selectedContentIds,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    setSelectedContents,
    toggleViewMode,
    setSortBy,
    toggleSortOrder,
    setSearchQuery,
  } = useExplorerStore()

  // 초기 데이터 로드 (컬렉션 + 첫 페이지 콘텐츠)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const [collectionsRes, contentsRes] = await Promise.all([
          getCollections(user.id, sortBy, sortOrder),
          getContentsByCollection(user.id, null, sortBy, sortOrder, 1, PAGE_SIZE),
        ])

        if (collectionsRes.success && collectionsRes.data) {
          setUserCollections(collectionsRes.data)
        } else {
          setError(collectionsRes.error || '컬렉션을 불러올 수 없습니다.')
        }

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
  }, [user])

  // 정렬, 페이지 변경 시 콘텐츠만 다시 로드 (ContentExplorerView만 로딩)
  useEffect(() => {
    const loadContents = async () => {
      if (!user || isLoading) return

      setIsLoadingContents(true)
      setError(null)

      try {
        const contentsRes = await getContentsByCollection(
          user.id,
          null,
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
  }, [sortBy, sortOrder, currentPage])

  // 정렬 변경 시 1페이지로 리셋
  const handleSortChange = (newSortBy: 'name' | 'date') => {
    setSortBy(newSortBy)
    setCurrentPage(1)
  }

  const handleSortOrderChange = () => {
    toggleSortOrder()
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // displayData: 루트 뷰 (모든 컬렉션 + 미분류 콘텐츠)
  const displayData = useMemo(() => {
    return {
      collections: userCollections,
      contents: userContents, // 이미 미분류만 가져옴
    }
  }, [userCollections, userContents])

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

  const handleNavigateToCollection = (id: string) => {
    router.push(`/collections/${id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터 로드 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <FullHeightContainer>
      {/* Stats Cards */}
      <div className="mb-6">
        <StatsCards />
      </div>

      {/* Explorer */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ExplorerToolbar
          currentPath={null}
          currentCollection={null}
          collections={userCollections}
          onNavigateToRoot={() => router.push('/collections')}
          onRefresh={async () => {
            // 현재 페이지 데이터 다시 로드
            setIsLoadingContents(true)
            try {
              const [collectionsRes, contentsRes] = await Promise.all([
                getCollections(user.id, sortBy, sortOrder),
                getContentsByCollection(user.id, null, sortBy, sortOrder, currentPage, PAGE_SIZE),
              ])

              if (collectionsRes.success && collectionsRes.data) {
                setUserCollections(collectionsRes.data)
              }
              if (contentsRes.success && contentsRes.data) {
                setUserContents(contentsRes.data)
                setTotalContents(contentsRes.totalCount)
              }
            } catch (err) {
              console.error('데이터 로드 오류:', err)
            } finally {
              setIsLoadingContents(false)
            }
          }}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            if (mode !== viewMode) {
              toggleViewMode()
            }
          }}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 overflow-hidden">
          <ContentExplorerView
            contents={filteredContents}
            collections={displayData.collections}
            currentPath={null}
            viewMode={viewMode}
            selectedIds={selectedContentIds}
            onSelectContent={setSelectedContents}
            onOpenContent={handleOpenContent}
            onNavigateToCollection={handleNavigateToCollection}
            isLoading={isLoadingContents}
          />
        </div>

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
