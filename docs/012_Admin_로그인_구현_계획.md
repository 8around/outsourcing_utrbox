# 012_Admin 로그인 구현 계획

## 1. 배경 및 목적

### 현재 상황
- 일반 사용자 로그인: Supabase Auth + 쿠키 기반 인증 완료
- Admin 로그인: Mock 로그인 (하드코딩 방식)으로 임시 구현
- Middleware에서 `/admin` 경로는 `role='admin'` 체크만 수행

### 목적
- Admin 로그인을 Supabase Auth 기반 실제 인증으로 전환
- Middleware에서 Admin 경로에 대한 role 기반 접근 제어
- 간단하고 유지보수 용이한 구조 구현

---

## 2. 구현 전략: 단일 세션 + Role 기반 제어

### 선택한 방식
**일반 사용자와 Admin이 같은 Supabase 세션을 사용하되, DB의 `role` 컬럼으로 접근 제어**

### 장점
- ✅ 구현이 매우 간단함
- ✅ 코드 중복 없음 (일반/Admin 로그인 로직 공유 가능)
- ✅ 추가 쿠키 관리 불필요
- ✅ 유지보수 용이
- ✅ RLS 정책으로 충분히 안전함

### 보안 고려사항
**핵심: RLS(Row Level Security) 정책으로 role 변조 방지**

```sql
-- users 테이블 RLS 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 role을 변경하지 못하도록
CREATE POLICY "Users cannot update their own role"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (role = (SELECT role FROM users WHERE id = auth.uid()));
```

RLS 정책이 설정되어 있으면:
- 일반 사용자가 자신의 role을 'Admin'으로 변경 불가
- Admin 권한은 DB 관리자만 부여 가능
- 세션 하이재킹이 발생해도 role 변조 불가

---

## 3. 구현 계획

### Phase 1: Admin 로그인 API 구현

#### 파일: `/app/api/admin/auth/login/route.ts` (신규 생성)

**로직:**
```typescript
1. 요청 body에서 email, password 추출
2. Supabase Auth로 로그인 시도
3. 로그인 성공 시:
   a. users 테이블에서 role 확인
   b. role이 'Admin'이 아니면 세션 종료 후 에러 반환
   c. role이 'Admin'이면 성공 응답
4. Supabase 세션 쿠키는 자동으로 설정됨 (일반 로그인과 동일)
```

**예상 코드:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.type'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({})
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

    // Supabase Auth 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401, headers: response.headers }
      )
    }

    // role='Admin' 검증
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404, headers: response.headers }
      )
    }

    if (profile.role !== 'Admin') {
      // Admin이 아니면 세션 종료
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: '관리자 권한이 없습니다.' },
        { status: 403, headers: response.headers }
      )
    }

    // 성공 응답 (Supabase 세션 쿠키는 자동 설정됨)
    return NextResponse.json(
      {
        success: true,
        data: {
          user: authData.user,
          profile,
        },
      },
      { status: 200, headers: response.headers }
    )
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

---

### Phase 2: Middleware 개선

#### 파일: `/middleware.ts` (수정)

**변경사항:**

1. **공개 경로에 `/admin/login` 추가**
```typescript
const publicPaths = ['/login', '/signup', '/reset-password', '/admin/login']
```

