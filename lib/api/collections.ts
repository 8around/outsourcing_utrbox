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

/**
 * 사용자의 모든 컬렉션을 조회합니다.
 * @param userId - 사용자 ID
 * @param sortBy - 정렬 기준 ('name' | 'date')
 * @param sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns ApiResponse<Collection[]> - 컬렉션 목록 또는 에러
 */
export async function getCollections(
  userId: string,
  sortBy: 'name' | 'date' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<Collection[]>> {
  try {
    const column = sortBy === 'name' ? 'name' : 'created_at'
    const ascending = sortOrder === 'asc'

    const { data, error } = await supabase
      .from('collections')
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
      data: data as Collection[],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('컬렉션 조회 중 오류:', error)
    return {
      data: null,
      error: '컬렉션을 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 특정 컬렉션을 조회합니다.
 * @param id - 컬렉션 ID
 * @returns ApiResponse<Collection> - 컬렉션 또는 에러
 */
export async function getCollection(id: string): Promise<ApiResponse<Collection>> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
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
    console.error('컬렉션 조회 중 오류:', error)
    return {
      data: null,
      error: '컬렉션을 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자의 컬렉션 개수를 조회합니다.
 * @param userId - 사용자 ID
 * @returns ApiResponse<number> - 컬렉션 개수 또는 에러
 */
export async function getCollectionsCount(userId: string): Promise<ApiResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('collections')
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
    console.error('컬렉션 개수 조회 중 오류:', error)
    return {
      data: null,
      error: '컬렉션 개수를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
