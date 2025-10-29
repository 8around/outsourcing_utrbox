'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { getCollections } from '@/lib/api/collections'
import { getContents } from '@/lib/api/contents'
import { StatsCards, ContentExplorerView, ExplorerToolbar } from '@/components/explorer'
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const [collectionsRes, contentsRes] = await Promise.all([
          getCollections(user.id, sortBy, sortOrder),
          getContents(user.id, sortBy, sortOrder),
        ])

        if (collectionsRes.success && collectionsRes.data) {
          setUserCollections(collectionsRes.data)
        } else {
          setError(collectionsRes.error || '컬렉션을 불러올 수 없습니다.')
        }

        if (contentsRes.success && contentsRes.data) {
          setUserContents(contentsRes.data)
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

    loadData()
  }, [user, sortBy, sortOrder])

  // displayData: 루트 뷰 (모든 컬렉션 + 미분류 콘텐츠)
  const displayData = useMemo(() => {
    return {
      collections: userCollections,
      contents: userContents.filter((c) => c.collection_id === null),
    }
  }, [userCollections, userContents])

  // Filter contents (정렬은 Supabase 쿼리에서 이미 처리됨)
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
          onNavigateToRoot={() => router.push('/')}
          onRefresh={() => {
            // 데이터 다시 로드
            setIsLoading(true)
            const loadData = async () => {
              if (!user) return

              try {
                const [collectionsRes, contentsRes] = await Promise.all([
                  getCollections(user.id, sortBy, sortOrder),
                  getContents(user.id, sortBy, sortOrder),
                ])

                if (collectionsRes.success && collectionsRes.data) {
                  setUserCollections(collectionsRes.data)
                }
                if (contentsRes.success && contentsRes.data) {
                  setUserContents(contentsRes.data)
                }
              } catch (err) {
                console.error('데이터 로드 오류:', err)
              } finally {
                setIsLoading(false)
              }
            }
            loadData()
          }}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            if (mode !== viewMode) {
              toggleViewMode()
            }
          }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={toggleSortOrder}
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
          />
        </div>
      </div>
    </FullHeightContainer>
  )
}
