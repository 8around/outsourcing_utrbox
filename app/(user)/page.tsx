'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { mockContents, mockCollections, getDetectionCount } from '@/lib/mock-data'
import { StatsCards, FolderTree, ContentExplorerView, ExplorerToolbar } from '@/components/explorer'
import { getAnalysisStatus } from '@/types/content'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'

export default function ExplorerPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setContents, setCollections } = useContentStore()
  const [isLoading, setIsLoading] = useState(true)

  const {
    selectedCollectionId,
    selectedContentIds,
    viewMode,
    sortBy,
    searchQuery,
    setSelectedCollection,
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

  // Filter and sort contents
  const filteredContents = useMemo(() => {
    let filtered = userContents

    // Filter by collection
    if (selectedCollectionId) {
      filtered = filtered.filter((c) => c.collection_id === selectedCollectionId)
    }

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
  }, [userContents, selectedCollectionId, searchQuery, sortBy])

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
    <div className="flex h-full flex-col">
      {/* Stats Cards */}
      <div className="p-6">
        <StatsCards
          totalContents={userContents.length}
          completedAnalysis={completedContents.length}
          totalDetections={totalDetections}
          totalCollections={userCollections.length}
        />
      </div>

      {/* Explorer */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: Folder Tree */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FolderTree
              collections={userCollections}
              selectedId={selectedCollectionId}
              onSelectCollection={setSelectedCollection}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Content View */}
          <ResizablePanel defaultSize={80}>
            <div className="flex h-full flex-col">
              <ExplorerToolbar
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
                  viewMode={viewMode}
                  selectedIds={selectedContentIds}
                  onSelectContent={setSelectedContents}
                  onOpenContent={handleOpenContent}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
