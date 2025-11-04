'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileImage, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getContentsWithPagination } from '@/lib/api/contents'
import { useToast } from '@/hooks/use-toast'
import { useAdminStore } from '@/lib/admin/store'
import type { Content } from '@/lib/admin/types'

export function PendingContentsCard() {
  const router = useRouter()
  const { toast } = useToast()
  const { setContentFilters } = useAdminStore()
  const [contents, setContents] = useState<Content[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const pageSize = 10

  const totalPages = Math.ceil(totalCount / pageSize)

  const loadContents = async (currentPage: number) => {
    setIsLoading(true)
    try {
      const result = await getContentsWithPagination({
        page: currentPage,
        pageSize,
        is_analyzed: null, // 대기중만
      })

      if (result.success && result.data) {
        setContents(result.data)
        setTotalCount(result.totalCount)
      } else {
        toast({
          variant: 'destructive',
          title: '콘텐츠 조회 실패',
          description: result.error || '대기중 콘텐츠를 불러올 수 없습니다.',
        })
      }
    } catch (error) {
      console.error('대기중 콘텐츠 로드 중 오류:', error)
      toast({
        variant: 'destructive',
        title: '콘텐츠 조회 실패',
        description: '대기중 콘텐츠를 불러올 수 없습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadContents(page)
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

  const handleViewAllContents = () => {
    setContentFilters({
      is_analyzed: null,
      page: 1,
      search: undefined,
    })
    router.push('/admin/contents')
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
          <FileImage className="h-5 w-5 text-blue-600" />
          최근 대기중인 콘텐츠
        </CardTitle>
        {/* {contents.length > 0 && ( */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAllContents}
          className="gap-1 text-gray-600 hover:text-gray-700"
        >
          전체보기
          <ArrowRight className="h-4 w-4" />
        </Button>
        {/* )} */}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between border-b pb-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : contents.length === 0 ? (
          <p className="text-sm text-gray-500">대기중인 콘텐츠가 없습니다.</p>
        ) : (
          <>
            <div className="space-y-3">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{content.file_name}</p>
                    <p className="text-xs text-gray-500">
                      업로더: {content.user_name || '알 수 없음'}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <Badge className="bg-gray-100 text-gray-700 pointer-events-none">
                      대기중
                    </Badge>
                    <span className="text-xs text-gray-400">{getTimeAgo(content.created_at)}</span>
                  </div>
                </div>
              ))}
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
