# 006 — Server-Side Auth 쿠키 기반 마이그레이션 계획

## 1) 배경 및 현황

- 현재 로그인 플로우
  - `LoginForm` → `/api/auth/login` → `signInUser()` → Supabase Auth 로그인 성공 시 응답 본문에 `session` 포함 반환
  - 클라이언트에서 `useAuthStore.login(user, session)` 호출 → Zustand `persist`로 `localStorage`의 `auth-storage` 키에 `user`, `session`, `isAuthenticated` 저장
- 저장 매체/키
  - `localStorage`:`auth-storage` (Zustand persist)
  - Supabase 브라우저 기본 세션 키(`sb-<project-ref>-auth-token`)는 사실상 활용되지 않음(로그인을 브라우저 Supabase 클라이언트로 하지 않기 때문)
- 미들웨어 기대값 불일치
  - `middleware.ts`는 `sb-access-token`/`sb-refresh-token` 쿠키를 기대하지만, 현재 코드에서는 쿠키를 생성/관리하지 않음 → 보호 라우팅 시 불일치 가능성

문제 요약

- 서버 사이드 보호(미들웨어, SSR)와 클라이언트 상태(localStorage)가 분리되어 정합성이 깨질 수 있음
- 액세스/리프레시 토큰 포함 `session`을 `localStorage`에 저장 → 보안 리스크 증가

## 2) 목표

1. 인증 상태를 Server-Side에서 신뢰 가능하게 확인 (Middleware/SSR 호환)
2. 세션 저장 매체를 HttpOnly 쿠키로 전환하여 민감 정보의 노출 위험 축소
3. 클라이언트 상태(Zustand)에서는 최소 정보만 유지(필수 UI 상태) 또는 제거
4. 별도 rememberMe 옵션 없이 Supabase의 자동 토큰 갱신을 기본 정책으로 사용

## 3) 설계 방향 (결정)

- `@supabase/ssr`를 도입하여 Next.js 14 라우트 핸들러/서버 컴포넌트/미들웨어에서 쿠키 기반으로 Supabase 세션 관리
- 서버/브라우저 클라이언트 분리
  - 서버: `createServerClient`
  - 브라우저: `createBrowserClient`
- 라우트 핸들러(예: `/api/auth/login`)에서 로그인 성공 시 `@supabase/ssr`가 제공하는 쿠키 인터페이스로 HttpOnly 쿠키 자동 설정
- 미들웨어/SSR은 쿠키를 읽어 `supabase.auth.getUser()`로 인증 검증
- 클라이언트 전역 상태는 민감 정보(`access_token`, `refresh_token`)를 저장하지 않음

## 4) 구현 계획 (단계별)

### 4.1 패키지 설치

```bash
npm install @supabase/ssr
```

### 4.2 Supabase 클라이언트 분리

