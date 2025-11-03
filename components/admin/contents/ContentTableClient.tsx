'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Content } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { Pagination } from '@/components/explorer/Pagination'
import Image from 'next/image'

interface ContentTableClientProps {
  contents: Content[]
  totalCount: number
  currentPage: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
  onBulkDelete: (contentIds: string[]) => void
}

export function ContentTableClient({
  contents,
  totalCount,
  currentPage,
  pageSize,
  loading,
  onPageChange,
  onBulkDelete,
}: ContentTableClientProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState({})

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

  const columns: ColumnDef<Content>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'thumbnail',
      header: () => <div className="truncate">이미지</div>,
      cell: ({ row }) => (
        <div className="relative h-12 w-12 overflow-hidden rounded border">
          <Image
            src={row.original.file_path}
            alt={row.original.file_name}
            fill
            className="object-cover"
          />
        </div>
      ),
    },
    {
      accessorKey: 'file_name',
      header: () => <div className="truncate">파일명</div>,
      cell: ({ row }) => {
        const fileName = row.getValue('file_name') as string
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="min-w-0 max-w-[150px] cursor-pointer truncate font-medium text-gray-600 hover:underline"
                  onClick={() => router.push(`/admin/contents/${row.original.id}`)}
                >
                  {fileName}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <p>{fileName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    // {
    //   accessorKey: 'collection_name',
    //   header: () => <div className="truncate">컬렉션</div>,
    //   cell: ({ row }) => (
    //     <div className="truncate text-gray-600">{row.getValue('collection_name') || '미분류'}</div>
    //   ),
    // },
    {
      accessorKey: 'is_analyzed',
      header: () => <div className="truncate text-center">분석 상태</div>,
      cell: ({ row }) => (
        <div className="text-center">{getStatusBadge(row.getValue('is_analyzed'))}</div>
      ),
    },
    {
      accessorKey: 'detected_count',
      header: () => <div className="truncate text-center">발견 건수</div>,
      cell: ({ row }) => {
        const count = row.getValue('detected_count') as number
        return (
          <div className="text-center">
            {count > 0 ? (
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                {count}건
              </Badge>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'user_name',
      header: () => <div className="truncate text-right">업로더</div>,
      cell: ({ row }) => (
        <div className="truncate text-right text-gray-600">{row.getValue('user_name') || '-'}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => <div className="truncate text-right">업로드일</div>,
      cell: ({ row }) => (
        <div className="truncate text-right text-gray-600">
          {format(new Date(row.getValue('created_at')), 'PPP HH:mm', { locale: ko })}
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: contents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onRowSelectionChange: setRowSelection,
  })

  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)

  return (
    <div className="space-y-4">
      {/* 일괄 작업 버튼 (항상 렌더링, AI 분석 제거) */}
      <div className="flex items-center justify-end gap-2">
        {selectedIds.length > 0 && (
          <span className="text-sm text-gray-500">{selectedIds.length} 선택됨</span>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={() => {
            onBulkDelete(selectedIds)
            setRowSelection({})
          }}
          className="gap-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          일괄 삭제
        </Button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {loading ? (
            <TableBody>
              {Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={columns.length}>
                    <div className="h-10 animate-pulse rounded bg-gray-100" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                    검색 결과가 없습니다.
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
