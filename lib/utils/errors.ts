import { AuthError } from '@supabase/supabase-js'

/**
 * Supabase Auth 에러를 사용자 친화적인 한국어 메시지로 변환
 */
export function handleAuthError(error: AuthError | Error | unknown): string {
  if (error instanceof AuthError) {
    switch (error.message) {
      case 'Invalid login credentials':
        return '이메일 또는 비밀번호가 올바르지 않습니다.'
      case 'Email not confirmed':
        return '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
      case 'User already registered':
        return '이미 등록된 이메일입니다.'
      case 'Password should be at least 6 characters':
        return '비밀번호는 최소 8자 이상이어야 합니다.'
      case 'Invalid email':
        return '올바른 이메일 형식이 아닙니다.'
      case 'Signup requires a valid password':
        return '유효한 비밀번호를 입력해주세요.'
      case 'Email rate limit exceeded':
        return '이메일 전송 제한을 초과했습니다. 잠시 후 다시 시도해주세요.'
      case 'Token has expired or is invalid':
        return '토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'
      default:
        return error.message || '인증 중 오류가 발생했습니다.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * API 에러 응답 포맷터
 */
export function formatApiError(error: unknown): {
  success: false
  data: null
  error: string
} {
  return {
    success: false,
    data: null,
    error: handleAuthError(error),
  }
}
