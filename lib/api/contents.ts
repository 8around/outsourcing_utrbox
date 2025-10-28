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
      onProgress(50)
    }

    // 3. Contents 테이블에 메타데이터 저장
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: params.userId,
        collection_id: params.collectionId, // NULL 가능
        file_name: params.file.name,
        file_path: filePath,
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
