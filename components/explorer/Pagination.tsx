'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, disabled = false }: PaginationProps) {
  // 페이지 번호 목록 생성 (최대 7개 표시)
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      // 전체 페이지가 7개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 7개 이상이면 현재 페이지 기준으로 축약
      if (currentPage <= 3) {
        // 현재 페이지가 앞쪽
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 현재 페이지가 뒤쪽
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        // 현재 페이지가 중간
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return null // 페이지가 1개면 pagination 숨김
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1">
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 페이지 번호 */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-secondary-500">
              ...
            </span>
          )
        }

        const pageNum = page as number
        const isActive = pageNum === currentPage

        return (
          <Button
            key={pageNum}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={disabled || isActive}
            className={cn(
              'h-8 w-8 p-0',
              isActive && 'pointer-events-none'
            )}
          >
            {pageNum}
          </Button>
        )
      })}

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
