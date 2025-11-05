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
import { User } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import { Pagination } from '@/components/explorer/Pagination'

interface UserTableProps {
  users: User[]
  totalCount: number
  currentPage: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
  onBulkApprove: (userIds: string[]) => void
  onBulkBlock: (userIds: string[]) => void
}

export function UserTable({
  users,
  totalCount,
  currentPage,
  pageSize,
  loading,
  onPageChange,
  onBulkApprove,
  onBulkBlock,
}: UserTableProps) {
  const router = useRouter()
  const [rowSelection, setRowSelection] = useState({})

  const totalPages = Math.ceil(totalCount / pageSize)

  const getStatusBadge = (isApproved: boolean | null) => {
    if (isApproved === true) {
      return (
        <Badge className="pointer-events-none truncate bg-success/10 text-success">승인됨</Badge>
      )
    } else if (isApproved === null) {
      return (
        <Badge className="pointer-events-none truncate bg-yellow-100 text-yellow-700">대기중</Badge>
      )
    } else {
      return <Badge className="pointer-events-none truncate bg-error/10 text-error">거부됨</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="truncate">
          관리자
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="truncate">
        일반 회원
      </Badge>
    )
  }

  const columns: ColumnDef<User>[] = [
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
      accessorKey: 'name',
      header: () => <div className="truncate">이름</div>,
      cell: ({ row }) => <div className="truncate font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: () => <div className="truncate">이메일</div>,
      cell: ({ row }) => <div className="truncate text-gray-600">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'organization',
      header: () => <div className="truncate">소속</div>,
      cell: ({ row }) => (
        <div className="truncate text-gray-600">{row.getValue('organization') || '-'}</div>
      ),
    },
    {
      accessorKey: 'is_approved',
      header: () => <div className="truncate">상태</div>,
      cell: ({ row }) => getStatusBadge(row.getValue('is_approved')),
    },
    {
      accessorKey: 'role',
      header: () => <div className="truncate">역할</div>,
      cell: ({ row }) => getRoleBadge(row.getValue('role')),
    },
    {
      accessorKey: 'created_at',
      header: () => <div className="truncate">가입일</div>,
      cell: ({ row }) => (
        <div className="truncate text-gray-600">
          {format(new Date(row.getValue('created_at')), 'PPP', { locale: ko })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">작업</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/users/${row.original.id}`)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            상세
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: users,
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
      {/* 일괄 작업 버튼 (항상 렌더링) */}
      <div className="flex items-center justify-end gap-2">
        {selectedIds.length > 0 && (
          <span className="text-sm text-gray-500">{selectedIds.length} 선택됨</span>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={() => {
            onBulkApprove(selectedIds)
            setRowSelection({})
          }}
          className="gap-1"
        >
          <CheckCircle className="h-4 w-4" />
          일괄 승인
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={() => {
            onBulkBlock(selectedIds)
            setRowSelection({})
          }}
          className="gap-1 text-red-600 hover:text-red-700"
        >
          <XCircle className="h-4 w-4" />
          일괄 차단
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
          전체 {totalCount}명 중 {users.length}명 표시
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
