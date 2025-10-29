import { supabase } from '@/lib/supabase/client'
import { Content } from '@/types'

interface UploadContentParams {
  file: File
  title: string
  userId: string
  collectionId: string | null // NULL 허용
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * 파일명을 안전하게 sanitize합니다 (특수문자 제거)
 */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
}

/**
 * 파일을 Supabase Storage에 업로드하고 contents 테이블에 메타데이터를 저장합니다.
 * @param params - 업로드 파라미터 (file, title, userId, collectionId)
 * @param onProgress - 업로드 진행률 콜백 (선택사항)
 * @returns ApiResponse<Content> - 생성된 콘텐츠 또는 에러
 */
export async function uploadContent(
  params: UploadContentParams,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<Content>> {
  try {
    // 1. Storage 경로 생성
    const timestamp = Date.now()
    const sanitizedFileName = sanitizeFileName(params.file.name)
    const collectionFolder = params.collectionId || 'uncategorized'
    const filePath = `${params.userId}/${collectionFolder}/${timestamp}_${sanitizedFileName}`

    // 2. Storage에 파일 업로드
    const { data: storageData, error: storageError } = await supabase.storage
      .from('contents')
      .upload(filePath, params.file, {
        cacheControl: '86400',
        upsert: false,
      })

    if (storageError) {
      console.error('Storage 업로드 실패:', storageError)
      return {
        data: null,
        error: `파일 업로드 실패: ${storageError.message}`,
        success: false,
      }
    }

    // 진행률 업데이트 (Storage 업로드 완료 시점)
    if (onProgress) {
      onProgress(33)
    }

    const { data } = await supabase.storage.from('contents').getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    if (onProgress) {
      onProgress(66)
    }

    // 3. Contents 테이블에 메타데이터 저장
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: params.userId,
        collection_id: params.collectionId, // NULL 가능
        file_name: params.file.name,
        file_path: publicUrl,
        is_analyzed: null, // 분석 대기
        message: null,
      })
      .select()
      .single()

    if (contentError) {
      console.error('DB 삽입 실패:', contentError)

      // DB 삽입 실패 시 Storage 파일 삭제 (rollback)
      await supabase.storage.from('contents').remove([filePath])

      return {
        data: null,
        error: `메타데이터 저장 실패: ${contentError.message}`,
        success: false,
      }
    }

    // 진행률 업데이트 (완료)
    if (onProgress) {
      onProgress(100)
    }

    return {
      data: contentData as Content,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('업로드 중 오류:', error)
    return {
      data: null,
      error: '업로드 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자의 모든 콘텐츠를 조회합니다.
 * @param userId - 사용자 ID
 * @param sortBy - 정렬 기준 ('name' | 'date')
 * @param sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns ApiResponse<Content[]> - 콘텐츠 목록 또는 에러
 */
export async function getContents(
  userId: string,
  sortBy: 'name' | 'date' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<Content[]>> {
  try {
    const column = sortBy === 'name' ? 'file_name' : 'created_at'
    const ascending = sortOrder === 'asc'

    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('user_id', userId)
      .order(column, { ascending })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Content[],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('콘텐츠 조회 중 오류:', error)
    return {
      data: null,
      error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 특정 컬렉션(또는 미분류)의 콘텐츠를 조회합니다.
 * @param userId - 사용자 ID
 * @param collectionId - 컬렉션 ID (null이면 미분류 콘텐츠)
 * @param sortBy - 정렬 기준 ('name' | 'date')
 * @param sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns ApiResponse<Content[]> - 콘텐츠 목록 또는 에러
 */
export async function getContentsByCollection(
  userId: string,
  collectionId: string | null,
  sortBy: 'name' | 'date' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<Content[]>> {
  try {
    const column = sortBy === 'name' ? 'file_name' : 'created_at'
    const ascending = sortOrder === 'asc'

    let query = supabase.from('contents').select('*').eq('user_id', userId)

    // collectionId가 null이면 is null 조건, 아니면 eq 조건
    if (collectionId) {
      query = query.eq('collection_id', collectionId)
    } else {
      query = query.is('collection_id', null)
    }

    const { data, error } = await query.order(column, { ascending })

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Content[],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('콘텐츠 조회 중 오류:', error)
    return {
      data: null,
      error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 특정 콘텐츠를 조회합니다.
 * @param id - 콘텐츠 ID
 * @returns ApiResponse<Content> - 콘텐츠 또는 에러
 */
export async function getContent(id: string): Promise<ApiResponse<Content>> {
  try {
    const { data, error } = await supabase.from('contents').select('*').eq('id', id).single()

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Content,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('콘텐츠 조회 중 오류:', error)
    return {
      data: null,
      error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자의 콘텐츠 개수를 조회합니다.
 * @param userId - 사용자 ID
 * @returns ApiResponse<number> - 콘텐츠 개수 또는 에러
 */
export async function getContentsCount(userId: string): Promise<ApiResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      return {
        data: null,
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
    console.error('콘텐츠 개수 조회 중 오류:', error)
    return {
      data: null,
      error: '콘텐츠 개수를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자의 분석 완료된 콘텐츠 개수를 조회합니다.
 * @param userId - 사용자 ID
 * @returns ApiResponse<number> - 분석 완료 콘텐츠 개수 또는 에러
 */
export async function getCompletedAnalysisCount(userId: string): Promise<ApiResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_analyzed', true)

    if (error) {
      return {
        data: null,
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
    console.error('분석 완료 콘텐츠 개수 조회 중 오류:', error)
    return {
      data: null,
      error: '분석 완료 콘텐츠 개수를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
