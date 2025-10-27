'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { mockContents, mockCollections, getDetectionCount } from '@/lib/mock-data'
import { StatsCards, ContentExplorerView, ExplorerToolbar } from '@/components/explorer'
import { getAnalysisStatus } from '@/types/content'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { FullHeightContainer } from '@/components/layout'

export default function ExplorerPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setContents, setCollections } = useContentStore()
  const [isLoading, setIsLoading] = useState(true)

  const {
    currentPath,
    selectedContentIds,
    viewMode,
    sortBy,
    searchQuery,
    navigateToCollection,
    navigateToRoot,
    setSelectedContents,
    toggleViewMode,
    setSortBy,
    setSearchQuery,
  } = useExplorerStore()

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const userContents = mockContents.filter((c) => c.user_id === user?.id)
      const userCollections = mockCollections.filter((c) => c.user_id === user?.id)

      setContents(userContents)
      setCollections(userCollections)
      setIsLoading(false)
    }

    loadData()
  }, [user, setContents, setCollections])

  // Get user data
  const userContents = mockContents.filter((c) => c.user_id === user?.id)
  const userCollections = mockCollections.filter((c) => c.user_id === user?.id)
  const completedContents = userContents.filter((c) => getAnalysisStatus(c) === 'completed')
  const totalDetections = userContents.reduce((sum, c) => sum + getDetectionCount(c.id), 0)

  // displayData: 계층적 데이터 구조
  const displayData = useMemo(() => {
    if (currentPath === null) {
      // Level 1: 루트 뷰 (모든 컬렉션 + 미분류 콘텐츠)
      return {
        collections: userCollections,
        contents: userContents.filter((c) => c.collection_id === null),
      }
    }

    // Level 2: 컬렉션 뷰 (선택된 컬렉션의 콘텐츠만)
    return {
      collections: [],
      contents: userContents.filter((c) => c.collection_id === currentPath),
    }
  }, [currentPath, userCollections, userContents])

  // 현재 컬렉션 정보
  const currentCollection = currentPath
    ? userCollections.find((c) => c.id === currentPath)
    : null

  // Filter and sort contents
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

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file_name.localeCompare(b.file_name)
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'size':
          // Mock: 파일 경로 기반 해시로 정렬
          return a.file_path.length - b.file_path.length
        case 'detections':
          return getDetectionCount(b.id) - getDetectionCount(a.id)
        default:
          return 0
      }
    })

    return sorted
  }, [displayData.contents, searchQuery, sortBy])

  const handleOpenContent = (id: string) => {
    router.push(`/contents/${id}`)
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

  return (
    <FullHeightContainer>
      {/* Stats Cards */}
      <div className="mb-6">
        <StatsCards
          totalContents={userContents.length}
          completedAnalysis={completedContents.length}
          totalDetections={totalDetections}
          totalCollections={userCollections.length}
        />
      </div>

      {/* Explorer */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ExplorerToolbar
          currentPath={currentPath}
          currentCollection={currentCollection ?? null}
          onNavigateToRoot={navigateToRoot}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            if (mode !== viewMode) {
              toggleViewMode()
            }
          }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 overflow-hidden">
          <ContentExplorerView
            contents={filteredContents}
            collections={displayData.collections}
            currentPath={currentPath}
            viewMode={viewMode}
            selectedIds={selectedContentIds}
            onSelectContent={setSelectedContents}
            onOpenContent={handleOpenContent}
            onNavigateToCollection={navigateToCollection}
          />
        </div>
      </div>
    </FullHeightContainer>
  )
}
