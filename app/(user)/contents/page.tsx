'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/stores/authStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { mockContents, mockCollections } from '@/lib/mock-data'
import { Content } from '@/types'
import { Grid, List, Upload, Filter, Search, Calendar, FileImage } from 'lucide-react'
import { SearchInput, Pagination } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'oldest' | 'name' | 'detections'

export default function ContentsPage() {
  const { user } = useAuthStore()
  const { setContents, setCollections } = useContentStore()
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

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

  // Filter and sort contents
  const getFilteredContents = () => {
    let filtered = mockContents.filter((c) => c.user_id === user?.id)

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
      )
    }

    // Collection filter
    if (selectedCollection !== 'all') {
      filtered = filtered.filter((c) => c.collection_id === selectedCollection)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((c) => c.analysis_status === selectedStatus)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
        case 'oldest':
          return new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'detections':
          return b.detection_count - a.detection_count
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredContents = getFilteredContents()
  const totalPages = Math.ceil(filteredContents.length / itemsPerPage)
  const paginatedContents = filteredContents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success'
      case 'analyzing':
        return 'bg-primary/10 text-primary'
      case 'pending':
        return 'bg-warning/10 text-warning'
      case 'failed':
        return 'bg-error/10 text-error'
      default:
        return 'bg-secondary-100 text-secondary-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '분석 완료'
      case 'analyzing':
        return '분석 중'
      case 'pending':
        return '대기 중'
      case 'failed':
        return '실패'
      default:
        return status
    }
  }

  const userCollections = mockCollections.filter((c) => c.user_id === user?.id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">콘텐츠</h1>
          <p className="text-secondary-500 mt-1">총 {filteredContents.length}개의 콘텐츠</p>
        </div>
        <Link href="/contents/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            업로드
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search and View Mode */}
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="콘텐츠 검색..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="컬렉션" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 컬렉션</SelectItem>
                {userCollections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">대기 중</SelectItem>
                <SelectItem value="analyzing">분석 중</SelectItem>
                <SelectItem value="completed">분석 완료</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">최신순</SelectItem>
                <SelectItem value="oldest">오래된순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
                <SelectItem value="detections">발견 건수순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Contents */}
      {paginatedContents.length === 0 ? (
        <Card className="p-12">
          <div className="text-secondary-500 text-center">
            <FileImage className="text-secondary-300 mx-auto mb-3 h-12 w-12" />
            <p>검색 결과가 없습니다</p>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedContents.map((content) => (
            <Link key={content.id} href={`/contents/${content.id}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="bg-secondary-100 relative aspect-video">
                  <img
                    src={content.file_url}
                    alt={content.title}
                    className="h-full w-full object-cover"
                  />
                  {content.detection_count > 0 && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="destructive">{content.detection_count}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate font-medium">{content.title}</h3>
                  <p className="text-secondary-500 mt-1 truncate text-sm">{content.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary" className={getStatusColor(content.analysis_status)}>
                      {getStatusText(content.analysis_status)}
                    </Badge>
                    <span className="text-secondary-400 text-xs">
                      {format(new Date(content.upload_date), 'yyyy.MM.dd', {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {paginatedContents.map((content) => (
              <Link key={content.id} href={`/contents/${content.id}`} className="block">
                <div className="hover:bg-secondary-50 p-4 transition-colors">
                  <div className="flex gap-4">
                    <img
                      src={content.file_url}
                      alt={content.title}
                      className="h-24 w-24 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{content.title}</h3>
                      <p className="text-secondary-500 mt-1 truncate text-sm">
                        {content.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(content.analysis_status)}
                        >
                          {getStatusText(content.analysis_status)}
                        </Badge>
                        {content.detection_count > 0 && (
                          <span className="text-error text-sm">
                            발견 {content.detection_count}건
                          </span>
                        )}
                        <span className="text-secondary-400 text-xs">
                          {(content.file_size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <span className="text-secondary-400 text-xs">
                          {format(new Date(content.upload_date), 'yyyy.MM.dd', {
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
