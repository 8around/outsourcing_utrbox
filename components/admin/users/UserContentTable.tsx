'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Pagination } from '@/components/explorer/Pagination'
import { Content } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'

interface UserContentTableProps {
  contents: Content[]
  totalCount: number
  currentPage: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
}

export function UserContentTable({
  contents,
  totalCount,
  currentPage,
  pageSize,
  loading,
  onPageChange,
}: UserContentTableProps) {
  const router = useRouter()
  const totalPages = Math.ceil(totalCount / pageSize)

  const getStatusBadge = (isAnalyzed: boolean | null) => {
    if (isAnalyzed === true) {
      return <Badge className="truncate bg-success/10 text-success pointer-events-none">분석 완료</Badge>
    } else if (isAnalyzed === null) {
      return (
        <Badge className="truncate bg-yellow-100 text-yellow-700 pointer-events-none">대기 중</Badge>
      )
    } else {
      return <Badge className="truncate bg-blue-100 text-blue-700 pointer-events-none">분석 중</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이미지</TableHead>
              <TableHead>파일명</TableHead>
              <TableHead className="text-center">컬렉션</TableHead>
              <TableHead className="text-center">분석 상태</TableHead>
              <TableHead className="text-center">발견 건수</TableHead>
              <TableHead className="text-right">업로드일</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              {Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={6}>
                    <div className="h-10 animate-pulse rounded bg-gray-100" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              {contents.length > 0 ? (
                contents.map((content) => (
                  <TableRow
                    key={content.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/contents/${content.id}`)}
                  >
                    {/* 이미지 */}
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded border">
                        <Image
                          src={content.file_path}
                          alt={content.file_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>

                    {/* 파일명 */}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="min-w-0 max-w-[200px] truncate font-medium text-gray-600 hover:underline">
                              {content.file_name}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md">
                            <p>{content.file_name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* 컬렉션 */}
                    <TableCell className="text-center">
                      {content.collection_name ? (
                        <Badge variant="outline" className="truncate max-w-[150px]">
                          {content.collection_name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* 분석 상태 */}
                    <TableCell className="text-center">
                      {getStatusBadge(content.is_analyzed)}
                    </TableCell>

                    {/* 발견 건수 */}
                    <TableCell className="text-center">
                      {content.detected_count && content.detected_count > 0 ? (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-700 hover:bg-red-100"
                        >
                          {content.detected_count}건
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* 업로드일 */}
                    <TableCell className="text-right text-gray-600">
                      {format(new Date(content.created_at), 'PPP HH:mm', { locale: ko })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    업로드한 콘텐츠가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          전체 {totalCount}개 중 {contents.length}개 표시
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    </div>
  )
}
