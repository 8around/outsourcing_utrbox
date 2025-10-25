# 010_Supabase_쿠키_구조_및_토큰_갱신_메커니즘

## 📋 개요

**작성일**: 2025-10-25
**목적**: Supabase SSR 환경에서 쿠키 기반 인증의 토큰 구조 및 자동 갱신 메커니즘 이해
**이전 문서**: 009 로그아웃 문제 해결 후 추가 분석

---

## 🔐 Supabase Session 구조

### Session 객체 구성

Supabase Session은 다음 세 가지 핵심 요소로 구성됩니다:

```typescript
interface Session {
  access_token: string    // JWT 형식의 액세스 토큰
  refresh_token: string   // 세션 갱신용 리프레시 토큰
  user: User             // 사용자 정보 객체
  expires_in?: number    // 토큰 만료까지 남은 시간(초)
  expires_at?: number    // 토큰 만료 Unix 타임스탬프
}
```

### 쿠키 저장 구조

**쿠키 이름**: `sb-{project-id}-auth-token`
- 예시: `sb-qwwsmuewhiiongjcguta-auth-token`

**저장 데이터**: 전체 Session 객체가 JSON 직렬화되어 쿠키에 저장
```json
{
  "access_token": "eyJhbGc...(JWT)",
  "refresh_token": "uuid-string",
  "user": {
    "id": "...",
    "email": "...",
    ...
  },
  "expires_at": 1234567890
}
```

**쿠키 속성**:
- `HttpOnly`: ✅ (JavaScript에서 접근 불가, XSS 공격 방지)
- `Secure`: ✅ (HTTPS에서만 전송)
- `SameSite`: `Lax` (CSRF 공격 방지)
- `Path`: `/` (모든 경로에서 접근 가능)

---

## 🔄 토큰 타입 및 역할

### 1. Access Token (액세스 토큰)

**형식**: JWT (JSON Web Token)

**목적**: API 요청 인증

**특징**:
- **짧은 수명**: 5분 ~ 1시간 (기본 1시간)
- **서명된 JWT**: 변조 방지
- **Claims 포함**:
  ```json
  {
    "sub": "user-id",           // 사용자 ID
    "email": "user@example.com",
    "session_id": "uuid",       // 세션 고유 식별자
    "role": "authenticated",
    "iat": 1234567890,          // 발급 시간
    "exp": 1234571490           // 만료 시간
  }
  ```

**역할**:
- Supabase API 호출 시 인증 헤더에 포함
- 매 요청마다 서버에서 서명 검증
- 만료 시 더 이상 유효하지 않음

### 2. Refresh Token (리프레시 토큰)

**형식**: UUID 문자열

**목적**: 새로운 Access Token 발급

**특징**:
- **긴 수명**: 며칠 ~ 몇 주 (설정 가능)
- **일회성 사용**: 한 번 사용하면 새로운 Refresh Token 발급
- **서버 DB 저장**: `auth.sessions` 테이블에 저장

**역할**:
- Access Token이 만료되면 Refresh Token으로 갱신
- 서버에 저장된 Refresh Token과 대조하여 유효성 검증
- 갱신 시 새로운 (Access Token + Refresh Token) 쌍 발급

### 토큰 순환(Rotation) 메커니즘

```
[Access Token 만료]
    ↓
사용자 요청 (Expired Access Token + Refresh Token)
    ↓
서버: Refresh Token 검증
    ↓
✅ 유효 → 새로운 (Access Token + Refresh Token) 발급
    ↓
기존 Refresh Token 무효화 (보안)
    ↓
클라이언트: 새 토큰 쿠키에 저장
```

**보안 이점**:
- Refresh Token 재사용 방지 (Replay Attack 차단)
- 토큰 탈취 시 피해 최소화
- 세션 무효화 가능 (서버에서 Refresh Token 삭제)

---

## 🔄 자동 토큰 갱신 메커니즘

### SSR 환경에서의 토큰 관리

#### 1. 미들웨어에서의 처리

**우리 코드** (`middleware.ts:30-37`):
```typescript
// 1) 세션 먼저 확인 (필요 시 토큰 갱신 트리거)
await supabase.auth.getSession()

// 2) 현재 사용자 확인
const { data: { user }, error: userError } = await supabase.auth.getUser()
```

**작동 원리**:

**getSession()**:
- 쿠키에서 Session 객체 읽기
- Access Token 만료 여부 확인
- **만료 시 Refresh Token으로 자동 갱신**
- 갱신된 Session을 쿠키에 다시 저장