#### 브라우저 클라이언트 (자동 토큰 갱신 기본값 사용)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### 서버 클라이언트 (쿠키 기반)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 4.3 로그인 라우트 핸들러 교체 (쿠키 자동 설정)

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = createServerSupabase()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !authData.user) {
      return NextResponse.json(
        { success: false, data: null, error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: authData.user.id, email: authData.user.email },
        },
        error: null,
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ success: false, data: null, error: '로그인 오류' }, { status: 500 })
  }
}
```

설명

- `@supabase/ssr`는 `signInWithPassword` 성공 시 HttpOnly 쿠키(`sb-access-token`, `sb-refresh-token`)를 설정합니다.
- 응답 본문에는 민감한 `session` 전체를 포함하지 않고 최소 `user` 정보만 반환합니다.

### 4.4 미들웨어 정리 (쿠키 기반 단일 경로)

```typescript
// middleware.ts (핵심만 발췌)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 정적/공개 경로 패스 처리 유지

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 이후 프로필/권한 체크 로직 유지
  return NextResponse.next()
}
```

설명

- 기존의 수동 쿠키 조회(`sb-access-token`, `sb-refresh-token`)는 제거하고, `supabase.auth.getUser()` 단일 경로로 정리

### 4.5 클라이언트 상태(Zustand) 최소화

```typescript
// lib/stores/authStore.ts (예시 방향)
// - session 저장 제거
// - user UI 최소 정보만 저장하거나, 완전히 제거하고 매 화면에서 supabase.auth.getUser()로 조회
```

권장 방향

- `session`(access/refresh 토큰 포함)을 `localStorage`에 저장하지 않음
- 필요 시 `user` 최소 필드만 저장(또는 미저장) → 최초 진입 시 `/api/auth/me` 또는 `supabase.auth.getUser()`로 동기화

### 4.6 자동 토큰 갱신(rememberMe 제거)

- 별도의 rememberMe UI/로직 없이 Supabase SDK가 자동으로 세션 토큰을 갱신합니다.
- 브라우저: `createBrowserClient`는 기본적으로 세션 지속과 자동 갱신을 처리합니다(백그라운드 갱신 및 탭 전환 시 갱신).
- 서버/SSR/미들웨어: `createServerClient`는 쿠키의 `refresh_token`을 사용하여 `supabase.auth.getUser()` 호출 시 필요한 경우 쿠키를 갱신합니다.
- 결과적으로 사용자는 명시적인 “로그인 상태 유지” 옵션 없이도 일반적인 사용 중 세션이 자동으로 연장됩니다(리프레시 토큰 만료 시 재로그인 필요).

## 5) 마이그레이션 체크리스트

- [ ] `@supabase/ssr` 설치 및 환경변수 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] `lib/supabase/client.ts`를 `createBrowserClient`로 교체
- [ ] `lib/supabase/server.ts` 생성(`createServerSupabase` 유틸)
- [ ] `/api/auth/login` 라우트 핸들러를 서버 클라이언트 사용으로 수정 (민감정보 응답 제거)
- [ ] `/api/auth/logout`에서 `supabase.auth.signOut()` 호출 시 쿠키 제거 확인
- [ ] `middleware.ts`에서 수동 쿠키 조회 제거 → `supabase.auth.getUser()` 단일 경로
- [ ] `useAuthStore`에서 `session` 영구 저장 제거, 최소 `user`만(또는 미저장)
- [ ] rememberMe 관련 UI/로직 전면 제거 (체크박스/플래그/파라미터)

## 6) 테스트 시나리오

1. 로그인 성공 시
   - 응답 본문에 `session`이 포함되지 않는지 확인
   - 브라우저 `Application → Cookies`에 `sb-access-token`/`sb-refresh-token` 생성 확인(HttpOnly)
   - `localStorage`에 민감 정보가 저장되지 않는지 확인
2. 보호 라우트 접근 시
   - `middleware`가 `supabase.auth.getUser()`로 정상 통과하는지 확인
3. 자동 토큰 갱신
   - 만료 직전/이후 페이지 전환 시 세션이 갱신되는지 확인
4. 로그아웃
   - 쿠키가 제거되고 보호 라우트 접근 시 로그인 페이지로 리다이렉트 되는지 확인

## 7) 보안 고려사항

- 토큰이 포함된 세션을 `localStorage`나 JS-접근 가능한 저장소에 보관하지 않음
- HttpOnly, Secure, SameSite 설정 검토
- 관리자/일반 사용자 쿠키 분리 필요 시 쿠키 네임스페이스 분리 전략 고려

## 8) 롤백 전략

- 이행 중 문제 발생 시: 기존 `/api/auth/login` 구현과 Zustand 저장 로직을 유지한 브랜치로 빠르게 롤백
- 배포 전후에 기능 플래그로 새로운 로그인 경로를 토글할 수 있도록 구성 권장

## 9) 변경 요약

- 저장 매체: `localStorage(auth-storage)` → HttpOnly 쿠키로 전환
- 인증 확인: 수동 쿠키 파싱/로컬스토리지 의존 → `supabase.auth.getUser()`로 단일화
- 클라이언트 상태: 민감 정보 제거, 필요 시 최소 정보만 유지
