import { supabase } from '@/lib/supabase/client'

export interface DashboardStats {
  totalContents: number
  pendingContents: number // is_analyzed IS NULL
  analyzingContents: number // is_analyzed = FALSE
  completedContents: number // is_analyzed = TRUE
  totalUsers: number
}

export interface DashboardStatsResponse {
  data: DashboardStats | null
  error: string | null
  success: boolean
}

/**
 * 대시보드 통계 데이터 조회 (관리자용 - userId 필터 없음)
 * - 콘텐츠 상태별 개수
 * - 전체 회원 수
 */
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  try {
    // 병렬 쿼리 실행으로 성능 최적화
    const [
      totalContentsResult,
      pendingContentsResult,
      analyzingContentsResult,
      completedContentsResult,
      totalUsersResult,
    ] = await Promise.all([
      // 총 콘텐츠 수
      supabase.from('contents').select('*', { count: 'exact', head: true }),

      // 대기중 (is_analyzed IS NULL)
      supabase.from('contents').select('*', { count: 'exact', head: true }).is('is_analyzed', null),

      // 분석중 (is_analyzed = FALSE)
      supabase.from('contents').select('*', { count: 'exact', head: true }).eq('is_analyzed', false),

      // 분석완료 (is_analyzed = TRUE)
      supabase.from('contents').select('*', { count: 'exact', head: true }).eq('is_analyzed', true),

      // 총 회원 수
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ])

    // 에러 체크
    if (totalContentsResult.error) throw totalContentsResult.error
    if (pendingContentsResult.error) throw pendingContentsResult.error
    if (analyzingContentsResult.error) throw analyzingContentsResult.error
    if (completedContentsResult.error) throw completedContentsResult.error
    if (totalUsersResult.error) throw totalUsersResult.error

    const stats: DashboardStats = {
      totalContents: totalContentsResult.count || 0,
      pendingContents: pendingContentsResult.count || 0,
      analyzingContents: analyzingContentsResult.count || 0,
      completedContents: completedContentsResult.count || 0,
      totalUsers: totalUsersResult.count || 0,
    }

    return {
      data: stats,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('대시보드 통계 조회 중 오류:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : '통계를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