**getUser()**:
- **매번 Supabase Auth 서버에 요청**
- Access Token의 유효성을 서버에서 재검증
- 사용자 정보 반환
- **서버 코드에서는 반드시 getUser() 사용 (getSession() 신뢰 불가)**

#### 2. 공식 문서의 중요한 경고

> **"Never trust getSession() in server code"**
>
> "It isn't guaranteed to revalidate the Auth token."

**이유**:
- `getSession()`은 로컬(쿠키)에 저장된 세션만 확인
- 서버에서 토큰이 무효화되었는지 알 수 없음
- `getUser()`는 매번 서버에 요청하여 실시간 검증

**올바른 패턴**:
```typescript
// ✅ 올바른 방법
await supabase.auth.getSession()  // 토큰 갱신
const { data: { user } } = await supabase.auth.getUser()  // 재검증

// ❌ 잘못된 방법
const { data: { session } } = await supabase.auth.getSession()
if (session?.user) { ... }  // 서버에서 세션이 무효화되었을 수 있음!
```

### 토큰 갱신 플로우

#### Case 1: Access Token이 유효한 경우

```
[사용자 요청]
    ↓
미들웨어: getSession()
    ↓
쿠키에서 Session 읽기
    ↓
Access Token 만료 확인 → ✅ 유효
    ↓
getUser() → 서버 검증 → ✅ 통과
    ↓
요청 처리
```

#### Case 2: Access Token이 만료된 경우

```
[사용자 요청]
    ↓
미들웨어: getSession()
    ↓
쿠키에서 Session 읽기
    ↓
Access Token 만료 확인 → ❌ 만료됨
    ↓
Refresh Token 추출
    ↓
서버에 토큰 갱신 요청 (Refresh Token 전송)
    ↓
서버: Refresh Token 검증
    ↓
✅ 유효 → 새 (Access Token + Refresh Token) 발급
    ↓
새 Session을 쿠키에 저장 (setAll 콜백)
    ↓
getUser() → 새 Access Token으로 서버 검증 → ✅ 통과
    ↓
요청 처리
```

#### Case 3: Refresh Token도 만료/무효인 경우

```
[사용자 요청]
    ↓
미들웨어: getSession()
    ↓
Refresh Token으로 갱신 시도
    ↓
서버: Refresh Token 검증 → ❌ 무효/만료
    ↓
getUser() → ❌ 실패 (401 Unauthorized)
    ↓
사용자를 /login으로 리디렉트
```

### 쿠키 업데이트 메커니즘

**createServerClient의 cookies 콜백**:

```typescript
const supabase = createServerClient<Database>(
  url,
  key,
  {
    cookies: {
      // 쿠키 읽기
      getAll() {
        return request.cookies.getAll()
      },

      // 쿠키 쓰기 (토큰 갱신 시 호출됨)
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)      // 서버 측 업데이트
          response.cookies.set(name, value, options)  // 브라우저로 전송
        })
      }
    }
  }
)
```

**작동 순서**:
1. `getSession()`이 토큰 갱신 필요 감지
2. 서버에 Refresh Token 전송
3. 서버가 새 토큰 쌍 발급
4. `setAll()` 콜백 호출
5. 새 Session을 쿠키에 저장
6. HTTP 응답 헤더에 `Set-Cookie` 포함
7. 브라우저가 쿠키 업데이트

---

## 🔍 우리 코드의 구현 검증

