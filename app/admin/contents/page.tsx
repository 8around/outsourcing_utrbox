'use client'

import { useMemo } from 'react'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { ContentFilters } from '@/components/admin/contents/ContentFilters'
import { ContentTable } from '@/components/admin/contents/ContentTable'
import { mockContents } from '@/lib/admin/mock-data'
import { useAdminStore } from '@/lib/admin/store'
import { useToast } from '@/hooks/use-toast'

export default function AdminContentsPage() {
  useAdminTitle('콘텐츠 관리')
  const { toast } = useToast()
  const {
    contentFilters,
    setContentFilters,
    selectedContentIds,
    toggleContentSelection,
    clearSelections,
  } = useAdminStore()

  // 필터링된 콘텐츠 목록
  const filteredContents = useMemo(() => {
    let result = [...mockContents]

    // 검색 필터
    if (contentFilters.search) {
      const searchLower = contentFilters.search.toLowerCase()
      result = result.filter((content) => content.file_name.toLowerCase().includes(searchLower))
    }

    // 분석 상태 필터
    if (contentFilters.is_analyzed !== undefined) {
      result = result.filter((content) => content.is_analyzed === contentFilters.is_analyzed)
    }

    return result
  }, [contentFilters])

  const handleSelectionChange = (ids: string[]) => {
    // Zustand 스토어 업데이트
    clearSelections()
    ids.forEach((id) => toggleContentSelection(id))
  }

  const handleAnalyze = (contentIds: string[]) => {
    // Mock AI 분석 실행 - 실제로는 API 호출
    console.log('Analyze contents:', contentIds)
    toast({
      title: 'AI 분석 시작',
      description: `${contentIds.length}개 콘텐츠의 AI 분석을 시작했습니다.`,
    })
    clearSelections()
  }

  const handleDelete = (contentIds: string[]) => {
    // Mock 삭제 - 실제로는 Supabase API 호출
    console.log('Delete contents:', contentIds)
    toast({
      title: '삭제 완료',
      description: `${contentIds.length}개 콘텐츠를 삭제했습니다.`,
      variant: 'destructive',
    })
    clearSelections()
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <ContentFilters filters={contentFilters} onFilterChange={setContentFilters} />

      {/* 결과 요약 */}
      <div className="text-sm text-gray-600">
        전체 {mockContents.length}개 중 {filteredContents.length}개
      </div>

      {/* 콘텐츠 테이블 */}
      <ContentTable
        contents={filteredContents}
        selectedIds={selectedContentIds}
        onSelectionChange={handleSelectionChange}
        onAnalyze={handleAnalyze}
        onDelete={handleDelete}
      />
    </div>
  )
}
