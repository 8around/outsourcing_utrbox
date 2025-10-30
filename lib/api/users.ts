import { supabase } from '@/lib/supabase/client'
import { User } from '@/lib/admin/types'

interface GetUsersParams {
  page?: number
  pageSize?: number
  role?: 'member' | 'admin'
  is_approved?: boolean | null
  search?: string
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
 * 사용자 목록을 페이지네이션과 필터링을 적용하여 조회합니다.
 * @param params - 조회 파라미터 (page, pageSize, role, is_approved, search)
 * @returns PaginatedApiResponse<User[]> - 사용자 목록 및 전체 개수 또는 에러
 */
export async function getUsersWithPagination(
  params: GetUsersParams = {}
): Promise<PaginatedApiResponse<User[]>> {
  try {
    const { page = 1, pageSize = 10, role, is_approved, search } = params

    // 기본 쿼리 (count: 'exact'로 전체 개수도 함께 조회)
    let query = supabase.from('users').select('*', { count: 'exact' })

    // 역할 필터 적용
    if (role) {
      query = query.eq('role', role)
    }

    // is_approved 필터 적용
    if (is_approved === null) {
      // 승인 대기: is_approved IS NULL
      query = query.is('is_approved', null)
    } else if (is_approved === true) {
      // 승인됨: is_approved = true
      query = query.eq('is_approved', true)
    } else if (is_approved === false) {
      // 거부됨: is_approved = false
      query = query.eq('is_approved', false)
    }
    // is_approved가 undefined이면 조건 추가 안 함 (전체)

    // 검색 필터 적용 (이름, 이메일, 소속)
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`
      query = query.or(
        `name.ilike.${searchPattern},email.ilike.${searchPattern},organization.ilike.${searchPattern}`
      )
    }

    // 정렬: 최신순
    query = query.order('created_at', { ascending: false })

    // 페이지네이션 적용
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('사용자 조회 중 오류:', error)
      return {
        data: null,
        totalCount: 0,
        error: error.message,
        success: false,
      }
    }

    return {
      data: (data as User[]) || [],
      totalCount: count || 0,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('사용자 조회 중 오류:', error)
    return {
      data: null,
      totalCount: 0,
      error: '사용자를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 특정 사용자를 조회합니다.
 * @param id - 사용자 ID
 * @returns ApiResponse<User> - 사용자 또는 에러
 */
export async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
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
      data: data as User,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('사용자 조회 중 오류:', error)
    return {
      data: null,
      error: '사용자를 불러오는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자 승인 상태를 변경합니다.
 * @param id - 사용자 ID
 * @param isApproved - 승인 상태 (true: 승인, false: 거부, null: 대기)
 * @returns ApiResponse - 성공 또는 에러
 */
export async function updateUserApproval(
  id: string,
  isApproved: boolean | null
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('사용자 승인 상태 변경 중 오류:', error)
    return {
      data: null,
      error: '승인 상태를 변경하는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 사용자 역할을 변경합니다.
 * @param id - 사용자 ID
 * @param role - 역할 ('member' | 'admin')
 * @returns ApiResponse - 성공 또는 에러
 */
export async function updateUserRole(
  id: string,
  role: 'member' | 'admin'
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('사용자 역할 변경 중 오류:', error)
    return {
      data: null,
      error: '역할을 변경하는 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 일괄 승인 함수
 * @param userIds - 승인할 사용자 ID 배열
 * @returns ApiResponse - 성공 또는 에러
 */
export async function bulkApproveUsers(
  userIds: string[]
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .in('id', userIds)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('일괄 승인 중 오류:', error)
    return {
      data: null,
      error: '일괄 승인 중 오류가 발생했습니다.',
      success: false,
    }
  }
}

/**
 * 일괄 차단 함수
 * @param userIds - 차단할 사용자 ID 배열
 * @returns ApiResponse - 성공 또는 에러
 */
export async function bulkBlockUsers(
  userIds: string[]
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: false, updated_at: new Date().toISOString() })
      .in('id', userIds)

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error('일괄 차단 중 오류:', error)
    return {
      data: null,
      error: '일괄 차단 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