2. **Admin 경로 처리는 기존 로직 유지**
```typescript
// 관리자 전용 경로 체크
if (adminPaths.some((path) => pathname.startsWith(path))) {
  if (profile.role !== 'Admin') {
    // 관리자가 아니면 대시보드로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

**변경 필요 없음!** 기존 middleware 로직이 이미 role 기반 체크를 수행하고 있습니다.

**전체 플로우:**
```
/admin/** 경로 접근 시:
├─ /admin/login? → 공개 경로, 통과
├─ Supabase 세션 없음? → /login으로 리다이렉트
├─ is_approved !== true? → /pending-approval로 리다이렉트
├─ role ≠ 'Admin'? → /dashboard로 리다이렉트
└─ 모든 조건 만족 → 통과
```

**필요한 수정:**
```typescript
// 현재 코드 (47-50번 라인)
if (userError || !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}

// 수정 후 (Admin 경로는 /admin/login으로)
if (userError || !user) {
  // Admin 경로는 Admin 로그인으로, 일반 경로는 일반 로그인으로
  const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login'
  return NextResponse.redirect(new URL(loginPath, request.url))
}
```

---

### Phase 3: Admin 로그인 페이지 수정

#### 파일: `/app/admin/login/page.tsx` (수정)

**변경사항:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setIsLoading(true)

  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error || '로그인에 실패했습니다.')
      return
    }

    // 로그인 성공
    router.push('/admin/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    setError('로그인 중 오류가 발생했습니다.')
  } finally {
    setIsLoading(false)
  }
}
```

**제거할 부분:**
- Mock 로그인 로직 (24-34번 라인)
- 개발 환경 계정 안내 (84-94번 라인) - 선택사항

---

### Phase 4 (선택사항): Admin 로그인 로그 기록

감사 추적이 필요한 경우 Admin 로그인 로그를 기록할 수 있습니다.

#### DB 마이그레이션 (선택사항)
```sql
-- Admin 로그인 로그 테이블
CREATE TABLE admin_login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_admin_login_logs_user_id ON admin_login_logs(user_id);
CREATE INDEX idx_admin_login_logs_login_at ON admin_login_logs(login_at DESC);
```

#### API에 로그 기록 추가
```typescript
// /api/admin/auth/login/route.ts에 추가
if (profile.role === 'Admin') {
  // 로그인 로그 기록
  await supabase.from('admin_login_logs').insert({
    user_id: authData.user.id,
    ip_address: request.headers.get('x-forwarded-for') || request.ip,
    user_agent: request.headers.get('user-agent'),
  })
}
```

---

## 4. 파일 구조

### 생성할 파일
```
app/
└── api/
    └── admin/            # Admin 전용 API 디렉터리 (신규)
        └── auth/
            └── login/
                └── route.ts    # Admin 로그인 API
```

### 수정할 파일
```
- middleware.ts                      # Admin 경로 리다이렉트 수정
- app/admin/login/page.tsx          # Mock → 실제 API 호출
```

### 수정 불필요 (기존 로직 재사용)
```
- lib/supabase/middleware.ts        # 그대로 사용
- lib/supabase/auth.ts              # 필요 시 재사용
```

---

## 5. 테스트 시나리오

### 시나리오 1: Admin 로그인 성공
```
1. /admin/login 페이지 접근
2. Admin 계정 정보 입력 (pulwind00@gmail.com)
3. 로그인 버튼 클릭
4. /api/admin/auth/login 호출
5. Supabase Auth 로그인 성공
6. role='Admin' 검증 통과
7. Supabase 세션 쿠키 설정
8. /admin/dashboard로 리다이렉트
✅ 예상: Admin 페이지 정상 접근
```

### 시나리오 2: 일반 사용자가 Admin 로그인 시도
```
1. /admin/login 페이지 접근
2. 일반 사용자 계정 정보 입력
3. 로그인 버튼 클릭
4. /api/admin/auth/login 호출
5. Supabase Auth 로그인 성공
6. role='User' (Admin 아님)
7. 세션 종료 처리
8. 에러 메시지: "관리자 권한이 없습니다."
✅ 예상: 로그인 실패
```

### 시나리오 3: Admin이 일반 로그인 페이지 사용
```
1. /login 페이지 접근
2. Admin 계정 정보 입력
3. 로그인 버튼 클릭
4. /api/auth/login 호출 (일반 로그인)
5. 로그인 성공 → /dashboard로 리다이렉트
6. /admin/dashboard URL 직접 접근
7. Middleware에서 role='Admin' 확인
8. 정상 접근
✅ 예상: Admin은 어느 로그인을 사용해도 Admin 페이지 접근 가능
```

### 시나리오 4: 일반 사용자가 Admin 페이지 URL 직접 접근
```
1. 일반 사용자로 로그인 (/login)
2. /admin/dashboard URL 직접 입력
3. Middleware 체크:
   - Supabase 세션: ✅ 유효
   - role: 'User' (Admin 아님)
4. /dashboard로 리다이렉트
✅ 예상: Admin 페이지 접근 차단
```

### 시나리오 5: 비로그인 상태에서 Admin 페이지 접근
```
1. 비로그인 상태
2. /admin/users URL 직접 입력
3. Middleware 체크:
   - Supabase 세션: ❌ 없음
4. /admin/login으로 리다이렉트
5. 로그인 후 원래 요청한 페이지로 이동 (선택사항)
✅ 예상: Admin 로그인 페이지로 리다이렉트
```

---

## 6. 일반 로그인 vs Admin 로그인 차이점

| 구분 | 일반 로그인 | Admin 로그인 |
|------|------------|--------------|
| 엔드포인트 | `/api/auth/login` | `/api/admin/auth/login` |
| 로그인 페이지 | `/login` | `/admin/login` |
| 검증 로직 | is_approved 확인 | is_approved + role='Admin' 확인 |
| 실패 시 처리 | 에러 메시지 표시 | 세션 종료 + 에러 메시지 |
| 성공 시 이동 | `/dashboard` | `/admin/dashboard` |
| 사용하는 쿠키 | **동일** (Supabase 세션) | **동일** (Supabase 세션) |

**핵심 차이:**
- Admin 로그인은 **추가로 role='Admin' 검증**을 수행
- 일반 사용자가 Admin 로그인을 시도하면 **즉시 거부**
- Admin 사용자는 **두 로그인 모두 사용 가능** (어느 쪽이든 Admin 페이지 접근 가능)

---

## 7. 보안 고려사항

### RLS 정책 (필수!)
```sql
-- 1. users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 3. 사용자는 자신의 role을 변경할 수 없음
CREATE POLICY "Users cannot update their own role"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (role = (SELECT role FROM users WHERE id = auth.uid()));

-- 4. Admin만 다른 사용자 정보 수정 가능 (선택사항)
CREATE POLICY "Admins can update user profiles"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);
```

### 세션 보안
- Supabase Auth가 자동으로 처리:
  - httpOnly 쿠키 (XSS 방지)
  - secure 쿠키 (HTTPS only)
  - sameSite 설정 (CSRF 방지)
  - 자동 토큰 갱신

### 추가 보안 권장사항
- HTTPS 사용 (프로덕션)
- 비밀번호 복잡도 정책
- 로그인 실패 횟수 제한 (Supabase Auth 기본 제공)
- 2FA (향후 추가 가능)

---

## 8. 구현 순서

1. **Admin 로그인 API 구현** (`/app/api/admin/auth/login/route.ts` 생성)
2. **Middleware 수정** (Admin 경로 리다이렉트 개선)
3. **Admin 로그인 페이지 수정** (Mock → API 연동)
4. **테스트 및 검증**
5. **(선택) Admin 로그인 로그 기능 추가**

---

## 9. 마이그레이션 참고사항

### 기존 Mock 로그인 제거
- `/app/admin/login/page.tsx`의 24-34번 라인 (Mock 검증 로직) 제거
- 개발 환경 계정 안내 (84-94번 라인) 제거 또는 유지

### 일반 로그인 API와의 차이점
- `/api/auth/login`: is_approved만 확인
- `/api/admin/auth/login`: is_approved + role='Admin' 확인

### Admin 로그아웃
일반 로그아웃 API(`/api/auth/logout`)를 그대로 사용 가능.
별도 Admin 로그아웃 API가 필요 없습니다.

---

## 10. 향후 확장 가능성

### 권한 세분화
```typescript
// 향후 role을 더 세분화할 수 있음
type Role = 'User' | 'Moderator' | 'Admin' | 'SuperAdmin'

// Middleware에서 세분화된 권한 체크
if (pathname.startsWith('/admin/users')) {
  if (profile.role !== 'SuperAdmin') {
    return redirect('/admin/dashboard')
  }
}
```

### Admin 활동 감사
- Admin이 수행한 모든 작업 기록
- 사용자 승인/거부 기록
- 콘텐츠 검수 기록

### Admin 세션 타임아웃
```typescript
// 향후 Admin 세션에 더 짧은 타임아웃 적용 가능
const sessionConfig = {
  maxAge: profile.role === 'Admin' ? 3600 : 86400, // Admin: 1시간, User: 24시간
}
```

---

## 11. 완료 기준

- [x] Admin 로그인 API 구현 완료
- [x] Middleware Admin 경로 리다이렉트 개선 완료
- [x] Admin 로그인 페이지 API 연동 완료
- [x] 모든 테스트 시나리오 통과
- [x] RLS 정책 검증 완료
- [x] FOLDER_STRUCTURE.md 업데이트 (필요 시)

---

**작성일**: 2025-10-26
**문서 번호**: 012
**방식**: 단일 세션 + Role 기반 제어 (단순 방식)
