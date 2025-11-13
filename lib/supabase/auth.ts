import { SupabaseClient } from '@supabase/supabase-js'
import { Tables, Database } from '@/types/database.type'
import { formatAuthError } from '../utils/errors'
import { User, UserRole } from '@/types'
import { AuthResponse } from '@/types/api'

export type UserProfile = Tables<'users'>

/**
 * Custom Access Token Hook이 추가하는 JWT Claims 타입
 */
export interface CustomJWTClaims {
  email: string
  user_role: string
  is_approved: boolean | null
  name: string
  organization: string | null
}

/**
 * 현재 사용자의 프로필 정보 조회
 */
export async function getUserProfile(supabase: SupabaseClient<Database>): Promise<{
  success: boolean
  data: UserProfile | null
  error: string | null
}> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: authError?.message || '사용자 정보를 찾을 수 없습니다.',
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return {
        success: false,
        data: null,
        error: profileError.message,
      }
    }

    return {
      success: true,
      data: profile,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * 회원가입
 */
export async function signUpUser(
  supabase: SupabaseClient<Database>,
  data: {
    email: string
    password: string
    name: string
    organization: string
    phone: string
  }
): Promise<AuthResponse<null>> {
  try {
    // Supabase Auth에 사용자 생성 (metadata에 프로필 정보 포함)
    // handle_new_user 트리거가 자동으로 public.users에 레코드 생성
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          organization: data.organization,
          phone: data.phone,
        },
      },
    })

    if (authError) {
      return {
        success: false,
        data: null,
        error: { errorCode: authError.code, errorMessage: formatAuthError(authError) },
      }
    }

    return {
      success: true,
      data: null,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: { errorMessage: error instanceof Error ? error.message : '알 수 없는 오류' },
    }
  }
}

/**
 * 로그인 (승인 상태 검증 포함)
 */
export async function signInUser(
  supabase: SupabaseClient<Database>,
  data: {
    email: string
    password: string
  }
): Promise<AuthResponse<{ user: User } | null>> {
  try {
    // 1. Supabase Auth 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      const errorMessage = formatAuthError(authError)

      return {
        success: false,
        data: null,
        error: { errorCode: authError.code, errorMessage: errorMessage },
      }
    }

    // 2. JWT claims에서 사용자 정보 확인 (Custom Access Token Hook 사용)
    // Custom Access Token Hook이 JWT claims 최상위에 role, is_approved, name, organization을 추가함
    const { data: claimsData, error: AuthError } = await supabase.auth.getClaims()
    const claims = claimsData?.claims

    if (AuthError || !claims) {
      await supabase.auth.signOut()

      return {
        success: false,
        data: null,
        error: { errorMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      }
    }

    // JWT claims에서 사용자 정보 추출
    const userRole = claims.user_role
    const userIsApproved = claims.is_approved
    const userName = claims.name
    const userOrganization = claims.organization

    // 필수 정보 확인
    if (!userRole || !userName || !userOrganization) {
      await supabase.auth.signOut()
      return {
        success: false,
        data: null,
        error: {
          errorMessage: '사용자 정보가 올바르게 설정되지 않았습니다. 관리자에게 문의해주세요.',
        },
      }
    }

    // 3. 승인 상태 확인
    if (!userIsApproved) {
      const message =
        userIsApproved === undefined
          ? '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.'
          : '관리자 승인 거절되었습니다. 관리자에게 문의해주세요.'

      await supabase.auth.signOut()
      return {
        success: false,
        data: null,
        error: { errorMessage: message },
      }
    }

    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email as string,
          name: userName as string,
          organization: userOrganization as string,
          role: userRole as UserRole,
          isApproved: userIsApproved,
        },
      },
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: { errorMessage: error instanceof Error ? error.message : '알 수 없는 오류' },
    }
  }
}

/**
 * 로그아웃
 */
export async function signOutUser(supabase: SupabaseClient<Database>): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetUserPassword(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<AuthResponse<null>> {
  try {
    // 커스텀 이메일 템플릿 사용 - redirectTo 옵션 불필요
    // 템플릿에서 {{ .SiteURL }}/api/auth/reset-password/confirm 직접 구성
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      console.error('Reset password error:', error)

      const errorMessage = formatAuthError(error)

      return {
        success: false,
        data: null,
        error: { errorCode: error.code, errorMessage: errorMessage },
      }
    }

    return {
      success: true,
      data: null,
      error: null,
    }
  } catch {
    return {
      success: false,
      data: null,
      error: { errorMessage: '비밀번호 재설정 중 오류가 발생했습니다.' },
    }
  }
}

/**
 * 비밀번호 변경 (인증된 사용자)
 */
export async function updateUserPassword(
  supabase: SupabaseClient<Database>,
  password: string
): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      console.error('Update password error:', error)

      const errorMessage = formatAuthError(error)

      return {
        success: false,
        data: null,
        error: { errorCode: error.code, errorMessage: errorMessage },
      }
    }

    return {
      success: true,
      data: null,
      error: null,
    }
  } catch {
    return {
      success: false,
      data: null,
      error: { errorMessage: '비밀번호 변경 중 오류가 발생했습니다.' },
    }
  }
}
