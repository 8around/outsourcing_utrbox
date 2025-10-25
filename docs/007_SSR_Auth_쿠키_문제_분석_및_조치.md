# 007 — SSR 쿠키 기반 인증 문제 분석 및 조치 가이드

## 1) 상황 요약

- 로그인 후 브라우저에는 `sb-<project-ref>-auth-token` 및 `base64-...` 형태의 Supabase 세션 쿠키가 생성됨을 확인함.
- 그러나 서버 재가동 또는 `/login` 재방문 이후 보호 경로 이동 시 로그인 페이지로 리다이렉트되는 문제가 발생.

## 2) 원인 진단

- 미들웨어에서 `supabase.auth.getUser()`만 호출하면, 만료 임박/만료된 토큰이 자동 갱신되지 않아 `user=null`로 판정될 수 있음.
  - 서버 클라이언트는 `autoRefreshToken=false` 설정으로 동작하며, 첫 요청에서 `getSession()` 호출로 리프레시 토큰 갱신 트리거가 필요함.
- 로그인 라우트에서 서버 내부 로그인은 성공하지만, 응답(Response)에 쿠키를 확실히 써주지 않으면 브라우저가 세션을 유지하지 못함.
  - `next/headers`의 `cookies()`는 요청 쿠키를 읽는 용도이며, 브라우저로 돌려보내려면 반드시 응답 객체의 쿠키(`response.cookies.set`)에 써야 함.
- 쿠키 메서드 불일치/Deprecated 시그니처 사용
  - 최신 `@supabase/ssr`는 `cookies: { getAll, setAll }`를 권장. `get/set/remove`는 Deprecated로 경고 및 동작 이슈 유발 가능.
  - 서버 유틸에서 동기 `cookies()` 대신 `await cookies()` 사용, `remove/delete` 혼용 등의 사소한 차이도 오버로드 매칭에 영향을 줌.

## 3) 적용해야 할 조치

### 3.1 미들웨어: 세션 복원 → 사용자 조회 순서로 변경

- 첫 요청에서 세션 갱신을 트리거한 뒤 사용자 조회로 판정합니다.
- `getAll/setAll` 기반의 미들웨어 클라이언트를 계속 사용합니다.

```ts
// middleware.ts (핵심 부분만 예시)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabase } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request)

  // 1) 세션 먼저 확인(필요 시 토큰 갱신 트리거)
  await supabase.auth.getSession()

  // 2) 사용자 정보 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ... 프로필/권한 체크 후 ...
  return response
}
```

### 3.2 로그인 라우트: 응답(Response)에 쿠키를 확실히 기록

- 요청/응답 기반으로 `createServerClient`를 만들고, `setAll`이 쓰는 대상이 되는 `response`를 최종 JSON 응답에 헤더로 복사하여 반환합니다.
- `createServerSupabase()` 같은 서버 유틸은 라우트 핸들러에서는 사용하지 않는 것을 권장합니다(응답에 쿠키를 못 쓸 수 있음).

```ts
// app/api/auth/login/route.ts (예시 구현)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.type'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // setAll이 쿠키를 쓸 대상
  const response = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !authData?.user) {
    return NextResponse.json(
      { success: false, data: null, error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401, headers: response.headers }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: { user: { id: authData.user.id, email: authData.user.email } },
      error: null,
    },
    { status: 200, headers: response.headers }
  )
}
```

### 3.3 서버 유틸: 라우트/미들웨어에서 사용 지양 또는 getAll/setAll 통일

- 라우트/미들웨어에서는 반드시 요청/응답 기반으로 `createServerClient`를 생성하여 쿠키를 응답에 기록해야 합니다.
- 공통 유틸이 필요하다면 `getAll/setAll` 방식으로만 구현하고, 응답 컨텍스트가 없는 곳에서는 `setAll`을 no-op 처리하세요.

### 3.4 Deprecated 시그니처 경고 제거

- `@supabase/ssr`의 최신 타입은 `cookies: { getAll, setAll }` 사용을 요구합니다.
- `get/set/remove`(또는 `delete`)를 제공하면 Deprecated 오버로드가 선택되어 경고가 발생하므로 사용하지 않습니다.
- `cookies()`는 동기 API입니다. `await cookies()`를 제거하고 함수도 `async`가 아닌 일반 함수로 선언합니다.

### 3.5 로그인 페이지 접근 정책(선택)

- 이미 로그인된 사용자가 `/login`으로 접근하면 `/dashboard`로 리다이렉트하여 UX 혼란을 줄일 수 있습니다(미들웨어에서 처리 권장).

## 4) 설정/보안 팁

- 쿠키 옵션: `SameSite=Lax`, `path=/`는 기본. 배포 환경에서는 `Secure` 적용을 권장합니다.
- 도메인/서브도메인: 애플리케이션과 API가 다른 도메인을 사용할 경우 쿠키 도메인/경로 설정 확인이 필요합니다.
- 상태 저장: `localStorage`에 `session`(access/refresh 토큰 포함)을 저장하지 않습니다. 필요한 경우 최소 사용자 정보만 저장하고, 서버 인증은 전적으로 쿠키 기반으로 확인합니다.

## 5) 점검 체크리스트

- [ ] 미들웨어에서 `await supabase.auth.getSession()` 후 `getUser()`로 사용자 판단
- [ ] 로그인 라우트에서 요청/응답 기반 `getAll/setAll`로 서버 클라이언트 생성
- [ ] 로그인 성공 시 최종 JSON 응답에 `headers: response.headers`를 복사해 쿠키를 함께 반환
- [ ] Deprecated 쿠키 메서드(`get/set/remove`) 미사용, `getAll/setAll`로 통일
- [ ] `cookies()` 동기 사용 및 불필요한 `async/await` 제거
- [ ] 인증 상태에서 `/login` 접근 시 `/dashboard`로 리다이렉트(선택)
- [ ] 브라우저 개발자도구 → Application → Cookies에서 `sb-...` 청크 쿠키 생성/갱신 확인

## 6) 테스트 시나리오

1. 로그인 직후 쿠키 생성 확인

- `sb-<project-ref>-auth-token` 및 `base64-...` 쿠키 존재 확인

2. 서버 재가동 후 보호 경로 접근

- 첫 요청에서 미들웨어가 `getSession()` → `getUser()` 순서로 통과하는지 확인

3. `/login` 접근 후 보호 경로 이동

- 로그인 유지 및 리다이렉트 없음 확인(선택 정책 적용 시 `/login`→`/dashboard`)

4. 토큰 만료/갱신

- 만료 직전/이후 페이지 전환 시 자동 갱신 반영 여부 확인

5. 로그아웃

- 쿠키 제거 및 보호 경로 접근 시 로그인 페이지로 리다이렉트 확인

---

이 문서는 SSR 쿠키 기반 인증에서 관찰된 문제(재가동/경로 전환 시 로그아웃처럼 보이는 현상)의 원인과 조치 방법을 정리합니다. 위 조치를 적용하면, 브라우저 쿠키에 저장된 세션이 서버 재시작 및 페이지 전환 이후에도 안정적으로 유지됩니다.
