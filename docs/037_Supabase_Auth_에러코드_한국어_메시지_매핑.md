## Supabase AuthError 코드 → 사용자 메시지 한국어 매핑 가이드

참고 문서: [Supabase Auth Error Codes](https://supabase.com/docs/guides/auth/debugging/error-codes)

### 목적

사용자에게 과도한 기술 정보를 노출하지 않으면서도 행동 지침이 분명한 한국어 메시지를 일관되게 제공하기 위한 매핑 가이드입니다. 실제 구현 시에는 `error.code`(또는 `error.name`)를 우선 사용하고, 서버/클라이언트 로그에는 원본 에러 정보를 남기세요.

### 표기 원칙

- 사용자는 즉시 이해하고 행동할 수 있어야 합니다(간결, 공손, 지시형).
- 보안 민감 정보(계정 존재 여부, 내부 정책)는 노출하지 않습니다.
- 재시도 가능성/대기 시간/다음 단계가 있으면 구체적으로 안내합니다.
- 동일 의미 코드는 하나의 사용자 메시지로 통합합니다(예: `email_exists`, `user_already_exists`).

---

## HTTP 상태코드 기본 메시지

| 상태                      | 사용자 노출 메시지                                                                     | 비고                              |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| 403 Forbidden             | 접근 권한이 없습니다. 필요한 권한을 확인해주세요.                                      | 기능 비활성/권한 부족 케이스 포함 |
| 422 Unprocessable Entity  | 요청을 처리할 수 없습니다. 입력값을 확인하고 다시 시도해주세요.                        | 유효성/상태 충돌                  |
| 429 Too Many Requests     | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.                                       | 레이트리밋, 재시도 대기 문구 포함 |
| 500 Internal Server Error | 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 문제가 지속되면 문의해주세요. | 서버/DB 트리거 문제 가능          |
| 501 Not Implemented       | 현재 지원되지 않는 기능입니다. 관리자에게 문의해주세요.                                | 서버 설정 미지원                  |

---

## 자주 발생하는 코드 매핑(권장 기본 세트)

| 코드                                                | 사용자 노출 메시지                                                                                    | 설명/권장 액션            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------- |
| invalid_credentials                                 | 이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.                                          | 일반 로그인 실패          |
| email_not_confirmed                                 | 이메일 인증이 필요합니다. 받은 편지함의 인증 메일을 확인해주세요.                                     | 인증 재발송 CTA 제공 권장 |
| email_exists, user_already_exists                   | 이미 가입된 이메일입니다. 로그인 또는 비밀번호 재설정을 이용해주세요.                                 | 회원가입 시               |
| weak_password                                       | 비밀번호 보안 기준을 충족하지 않습니다. 대·소문자, 숫자, 특수문자를 포함해 8자 이상으로 설정해주세요. | 조건 가이드 표시          |
| no_authorization, bad_jwt                           | 인증 정보가 유효하지 않습니다. 다시 로그인해주세요.                                                   | 토큰 결함/미제공          |
| session_expired, session_not_found                  | 세션이 만료되었습니다. 다시 로그인해주세요.                                                           | 세션 타임아웃             |
| refresh_token_already_used, refresh_token_not_found | 로그인이 만료되었거나 다른 곳에서 로그아웃되었습니다. 다시 로그인해주세요.                            | 리프레시 토큰 문제        |
| over_request_rate_limit, over_email_send_rate_limit | 요청이 많습니다. 잠시 후 다시 시도해주세요.                                                           | 레이트리밋 전반           |
| request_timeout                                     | 네트워크가 원활하지 않습니다. 연결 상태를 확인 후 다시 시도해주세요.                                  | 타임아웃                  |
| conflict                                            | 잠시 후 다시 시도해주세요. 문제가 지속되면 새로고침 후 진행해주세요.                                  | 동시성 충돌/중복 요청     |
| signup_disabled                                     | 현재 신규 회원가입이 제한되어 있습니다. 관리자에게 문의해주세요.                                      | 정책                      |
| user_banned                                         | 계정 이용이 제한되어 있습니다. 자세한 안내는 고객센터로 문의해주세요.                                 | 제재                      |

---

### 타입스크립트 예시

```ts
type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_exists'
  | 'user_already_exists'
  | 'weak_password'
  | 'no_authorization'
  | 'bad_jwt'
  | 'session_expired'
  | 'session_not_found'
  | 'refresh_token_already_used'
  | 'refresh_token_not_found'
  | 'over_request_rate_limit'
  | 'over_email_send_rate_limit'
  | 'request_timeout'
  | 'conflict'
  | 'signup_disabled'
  | 'user_banned'
  | 'otp_expired'
  | 'provider_disabled'
  | 'oauth_provider_not_supported'
  | 'bad_oauth_state'
  | 'bad_oauth_callback'
  | 'reauthentication_needed'
  | 'same_password'
  | 'phone_exists'
  | 'phone_not_confirmed'
  | 'phone_provider_disabled'
  | 'captcha_failed'
  | 'validation_failed'
  | 'unexpected_failure'
  | 'not_admin'
  | string // 미정의 코드는 string 처리 후 폴백

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  // 회원가입
  email_exists: '이미 가입된 이메일입니다. 로그인 또는 비밀번호 재설정을 이용해주세요.',
  user_already_exists: '이미 가입된 이메일입니다. 로그인 또는 비밀번호 재설정을 이용해주세요.',
  weak_password:
    '비밀번호 보안 기준을 충족하지 않습니다. 대·소문자, 숫자, 특수문자를 포함해 8자 이상으로 설정해주세요.',

  // 이메일 인증 만료
  otp_expired: '인증이 만료되었습니다. 새 인증을 요청해주세요.',

  // 비밀번호 변경
  same_password: '이전과 다른 비밀번호를 사용해주세요.',

  // 로그인
  invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.',
  email_not_confirmed: '이메일 인증이 필요합니다. 받은 편지함의 인증 메일을 확인해주세요.',

  no_authorization: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
  bad_jwt: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
  session_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
  session_not_found: '세션 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
  refresh_token_already_used:
    '세션이 만료되었거나 다른 곳에서 로그아웃되었습니다. 다시 로그인해주세요.',
  refresh_token_not_found: '세션 정보가 유효하지 않습니다. 다시 로그인해주세요.',

  // 기타 오류
  validation_failed: '입력값 형식이 올바르지 않습니다. 다시 확인해주세요.',
  unexpected_failure: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  over_request_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  over_email_send_rate_limit: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  request_timeout: '네트워크가 원활하지 않습니다. 연결 상태를 확인 후 다시 시도해주세요.',
  conflict: '잠시 후 다시 시도해주세요. 문제가 지속되면 새로고침 후 진행해주세요.',

  signup_disabled: '현재 신규 회원가입이 제한되어 있습니다. 관리자에게 문의해주세요.',
  user_banned: '계정 이용이 제한되어 있습니다. 자세한 안내는 고객센터로 문의해주세요.',
  provider_disabled: '현재 지원되지 않는 로그인 방법입니다. 다른 방법을 이용해주세요.',
  oauth_provider_not_supported: '현재 지원되지 않는 로그인 방법입니다. 다른 방법을 이용해주세요.',
  bad_oauth_state: '소셜 로그인 처리에 문제가 발생했습니다. 다시 시도해주세요.',
  bad_oauth_callback: '소셜 로그인 처리에 문제가 발생했습니다. 다시 시도해주세요.',
  reauthentication_needed: '보안을 위해 다시 로그인 후 진행해주세요.',
  phone_exists: '이미 사용 중인 전화번호입니다. 다른 번호로 시도해주세요.',
  phone_not_confirmed: '전화번호 인증이 필요합니다. 인증을 완료해주세요.',
  phone_provider_disabled:
    '전화번호로 회원가입/로그인이 비활성화되었습니다. 다른 방법을 이용해주세요.',
  captcha_failed: '봇 방지 검증에 실패했습니다. 새로고침 후 다시 시도해주세요.',
  not_admin: '이 작업을 수행할 권한이 없습니다.',
}

const DEFAULT_AUTH_ERROR_MESSAGE = '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.'

export function getAuthErrorMessage(code?: string): string {
  if (!code) return DEFAULT_AUTH_ERROR_MESSAGE
  return AUTH_ERROR_MESSAGES[code as AuthErrorCode] ?? DEFAULT_AUTH_ERROR_MESSAGE
}
```

---

## 변경 이력

- v1 (2025-11-05): 최초 작성. 문서 기반 기본 매핑 및 예시 코드 포함.