### 미들웨어 구현 (`middleware.ts`)

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request)

  try {
    // ✅ 1단계: 세션 확인 및 자동 갱신
    await supabase.auth.getSession()

    // ✅ 2단계: 사용자 재검증
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // ✅ 3단계: 갱신된 쿠키를 응답에 포함하여 반환
    return response
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

**검증 결과**: ✅ **올바르게 구현됨**

### API 라우트 구현

**로그인** (`app/api/auth/login/route.ts:48-57`):
```typescript
const response = NextResponse.json({})

const supabase = createServerClient<Database>(
  url, key,
  {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      }
    }
  }
)

const result = await signInUser(supabase, { email, password })

return NextResponse.json(
  { success: true, data: result.data },
  { status: 200, headers: response.headers }  // 쿠키 포함
)
```

**검증 결과**: ✅ **올바르게 구현됨**

### 로그아웃 구현

**서버** (`app/api/auth/logout/route.ts:29-30`):
```typescript
const result = await signOutUser(supabase)  // supabase.auth.signOut() 호출
// → Refresh Token을 서버 DB에서 삭제
// → 쿠키 삭제 헤더 설정 (setAll 콜백)
```

**클라이언트** (`components/layout/Header.tsx:26-50`):
```typescript
const handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    logout()  // localStorage 정리
    window.location.href = '/login'
  }
}
```

**검증 결과**: ✅ **올바르게 구현됨** (009 문서에서 수정 완료)

---

## 📊 토큰 수명 및 보안

### 기본 토큰 수명

| 토큰 타입 | 기본 수명 | 설정 가능 여부 |
|----------|----------|--------------|
| Access Token | 1시간 | ✅ Supabase Dashboard에서 설정 |
| Refresh Token | 30일 | ✅ Supabase Dashboard에서 설정 |

**설정 위치**: Supabase Dashboard → Authentication → Settings → JWT Settings

### 보안 고려사항

#### 1. XSS (Cross-Site Scripting) 방어
- **HttpOnly 쿠키**: JavaScript에서 쿠키 접근 불가
- **토큰이 localStorage에 없음**: XSS로 탈취 불가
- **CSP (Content Security Policy)**: 추가 방어 권장

#### 2. CSRF (Cross-Site Request Forgery) 방어
- **SameSite=Lax**: 외부 사이트에서 쿠키 자동 전송 차단
- **Origin 검증**: Supabase가 자동으로 처리

#### 3. Token Theft (토큰 탈취) 대응
- **Refresh Token Rotation**: 한 번 사용한 Refresh Token 무효화
- **짧은 Access Token 수명**: 탈취 시 피해 시간 제한
- **서버 측 세션 무효화**: 관리자가 강제 로그아웃 가능

#### 4. Man-in-the-Middle (MITM) 방어
- **HTTPS 강제**: Secure 쿠키는 HTTPS에서만 전송
- **Certificate Pinning**: 고도 보안 앱에서 추가 적용

---

## 🔄 세션 관리 시나리오

### 시나리오 1: 정상 사용

```
로그인 → Access Token 발급 (1시간)
    ↓
30분 사용 (Access Token 유효)
    ↓
1시간 5분 경과 (Access Token 만료)
    ↓
페이지 접근 → getSession() 자동 갱신
    ↓
새 Access Token + Refresh Token 발급
    ↓
계속 사용 가능
```

### 시나리오 2: 장기 미사용

```
로그인 후 30일 미사용
    ↓
Refresh Token 만료
    ↓
페이지 접근 시도
    ↓
getSession() → Refresh Token 무효
    ↓
getUser() → 401 Unauthorized
    ↓
자동으로 /login 리디렉트
```

### 시나리오 3: 강제 로그아웃

```
관리자가 서버에서 세션 무효화
    ↓
auth.sessions 테이블에서 Refresh Token 삭제
    ↓
사용자의 다음 요청
    ↓
getSession() → 갱신 시도 → Refresh Token 무효
    ↓
getUser() → 401 Unauthorized
    ↓
자동으로 /login 리디렉트
```

### 시나리오 4: 동시 세션 (다중 디바이스)

```
PC에서 로그인 (Session A)
    ↓
모바일에서 로그인 (Session B)
    ↓
두 세션 모두 독립적으로 유지
    ↓
PC에서 로그아웃 → Session A만 무효화
    ↓
모바일은 계속 사용 가능 (Session B 유효)
```

---

## 💡 Best Practices

### 1. 서버 코드에서의 인증 확인

```typescript
// ✅ 올바른 방법
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request)

  await supabase.auth.getSession()  // 토큰 갱신
  const { data: { user } } = await supabase.auth.getUser()  // 재검증

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response  // 갱신된 쿠키 포함
}

// ❌ 잘못된 방법
export async function middleware(request: NextRequest) {
  const { supabase } = createMiddlewareSupabase(request)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {  // 서버에서 무효화되었을 수 있음!
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

### 2. API 라우트에서의 쿠키 처리

```typescript
// ✅ 올바른 방법
export async function POST(request: NextRequest) {
  const response = NextResponse.json({})  // 초기 응답 생성

  const supabase = createServerClient<Database>(
    url, key,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // 인증 작업 수행...

  return NextResponse.json(
    { success: true, data },
    { status: 200, headers: response.headers }  // 쿠키 포함!
  )
}

// ❌ 잘못된 방법
export async function POST(request: NextRequest) {
  const supabase = createServerClient(...)  // 쿠키 콜백 없음

  // 인증 작업 수행...

  return NextResponse.json({ success: true })  // 쿠키 유실!
}
```

### 3. 로그아웃 처리

```typescript
// ✅ 올바른 방법
const handleLogout = async () => {
  try {
    // 1. 서버 세션 종료 (Refresh Token 삭제)
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    // 2. 로컬 상태 정리 (API 실패해도 실행)
    logout()
    window.location.href = '/login'
  }
}

// ❌ 잘못된 방법
const handleLogout = () => {
  logout()  // 로컬만 정리
  window.location.href = '/login'  // 쿠키는 여전히 유효!
}
```

### 4. 토큰 만료 처리

```typescript
// ✅ 올바른 방법 (자동 처리)
// getSession()이 자동으로 갱신하므로 별도 코드 불필요

// 하지만 API 호출 실패 시 처리 필요
async function apiCall() {
  try {
    const response = await fetch('/api/data')
    if (response.status === 401) {
      // 세션 만료 → 로그인 페이지로
      window.location.href = '/login'
    }
    return await response.json()
  } catch (error) {
    // 에러 처리
  }
}
```

---

## 🧪 테스트 및 검증

### 1. 토큰 갱신 테스트

**수동 테스트 방법**:
```bash
# 1. 로그인 후 쿠키 확인
# DevTools → Application → Cookies → sb-...-auth-token

# 2. Access Token 만료 시간 확인 (JWT 디코딩)
# https://jwt.io 에서 access_token 디코드
# exp claim 확인

# 3. 대기 (만료 시간까지)

# 4. 페이지 새로고침 또는 API 호출

# 5. Network 탭에서 새 쿠키 설정 확인
# Response Headers → Set-Cookie
```

### 2. 로그아웃 검증

**확인 사항**:
1. `/api/auth/logout` 호출 확인 (Network 탭)
2. 쿠키 삭제 확인 (Application → Cookies)
3. `/login` 페이지에 머무름 (자동 리디렉트 없음)
4. 재로그인 가능

### 3. 세션 무효화 테스트

**서버 측 세션 삭제**:
```sql
-- Supabase SQL Editor에서 실행
DELETE FROM auth.sessions WHERE user_id = 'user-uuid';
```

**예상 동작**:
- 사용자의 다음 요청 시 자동 로그아웃
- `/login` 페이지로 리디렉트

---

## 📚 참고 자료

### 공식 문서
- [User sessions | Supabase Docs](https://supabase.com/docs/guides/auth/sessions)
- [Server-Side Auth in Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Advanced guide | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

### 핵심 개념
- JWT (JSON Web Token)
- OAuth 2.0 Refresh Token Flow
- HttpOnly Cookies
- CSRF/XSS Protection

---

## 요약

### ✅ 확인된 사항

1. **쿠키 구조**
   - 쿠키 이름: `sb-{project-id}-auth-token`
   - 저장 데이터: 전체 Session 객체 (access_token + refresh_token + user)
   - 보안 속성: HttpOnly, Secure, SameSite=Lax

2. **토큰 갱신**
   - Access Token: 짧은 수명 (1시간), JWT 형식
   - Refresh Token: 긴 수명 (30일), UUID 형식, 일회성 사용
   - `getSession()`이 자동으로 토큰 갱신 처리

3. **우리 구현**
   - ✅ 미들웨어: `getSession()` → `getUser()` 패턴 사용
   - ✅ API 라우트: 쿠키 콜백 적절히 구현
   - ✅ 로그아웃: 서버 API 호출 + 로컬 상태 정리

4. **보안**
   - XSS 방어: HttpOnly 쿠키
   - CSRF 방어: SameSite 설정
   - Token Theft 대응: Refresh Token Rotation
   - MITM 방어: HTTPS + Secure 쿠키

### 🎯 결론

**Supabase SSR 인증 시스템은 안전하고 자동화된 토큰 관리를 제공합니다.**

- Refresh Token으로 자동 갱신
- 서버 측 세션 무효화 지원
- HttpOnly 쿠키로 XSS 방어
- 우리 코드는 Best Practice를 따르고 있음

**추가 작업 불필요** - 현재 구현이 올바르게 작동합니다! ✨

---

_이 문서는 Supabase SSR 환경에서의 쿠키 기반 인증 메커니즘을 상세히 분석한 기술 문서입니다._
