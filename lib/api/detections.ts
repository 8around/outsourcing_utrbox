import { supabase } from '@/lib/supabase/client'

interface DetectedContent {
  id: string
  content_id: string
  source_url: string | null
  image_url: string
  page_title: string | null
  detection_type: 'full' | 'partial' | 'similar'
  admin_review_status: 'pending' | 'match' | 'no_match' | 'cannot_compare'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * 특정 콘텐츠의 탐지 건수를 조회합니다.
 * @param contentId - 콘텐츠 ID
 * @returns ApiResponse<number> - 탐지 건수 또는 에러
 */
export async function getDetectionCount(contentId: string): Promise<ApiResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('detected_contents')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)

    if (error) {
      return {
        data: 0,
        error: error.message,
        success: false,
      }
    }

    return {
      data: count || 0,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('탐지 건수 조회 중 오류:', error)
    return {
      data: 0,
      error: '탐지 건수를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 특정 콘텐츠의 탐지 결과를 조회합니다.
 * @param contentId - 콘텐츠 ID
 * @returns ApiResponse<DetectedContent[]> - 탐지 결과 목록 또는 에러
 */
export async function getDetections(
  contentId: string
): Promise<ApiResponse<DetectedContent[]>> {
  try {
    const { data, error } = await supabase
      .from('detected_contents')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as DetectedContent[],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('탐지 결과 조회 중 오류:', error)
    return {
      data: null,
      error: '탐지 결과를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 일치 판정받은 분석 완료 콘텐츠의 개수를 조회합니다.
 * admin_review_status='match'인 detected_contents를 가진, is_analyzed=true인 contents의 개수를 반환합니다.
 * @param userId - 사용자 ID
 * @returns ApiResponse<number> - 일치 판정받은 콘텐츠 개수 또는 에러
 */
export async function getMatchedAnalyzedContentsCount(
  userId: string
): Promise<ApiResponse<number>> {
  try {
    const { data, error } = await supabase.rpc('get_matched_analyzed_contents_count', {
      user_id_param: userId,
    })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data || 0,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('일치 판정 콘텐츠 개수 조회 중 오류:', error)
    return {
      data: null,
      error: '일치 판정 콘텐츠 개수를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
