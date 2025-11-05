import { AuthError } from '@supabase/supabase-js'

/**
 * Supabase AuthError code -> 사용자 메시지 한국어 매핑
 * 참고: docs/037_Supabase_Auth_에러코드_한국어_메시지_매핑.md
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 회원가입
  email_exists: '이미 가입된 이메일입니다. 로그인 또는 비밀번호 재설정을 이용해주세요.',
  user_already_exists: '이미 가입된 이메일입니다. 로그인 또는 비밀번호 재설정을 이용해주세요.',
  weak_password:
    '비밀번호 보안 기준을 충족하지 않습니다.\n대·소문자, 숫자, 특수문자를 포함해 8자 이상으로 설정해주세요.',

  // 이메일 인증 만료
  otp_expired: '인증이 만료되었습니다. 새 인증을 요청해주세요.',
  otp_disabled: '인증이 비활성화되어 있습니다. 관리자에게 문의해주세요.',

  // 비밀번호 변경
  same_password: '이전과 다른 비밀번호를 사용해주세요.',

  // 로그인
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.',
  email_not_confirmed: '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.',
  user_not_found: '등록되지 않은 이메일입니다.',

  // 인증/세션
  no_authorization: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
  bad_jwt: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
  session_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
  session_not_found: '세션 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
  refresh_token_already_used:
    '세션이 만료되었거나 다른 곳에서 로그아웃되었습니다. 다시 로그인해주세요.',
  refresh_token_not_found: '세션 정보가 유효하지 않습니다. 다시 로그인해주세요.',

  // Rate Limiting
  over_request_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  over_email_send_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  // 기타 오류
  validation_failed: '입력값 형식이 올바르지 않습니다. 다시 확인해주세요.',
  unexpected_failure: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  request_timeout: '네트워크가 원활하지 않습니다. 연결 상태를 확인 후 다시 시도해주세요.',
  conflict: '잠시 후 다시 시도해주세요. 문제가 지속되면 새로고침 후 진행해주세요.',

  // 정책/제한
  signup_disabled: '현재 신규 회원가입이 제한되어 있습니다. 관리자에게 문의해주세요.',
  user_banned: '계정 이용이 제한되어 있습니다. 자세한 안내는 고객센터로 문의해주세요.',

  // Provider 관련
  provider_disabled: '현재 지원되지 않는 로그인 방법입니다. 다른 방법을 이용해주세요.',
  email_provider_disabled: '이메일 로그인이 비활성화되어 있습니다. 다른 방법을 이용해주세요.',
  provider_email_needs_verification: '이메일 인증이 필요합니다.',
  oauth_provider_not_supported: '현재 지원되지 않는 로그인 방법입니다. 다른 방법을 이용해주세요.',
  bad_oauth_state: '소셜 로그인 처리에 문제가 발생했습니다. 다시 시도해주세요.',
  bad_oauth_callback: '소셜 로그인 처리에 문제가 발생했습니다. 다시 시도해주세요.',

  // 재인증
  reauthentication_needed: '보안을 위해 다시 로그인 후 진행해주세요.',

  // Phone 관련 (향후 확장 가능)
  phone_exists: '이미 사용 중인 전화번호입니다. 다른 번호로 시도해주세요.',
  phone_not_confirmed: '전화번호 인증이 필요합니다. 인증을 완료해주세요.',
  phone_provider_disabled:
    '전화번호로 회원가입/로그인이 비활성화되었습니다. 다른 방법을 이용해주세요.',

  // 기타
  captcha_failed: '봇 방지 검증에 실패했습니다. 새로고침 후 다시 시도해주세요.',
  not_admin: '이 작업을 수행할 권한이 없습니다.',
  bad_code_verifier: '인증 코드 검증 오류입니다.',
  flow_state_expired: '인증 요청이 만료되었습니다.',
  flow_state_not_found: '인증 요청을 찾을 수 없습니다.',
}

const DEFAULT_AUTH_ERROR_MESSAGE = '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.'

/**
 * Supabase Auth 에러를 사용자 친화적인 한국어 메시지로 변환
 */
export function formatAuthError(error: AuthError | Error | unknown): string {
  let errorMessage = DEFAULT_AUTH_ERROR_MESSAGE

  if (error instanceof AuthError) {
    // code 기반 처리 (메시지 기반 fallback 제거)
    if (error.code) {
      errorMessage = AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_AUTH_ERROR_MESSAGE
    }
  } else {
    // 일반 Error 객체의 경우 기본 메시지 사용
    errorMessage = DEFAULT_AUTH_ERROR_MESSAGE
  }

  return errorMessage
}
