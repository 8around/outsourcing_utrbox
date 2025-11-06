# 비밀번호 재설정 AuthResponse 패턴 구현

## 📋 목차
1. [개요](#1-개요)
2. [AuthResponse 타입 구조](#2-authresponse-타입-구조)
3. [구현 내용](#3-구현-내용)
4. [API 명세](#4-api-명세)
5. [에러 처리](#5-에러-처리)
6. [테스트 시나리오](#6-테스트-시나리오)
7. [참고 사항](#7-참고-사항)

---

## 1. 개요

### 1.1 목적
비밀번호 재설정 기능을 다른 auth API 라우터들과 동일한 패턴으로 통일하여 일관성 있는 에러 처리와 사용자 피드백을 제공합니다.

### 1.2 주요 변경사항
- **AuthResponse 타입 적용**: 모든 auth API에서 동일한 응답 형식 사용
- **에러 메시지 통일**: `formatAuthError()` 함수로 한국어 메시지 생성
- **프론트엔드 패턴 통일**: `result.error?.errorMessage` 패턴 사용
- **Rate Limit 처리**: 429 상태 코드 처리 추가
- **redirectTo 옵션 제거**: 커스텀 이메일 템플릿 사용으로 불필요

### 1.3 참고 문서
- `/docs/035_이메일_인증_커스터마이징_및_사용자_피드백_개선.md` - 이메일 인증 패턴
- `/docs/037_Supabase_Auth_에러코드_한국어_메시지_매핑.md` - 에러 메시지 매핑
- `SUPABASE_EMAIL_TEMPLATES.md` - 비밀번호 재설정 이메일 템플릿

---

## 2. AuthResponse 타입 구조

### 2.1 타입 정의
**파일**: `/types/api.ts`

```typescript
export interface AuthResponse<T = any> {
  success: boolean
  data: T | null
  error: { errorCode?: string; errorMessage: string } | null
}
```

### 2.2 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `boolean` | 요청 성공 여부 |
| `data` | `T \| null` | 성공 시 데이터, 실패 시 `null` |
| `error` | `object \| null` | 실패 시 에러 객체, 성공 시 `null` |
| `error.errorCode` | `string?` | Supabase 에러 코드 (선택적) |
| `error.errorMessage` | `string` | 한국어 에러 메시지 (필수) |

### 2.3 응답 예시

**성공:**
```json
{
  "success": true,
  "data": null,
  "error": null
}
```

**실패:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "errorCode": "over_email_send_rate_limit",
    "errorMessage": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
  }
}
```

---

## 3. 구현 내용

### 3.1 헬퍼 함수 수정
**파일**: `/lib/supabase/auth.ts`

#### 변경 전
```typescript
export async function resetUserPassword(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<{
  success: boolean
  error: string | null
  message?: string
}>
```

#### 변경 후
```typescript
export async function resetUserPassword(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<AuthResponse<null>>
```

#### 주요 변경사항
1. ✅ 반환 타입을 `AuthResponse<null>`로 변경
2. ✅ `formatAuthError()` 함수 사용
3. ✅ `errorCode` 포함
4. ✅ **redirectTo 옵션 제거** (커스텀 템플릿 사용)
5. ✅ `message` 필드 제거 (AuthResponse에 없음)

#### redirectTo 옵션 불필요 이유
커스텀 이메일 템플릿에서 {{ .SiteURL }}을 사용하여 직접 URL을 구성하므로 redirectTo 옵션이 필요하지 않습니다. 이메일 인증 패턴과 동일한 방식입니다.

**이메일 템플릿 URL:**
```
{{ .SiteURL }}/api/auth/reset-password/confirm?token_hash={{ .TokenHash }}&type=recovery&email={{ .Email }}
```

#### 구현 코드
```typescript
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
  } catch (error) {
    return {
      success: false,
      data: null,
      error: { errorMessage: '비밀번호 재설정 중 오류가 발생했습니다.' },
    }
  }
}
```

### 3.1b 비밀번호 변경 헬퍼 함수
**파일**: `/lib/supabase/auth.ts`

#### 구현 코드
```typescript
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
  } catch (error) {
    return {
      success: false,
      data: null,
      error: { errorMessage: '비밀번호 변경 중 오류가 발생했습니다.' },
    }
  }
}
```

#### 주요 특징
1. ✅ AuthResponse<null> 타입 반환
2. ✅ formatAuthError() 사용하여 한국어 메시지 생성
3. ✅ errorCode 포함 (same_password, weak_password 등)
4. ✅ 세션이 있는 사용자만 호출 가능

### 3.2 API 라우트 수정
**파일**: `/app/api/auth/reset-password/route.ts`

#### 주요 변경사항
1. ✅ AuthResponse 타입 import 및 명시
2. ✅ 반환 타입: `Promise<NextResponse<AuthResponse<null>>>`
3. ✅ 에러 응답 형식 통일: `{ success, data, error: { errorMessage } }`
4. ✅ Rate limit 에러 429 처리
5. ✅ 헬퍼 함수 결과를 그대로 반환

#### 구현 코드
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { resetUserPassword } from '@/lib/supabase/auth'
import { AuthResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse<null>>> {
  try {
    const body = await request.json()
    const { email } = body

    // 입력 데이터 검증
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { errorMessage: '이메일을 입력해주세요.' },
        },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { errorMessage: '올바른 이메일 형식이 아닙니다.' },
        },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // 비밀번호 재설정 처리 (헬퍼 함수 사용)
    const result = await resetUserPassword(supabase, email)

    if (!result.success) {
      // Rate limit 에러는 429 상태 코드 사용
      const statusCode =
        result.error?.errorCode === 'over_email_send_rate_limit' ||
        result.error?.errorCode === 'over_request_rate_limit'
          ? 429
          : 400

      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Reset password unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { errorMessage: '비밀번호 재설정 중 오류가 발생했습니다.' },
      },
      { status: 500 }
    )
  }
}
```

### 3.3 프론트엔드 - 이메일 요청 폼
**파일**: `/components/auth/ResetPasswordForm.tsx`

#### 주요 변경사항
1. ✅ Mock API 제거 → 실제 `/api/auth/reset-password` 호출
2. ✅ AuthResponse 에러 핸들링 패턴 적용
3. ✅ `result.error?.errorMessage` 사용
4. ✅ LoginForm/SignupForm과 동일한 패턴

#### 구현 코드
```typescript
const onSubmit = async (data: ResetPasswordFormValues) => {
  setIsLoading(true)

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: data.email }),
    })

    const result = await response.json()

    if (result.success) {
      setIsSuccess(true)
    } else {
      toast({
        variant: 'destructive',
        title: '비밀번호 재설정 실패',
        description: result.error?.errorMessage || '비밀번호 재설정에 실패했습니다.',
      })
    }
  } catch (error) {
    toast({
      variant: 'destructive',
      title: '오류',
      description: '비밀번호 재설정 중 오류가 발생했습니다.',
    })
  } finally {
    setIsLoading(false)
  }
}
```

### 3.4 프론트엔드 - 비밀번호 변경 폼
**파일**: `/components/auth/ResetPasswordChangeForm.tsx`

#### 주요 변경사항
1. ✅ `updateUserPassword()` 헬퍼 함수 사용
2. ✅ AuthResponse 에러 핸들링 패턴 적용
3. ✅ SignupForm과 동일한 비밀번호 validation
4. ✅ 세션 확인 후 비밀번호 변경

#### 구현 코드
```typescript
const onSubmit = async (data: ChangePasswordFormValues) => {
  setIsLoading(true)

  try {
    // 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      toast({
        variant: 'destructive',
        title: '인증 오류',
        description: '세션이 만료되었습니다. 다시 시도해주세요.',
      })
      router.push('/reset-password')
      return
    }

    // 비밀번호 업데이트 (헬퍼 함수 사용)
    const result = await updateUserPassword(supabase, data.password)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: result.error?.errorMessage || '비밀번호 변경에 실패했습니다.',
      })
      return
    }

    // 성공
    toast({
      title: '비밀번호 변경 완료',
      description: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    })

    // 세션 정리 후 로그인 페이지로
    await supabase.auth.signOut()
    router.push('/login')
  } catch (error) {
    toast({
      variant: 'destructive',
      title: '오류',
      description: '비밀번호 변경 중 오류가 발생했습니다.',
    })
  } finally {
    setIsLoading(false)
  }
}
```

---

## 4. API 명세

### 4.1 엔드포인트
```
POST /api/auth/reset-password
```

### 4.2 Request Body
```typescript
{
  email: string
}
```

### 4.3 Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: null,
  error: null
}
```

#### 실패 - 입력 오류 (400 Bad Request)
```typescript
{
  success: false,
  data: null,
  error: {
    errorMessage: "이메일을 입력해주세요." | "올바른 이메일 형식이 아닙니다."
  }
}
```

#### 실패 - Rate Limit (429 Too Many Requests)
```typescript
{
  success: false,
  data: null,
  error: {
    errorCode: "over_email_send_rate_limit",
    errorMessage: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
  }
}
```

#### 실패 - 서버 에러 (500 Internal Server Error)
```typescript
{
  success: false,
  data: null,
  error: {
    errorMessage: "비밀번호 재설정 중 오류가 발생했습니다."
  }
}
```

---

## 5. 에러 처리

### 5.1 에러 코드 매핑
**파일**: `/lib/utils/errors.ts`

비밀번호 재설정 관련 주요 에러 코드:

| 에러 코드 | HTTP 상태 | 한국어 메시지 |
|-----------|-----------|---------------|
| `over_email_send_rate_limit` | 429 | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. |
| `over_request_rate_limit` | 429 | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. |
| `user_not_found` | 400 | 등록되지 않은 이메일입니다. |
| (기타) | 400 | 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요. |

### 5.2 HTTP 상태 코드 규칙

| 상태 코드 | 사용 시나리오 | 예시 |
|-----------|---------------|------|
| 200 | 성공 | 이메일 전송 성공 |
| 400 | 입력 오류, 일반 에러 | 빈 이메일, 잘못된 형식, Supabase 에러 |
| 429 | Rate Limit | 1분 내 중복 요청 |
| 500 | 서버 오류 | 예외 처리되지 않은 에러 |

### 5.3 프론트엔드 에러 핸들링 패턴

```typescript
// 1. result.success 체크
if (result.success) {
  // 성공 처리
} else {
  // 2. result.error?.errorMessage 사용
  toast({
    variant: 'destructive',
    title: '비밀번호 재설정 실패',
    description: result.error?.errorMessage || '비밀번호 재설정에 실패했습니다.',
    // 3. fallback 메시지 제공
  })
}
```

---

## 6. 테스트 시나리오

### 6.1 API 테스트

#### 성공 케이스
**입력:**
```json
POST /api/auth/reset-password
{
  "email": "user@example.com"
}
```

**예상 응답:**
- 상태 코드: 200
- `success: true`
- 이메일 전송 확인

#### 실패 케이스 1: 빈 이메일
**입력:**
```json
{
  "email": ""
}
```

**예상 응답:**
- 상태 코드: 400
- `errorMessage: "이메일을 입력해주세요."`

#### 실패 케이스 2: 잘못된 형식
**입력:**
```json
{
  "email": "invalid-email"
}
```

**예상 응답:**
- 상태 코드: 400
- `errorMessage: "올바른 이메일 형식이 아닙니다."`

#### 실패 케이스 3: Rate Limit
**입력:**
```json
{
  "email": "user@example.com"
}
```
(1분 내 중복 요청)

**예상 응답:**
- 상태 코드: 429
- `errorCode: "over_email_send_rate_limit"`
- `errorMessage: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."`

### 6.2 프론트엔드 테스트

#### 성공 시나리오
1. 이메일 입력 (`user@example.com`)
2. "재설정 링크 발송" 버튼 클릭
3. ✅ 성공 화면 표시
4. ✅ "이메일이 발송되었습니다" 메시지 확인

#### 실패 시나리오 1: API 에러
1. 존재하지 않는 이메일 입력
2. "재설정 링크 발송" 버튼 클릭
3. ✅ Toast 알림 표시
4. ✅ "등록되지 않은 이메일입니다." 메시지 확인

#### 실패 시나리오 2: 네트워크 에러
1. 네트워크 차단 상태에서 요청
2. ✅ Toast 알림 표시
3. ✅ "비밀번호 재설정 중 오류가 발생했습니다." 메시지 확인

#### UI/UX 테스트
- ✅ 로딩 상태 시 버튼 비활성화
- ✅ 로딩 스피너 표시
- ✅ 성공 화면에서 "로그인으로 돌아가기" 버튼 동작
- ✅ Toast 알림 자동 사라짐 (5초)

---

## 7. 참고 사항

### 7.1 기존 auth API 패턴 비교

| API | 헬퍼 함수 반환 타입 | 에러 처리 | Rate Limit |
|-----|---------------------|-----------|------------|
| `/api/auth/signup` | `AuthResponse<null>` | `formatAuthError()` | ❌ |
| `/api/auth/login` | `AuthResponse<{ user }>` | `formatAuthError()` | ❌ |
| `/api/auth/resend-verification` | `AuthResponse<null>` | `formatAuthError()` | ✅ 429 |
| `/api/auth/reset-password` | `AuthResponse<null>` | `formatAuthError()` | ✅ 429 |

### 7.2 Supabase 이메일 전송 제한
- **Rate Limit**: 동일 이메일에 대해 1분 간격 제한
- **에러 코드**: `over_email_send_rate_limit`
- **HTTP 상태 코드**: 429 (Too Many Requests)

### 7.3 이메일 템플릿 설정 완료
✅ **비밀번호 재설정 템플릿** - `SUPABASE_EMAIL_TEMPLATES.md`에 작성 완료
- Supabase Dashboard에서 "Change Email" 또는 "Reset Password" 템플릿 선택
- HTML 템플릿 코드 붙여넣기
- URL 구조: `{{ .SiteURL }}/api/auth/reset-password/confirm?token_hash={{ .TokenHash }}&type=recovery&email={{ .Email }}`

### 7.4 전체 플로우 구현 완료 ✅
1. ✅ **토큰 검증 API**: `/api/auth/reset-password/confirm/route.ts`
   - GET 메서드로 token_hash, type, email 파라미터 수신
   - `verifyOtp({ token_hash, type: 'recovery' })` 호출
   - 성공 시: 세션 유지, `/reset-password?verified=true` 리다이렉트
   - 실패 시: `/reset-password?verified=false&message=...` 리다이렉트

2. ✅ **비밀번호 변경 폼**: `/components/auth/ResetPasswordChangeForm.tsx`
   - SignupForm과 동일한 비밀번호 validation 적용
   - 영문 대소문자, 숫자, 특수문자(@$!%*?&) 각 1개 이상, 8자 이상
   - `updateUserPassword()` 헬퍼 함수 사용 (AuthResponse 패턴)
   - 성공 시: Toast + 세션 정리 + `/login` 리다이렉트
   - 실패 시: Toast 에러 (formatAuthError()로 한국어 메시지)

3. ✅ **세션 기반 페이지 전환**: `/app/(auth)/reset-password/page.tsx`
   - useSearchParams로 verified 파라미터 확인 및 Toast 표시
   - 세션 확인: `supabase.auth.getSession()`
   - 세션 없음 → ResetPasswordForm (이메일 요청 폼)
   - 세션 있음 → ResetPasswordChangeForm (비밀번호 변경 폼)
   - Suspense로 로딩 처리

### 7.5 비밀번호 재설정 전체 플로우

```
1. 사용자: /reset-password 페이지 접속
   ↓
2. 이메일 입력 → POST /api/auth/reset-password
   ↓
3. Supabase: 비밀번호 재설정 이메일 발송
   ↓
4. 사용자: 이메일의 링크 클릭
   → GET /api/auth/reset-password/confirm?token_hash=...&type=recovery&email=...
   ↓
5. API: verifyOtp() 호출하여 토큰 검증, 세션 생성
   ↓
6. 성공: /reset-password?verified=true 리다이렉트
   ↓
7. 페이지: 세션 확인 → ResetPasswordChangeForm 표시
   ↓
8. 사용자: 새 비밀번호 입력 → updateUser({ password })
   ↓
9. 성공: Toast + 세션 정리 + /login 리다이렉트
```

---

## 8. 수정 파일 목록

### 수정된 파일
1. ✅ `/lib/supabase/auth.ts` - `resetUserPassword`, `updateUserPassword` 함수 추가
2. ✅ `/app/api/auth/reset-password/route.ts` - AuthResponse 타입 적용
3. ✅ `/components/auth/ResetPasswordForm.tsx` - 실제 API 연동
4. ✅ `/components/auth/ResetPasswordChangeForm.tsx` - `updateUserPassword()` 헬퍼 사용
5. ✅ `/app/(auth)/reset-password/page.tsx` - 세션 기반 폼 전환 로직
6. ✅ `/components/auth/index.ts` - ResetPasswordChangeForm export 추가
7. ✅ `SUPABASE_EMAIL_TEMPLATES.md` - 비밀번호 재설정 템플릿 추가

### 신규 생성
8. ✅ `/app/api/auth/reset-password/confirm/route.ts` - 토큰 검증 API
9. ✅ `/docs/038_비밀번호_재설정_AuthResponse_패턴_구현.md` - 이 문서

---

## 9. 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| v1.0 | 2025-11-06 | 초기 구현 - AuthResponse 패턴 적용 |
| v1.1 | 2025-11-06 | redirectTo 옵션 제거, 이메일 템플릿 추가 |
| v2.0 | 2025-11-06 | 전체 플로우 구현 완료 - 토큰 검증, 비밀번호 변경, 세션 기반 페이지 |
| v2.1 | 2025-11-06 | `updateUserPassword` 헬퍼 함수 추가 - AuthResponse 패턴 완전 통일 |

---

_이 문서는 UTRBOX 프로젝트의 비밀번호 재설정 기능 구현을 설명합니다. 다른 auth API와의 일관성을 위해 AuthResponse 패턴을 적용했습니다._
