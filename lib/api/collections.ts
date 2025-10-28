import { supabase } from '@/lib/supabase/client'
import { Collection } from '@/types'

interface CreateCollectionParams {
  name: string
  userId: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * 새 컬렉션을 생성합니다.
 * @param params - 컬렉션 생성 파라미터 (name, userId)
 * @returns ApiResponse<Collection> - 생성된 컬렉션 또는 에러
 */
export async function createCollection(
  params: CreateCollectionParams
): Promise<ApiResponse<Collection>> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: params.name,
        user_id: params.userId,
      })
      .select()
      .single()

    if (error) {
      // 중복 이름 처리 (PostgreSQL unique constraint violation)
      if (error.code === '23505') {
        return {
          data: null,
          error: '이미 존재하는 컬렉션 이름입니다.',
          success: false,
        }
      }

      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Collection,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('컬렉션 생성 중 오류:', error)
    return {
      data: null,
      error: '컬렉션 생성 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
