'use client'

import { useState, useEffect } from 'react'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { ContentFilters } from '@/components/admin/contents/ContentFilters'
import { ContentTableClient } from '@/components/admin/contents/ContentTableClient'
import { useToast } from '@/hooks/use-toast'
import { Content, ContentFilters as ContentFiltersType } from '@/lib/admin/types'
import { getContentsWithPagination, bulkDeleteContents } from '@/lib/api/contents'

export default function AdminContentsPage() {
  useAdminTitle('콘텐츠 관리')
  const { toast } = useToast()

  const [contents, setContents] = useState<Content[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ContentFiltersType>({
    page: 1,
    search: undefined,
    is_analyzed: undefined,
  })

  // 데이터 페칭
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const result = await getContentsWithPagination({
          page: filters.page,
          pageSize: 10,
          search: filters.search,
          is_analyzed: filters.is_analyzed,
        })

        if (result.success && result.data) {
          setContents(result.data)
          setTotalCount(result.totalCount)
        } else {
          toast({
            title: '오류',
            description: result.error || '콘텐츠 목록을 불러오는데 실패했습니다.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: '오류',
          description: '콘텐츠 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filters, toast])

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleBulkDelete = async (contentIds: string[]) => {
    if (!confirm(`${contentIds.length}개의 콘텐츠를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await bulkDeleteContents(contentIds)
      if (result.success) {
        toast({
          title: '삭제 완료',
          description: `${contentIds.length}개의 콘텐츠를 삭제했습니다.`,
        })
        // 데이터 새로고침
        setFilters({ ...filters })
      } else {
        toast({
          title: '오류',
          description: result.error || '일괄 삭제에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '일괄 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <ContentFilters filters={filters} onFilterChange={setFilters} />

      {/* 콘텐츠 테이블 */}
      <ContentTableClient
        contents={contents}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={10}
        loading={loading}
        onPageChange={handlePageChange}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  )
}
