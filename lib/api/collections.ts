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

interface PaginatedApiResponse<T> {
  data: T | null
  totalCount: number
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
 * @param page - 페이지 번호 (1부터 시작, 선택사항)
 * @param pageSize - 페이지당 아이템 수 (기본값: 12)
 * @returns PaginatedApiResponse<Collection[]> - 컬렉션 목록 및 전체 개수 또는 에러
 */
export async function getCollections(
  userId: string,
  sortBy: 'name' | 'date' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc',
  page?: number,
  pageSize: number = 12
): Promise<PaginatedApiResponse<Collection[]>> {
  try {
    const column = sortBy === 'name' ? 'name' : 'created_at'
    const ascending = sortOrder === 'asc'

    let query = supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order(column, { ascending })

    // 페이지네이션 적용 (page가 제공된 경우에만)
    if (page !== undefined && page > 0) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      return {
        data: null,
        totalCount: 0,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Collection[],
      totalCount: count || 0,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('컬렉션 조회 중 오류:', error)
    return {
      data: null,
      totalCount: 0,
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

/**
 * 컬렉션을 삭제합니다.
 * 주의: 컬렉션 삭제 시 연관된 모든 콘텐츠도 함께 삭제됩니다 (CASCADE DELETE).
 * Storage에 저장된 파일들도 함께 정리됩니다.
 * @param id - 컬렉션 ID
 * @returns ApiResponse<void> - 성공 또는 에러
 */
export async function deleteCollection(id: string): Promise<ApiResponse<void>> {
  try {
    // 1. 해당 컬렉션의 모든 콘텐츠 조회 (Storage 파일 삭제를 위해)
    const { data: contents, error: fetchError } = await supabase
      .from('contents')
      .select('file_path')
      .eq('collection_id', id)

    if (fetchError) {
      console.error('컬렉션 콘텐츠 조회 실패:', fetchError)
      // 콘텐츠 조회 실패해도 컬렉션 삭제는 진행 (콘텐츠가 없을 수 있음)
    }

    // 2. Storage에서 파일 삭제
    if (contents && contents.length > 0) {
      const filePaths = contents.map((c) => {
        // file_path가 전체 URL인 경우 경로만 추출
        return c.file_path.includes('/') ? c.file_path.split('/').slice(-3).join('/') : c.file_path
      })

      const { error: storageError } = await supabase.storage.from('contents').remove(filePaths)

      if (storageError) {
        console.error('Storage 파일 삭제 실패:', storageError)
        // Storage 삭제 실패해도 DB는 삭제 진행 (파일이 이미 없을 수 있음)
      }
    }

    // 3. DB에서 컬렉션 삭제 (contents는 CASCADE로 자동 삭제)
    const { error: deleteError } = await supabase.from('collections').delete().eq('id', id)

    if (deleteError) {
      return {
        data: null,
        error: `컬렉션 삭제 실패: ${deleteError.message}`,
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('컬렉션 삭제 중 오류:', error)
    return {
      data: null,
      error: '컬렉션 삭제 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
