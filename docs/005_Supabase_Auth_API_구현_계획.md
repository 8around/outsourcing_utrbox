# 005_Supabase_Auth_API_구현_계획

## 📋 개요

**태스크 번호**: 3
**태스크 명**: Supabase Auth 기반 회원가입/로그인 API 구현
**작성일**: 2025-10-24
**목표**: 현재 Mock API로 동작 중인 인증 시스템을 Supabase Auth 기반의 실제 API로 전환

---

## 🎯 목표 및 범위

### 구현 목표
1. Supabase Auth를 활용한 실제 회원가입/로그인 기능 구현
2. 승인 기반 회원 시스템 구현 (관리자 승인 후 로그인 허용)
3. 비밀번호 재설정 기능 구현
4. 세션 관리 및 인증 상태 유지
5. RLS(Row Level Security) 정책 활용한 보안 구현
6. 강력한 비밀번호 정책 적용 (8자 이상, 대/소문자, 숫자, 특수문자 포함)

### 범위
- ✅ 회원가입 API 구현
- ✅ 로그인 API 구현
- ✅ 로그아웃 API 구현
- ✅ 비밀번호 재설정 API 구현
- ✅ 현재 사용자 정보 조회 API 구현
- ✅ Supabase Client 설정 및 헬퍼 함수 작성
- ✅ 승인 기반 로그인 검증 로직 구현
- ⬜ 2FA 인증 (선택사항 - 향후 구현)

---

## 📁 현재 상태 분석

### 기존 구조
```
lib/
├── api/
│   └── mock/
│       ├── auth.ts          # Mock 인증 API
│       └── index.ts
├── stores/
│   └── authStore.ts         # Zustand 인증 상태 관리
components/
├── auth/
│   ├── LoginForm.tsx        # 로그인 폼 (Mock API 사용 중)
│   ├── SignupForm.tsx       # 회원가입 폼 (Mock API 사용 중)
│   └── ResetPasswordForm.tsx # 비밀번호 재설정 폼
```

### 데이터베이스 상태
- ✅ `users` 테이블 생성 완료 (auth.users와 연동)
- ✅ RLS 정책 설정 완료
- ✅ 헬퍼 함수 (`is_admin`, `is_approved_user`) 설정 완료
- ✅ TypeScript 타입 정의 완료 (`types/database.type.ts`)

### 기술 스택
- **인증**: Supabase Auth (JWT 기반)
- **데이터베이스**: Supabase (PostgreSQL)
- **상태관리**: Zustand (persist 미들웨어)
- **폼 관리**: React Hook Form + Zod
- **UI**: shadcn/ui

---

## 🏗️ 구현 계획

### Phase 1: Supabase Client 설정 및 헬퍼 함수 작성

#### 1.1 Supabase Client 생성
**파일**: `lib/supabase/client.ts` (신규 생성)

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.type'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**환경 변수 확인**:
- `.env.local` 파일에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 확인

#### 1.2 인증 헬퍼 함수 작성
**파일**: `lib/supabase/auth.ts` (신규 생성)

구현할 헬퍼 함수:
- `getUserProfile()`: 현재 사용자의 프로필 정보 조회
- `checkUserApproval()`: 사용자 승인 상태 확인
- `signUpUser()`: 회원가입 (auth.users + public.users 동시 생성)
- `signInUser()`: 로그인 (승인 상태 검증 포함)
- `signOutUser()`: 로그아웃
- `resetUserPassword()`: 비밀번호 재설정 이메일 전송

---

### Phase 2: API Routes 구현

#### 2.1 회원가입 API
**파일**: `app/api/auth/signup/route.ts` (신규 생성)

**처리 로직**:
1. 요청 데이터 검증 (email, password, name, organization)
2. Supabase Auth에 사용자 생성 (`auth.signUp()`)
3. `public.users` 테이블에 프로필 정보 저장 (is_approved: null)
4. 이메일 확인 메일 발송 (Supabase 자동 처리)
5. 응답 반환 (승인 대기 상태 안내)

**응답 형식**:
```typescript
{
  success: true,
  data: {
    user: { id, email, name, organization, status: 'pending' },
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
  }
}
```

#### 2.2 로그인 API
**파일**: `app/api/auth/login/route.ts` (신규 생성)

**처리 로직**:
1. 요청 데이터 검증 (email, password)
2. Supabase Auth 로그인 시도 (`auth.signInWithPassword()`)
3. `public.users` 테이블에서 승인 상태 확인
4. 승인되지 않은 경우 세션 종료 및 오류 반환
5. 승인된 경우 세션 유지 및 사용자 정보 반환

**응답 형식**:
```typescript
{
  success: true,
  data: {
    user: { id, email, name, organization, role, status: 'approved' },
    session: { access_token, refresh_token }
  }
}
```

#### 2.3 로그아웃 API
**파일**: `app/api/auth/logout/route.ts` (신규 생성)

**처리 로직**:
1. Supabase Auth 로그아웃 (`auth.signOut()`)
2. 세션 삭제
3. 응답 반환

#### 2.4 비밀번호 재설정 API
**파일**: `app/api/auth/reset-password/route.ts` (신규 생성)

**처리 로직**:
1. 요청 데이터 검증 (email)
2. Supabase Auth 비밀번호 재설정 이메일 전송 (`auth.resetPasswordForEmail()`)
3. 응답 반환

#### 2.5 현재 사용자 정보 조회 API
**파일**: `app/api/auth/me/route.ts` (신규 생성)

**처리 로직**:
1. 세션에서 사용자 ID 추출
2. `public.users` 테이블에서 사용자 정보 조회
3. 응답 반환

---

### Phase 3: Zustand Store 업데이트

#### 3.1 AuthStore 수정
**파일**: `lib/stores/authStore.ts` (수정)

**변경사항**:
- Supabase 세션 정보 저장
- 세션 자동 갱신 로직 추가
- 승인 상태 검증 로직 추가

```typescript
interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  login: (user: User, session: Session) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setSession: (session: Session | null) => void
}
```

---

### Phase 4: 컴포넌트 업데이트

#### 4.1 LoginForm 수정
**파일**: `components/auth/LoginForm.tsx` (수정)

**변경사항**:
- Mock API 호출 → 실제 API 호출로 변경 (`/api/auth/login`)
- 세션 정보 저장
- 승인 대기/거부 상태 에러 처리 개선

#### 4.2 SignupForm 수정
**파일**: `components/auth/SignupForm.tsx` (수정)

**변경사항**:
- Mock API 호출 → 실제 API 호출로 변경 (`/api/auth/signup`)
- 이메일 확인 안내 메시지 추가
- 승인 대기 상태 안내 개선

#### 4.3 ResetPasswordForm 수정
**파일**: `components/auth/ResetPasswordForm.tsx` (수정)

**변경사항**:
- Mock API 호출 → 실제 API 호출로 변경 (`/api/auth/reset-password`)
- 이메일 전송 완료 안내 개선

---

### Phase 5: 미들웨어 및 보안 설정

#### 5.1 인증 미들웨어 작성
**파일**: `middleware.ts` (신규 생성)

**기능**:
- 보호된 경로 접근 시 인증 확인
- 승인되지 않은 사용자 리다이렉트
- 세션 자동 갱신

**보호 경로**:
- `/dashboard/*`
- `/contents/*`
- `/collections/*`
- `/admin/*` (관리자만)

#### 5.2 RLS 정책 검증
**작업**:
- DATABASE_SCHEMA.md의 RLS 정책이 Supabase에 올바르게 적용되었는지 확인
- 헬퍼 함수 (`is_admin`, `is_approved_user`) 정상 동작 확인

---

### Phase 6: 타입 정의 및 유틸리티

#### 6.1 API 응답 타입 정의
**파일**: `types/api.ts` (수정)

```typescript
export interface AuthResponse<T = any> {
  success: boolean
  data: T | null
  error: string | null
  message?: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  organization: string
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  session: Session
}
```

#### 6.2 에러 핸들링 유틸리티
**파일**: `lib/utils/errors.ts` (신규 생성)

```typescript
export function handleAuthError(error: AuthError): string {
  // Supabase Auth 에러 메시지를 사용자 친화적인 한국어로 변환
}
```

#### 6.3 입력 필드 검증 유틸리티
**파일**: `lib/utils/validation.ts` (신규 생성)

**비밀번호 정책**:
- 최소 8자 이상
- 영어 대문자 최소 1개
- 영어 소문자 최소 1개
- 숫자 최소 1개
- 특수문자 최소 1개

**이름 정책**:
- 영어(대/소문자)와 한글만 허용
- 단어 사이 단일 공백만 허용 (연속 공백 불허)
- 최소 2자 이상

**소속 정책**:
- 영어(대/소문자)와 한글만 허용
- 단어 사이 단일 공백만 허용 (연속 공백 불허)
- 최소 2자 이상

```typescript
// 비밀번호 검증
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export const passwordValidation = {
  regex: passwordRegex,
  message: '비밀번호는 8자 이상, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.'
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('영어 소문자를 최소 1개 포함해야 합니다.')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('영어 대문자를 최소 1개 포함해야 합니다.')
  }
  if (!/\d/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다.')
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('특수문자(@$!%*?&)를 최소 1개 포함해야 합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 이름/소속 검증
export const nameRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/

export const nameValidation = {
  regex: nameRegex,
  message: '영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다.'
}

export const organizationRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/

export const organizationValidation = {
  regex: organizationRegex,
  message: '영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다.'
}
```

---

## 🔍 테스트 계획

### 테스트 시나리오

#### 1. 회원가입 테스트
- [ ] 정상 회원가입 (이메일 확인 메일 수신)
- [ ] 이메일 중복 검증
- [ ] 비밀번호 최소 길이 검증
- [ ] 필수 필드 검증
- [ ] 승인 대기 상태 확인

#### 2. 로그인 테스트
- [ ] 승인된 사용자 정상 로그인
- [ ] 승인 대기 사용자 로그인 차단
- [ ] 차단된 사용자 로그인 차단
- [ ] 잘못된 이메일/비밀번호 처리
- [ ] Remember Me 기능 동작 확인

#### 3. 로그아웃 테스트
- [ ] 세션 삭제 확인
- [ ] 로그아웃 후 보호된 페이지 접근 차단

#### 4. 비밀번호 재설정 테스트
- [ ] 이메일 전송 확인
- [ ] 재설정 링크 동작 확인
- [ ] 새 비밀번호로 로그인 확인

#### 5. 미들웨어 테스트
- [ ] 미인증 사용자 리다이렉트
- [ ] 승인되지 않은 사용자 리다이렉트
- [ ] 세션 자동 갱신 동작 확인

---

## 📝 구현 체크리스트

### Phase 1: Supabase 설정
- [ ] `lib/supabase/client.ts` 생성
- [ ] `lib/supabase/auth.ts` 헬퍼 함수 작성
- [ ] 환경 변수 설정 확인

### Phase 2: API Routes
- [ ] `app/api/auth/signup/route.ts` 구현
- [ ] `app/api/auth/login/route.ts` 구현
- [ ] `app/api/auth/logout/route.ts` 구현
- [ ] `app/api/auth/reset-password/route.ts` 구현
- [ ] `app/api/auth/me/route.ts` 구현

### Phase 3: Store 업데이트
- [ ] `lib/stores/authStore.ts` 수정 (세션 관리 추가)

### Phase 4: 컴포넌트 업데이트
- [ ] `components/auth/LoginForm.tsx` 수정
- [ ] `components/auth/SignupForm.tsx` 수정
- [ ] `components/auth/ResetPasswordForm.tsx` 수정

### Phase 5: 보안 설정
- [ ] `middleware.ts` 생성 (인증 미들웨어)
- [ ] RLS 정책 검증

### Phase 6: 타입 및 유틸리티
- [ ] `types/api.ts` 수정 (인증 관련 타입 추가)
- [ ] `lib/utils/errors.ts` 생성 (에러 핸들링)
- [ ] `lib/utils/validation.ts` 생성 (비밀번호 검증)

### 테스트 및 검증
- [ ] 모든 테스트 시나리오 통과
- [ ] Playwright로 E2E 테스트 수행
- [ ] 로그 확인 및 디버깅

---

## ⚠️ 주의사항

### 데이터베이스 변경 금지
- **중요**: DATABASE_SCHEMA.md와 실제 Supabase 데이터베이스는 동기화 상태 유지 필수
- 컬럼 추가/수정 전 반드시 개발자 승인 필요
- 무단 스키마 변경 절대 금지

### 보안 고려사항
1. **비밀번호 정책**:
   - 최소 8자 이상
   - 영어 대문자, 소문자, 숫자, 특수문자(@$!%*?&) 각 1개 이상 포함
   - 클라이언트(Zod)와 서버(API) 양쪽에서 검증
2. **비밀번호 관리**: Supabase Auth가 자동으로 bcrypt 해싱 처리
3. **세션 보안**: HTTP-only 쿠키로 세션 토큰 저장
4. **RLS 정책**: 모든 데이터 접근은 RLS 정책을 통과해야 함
5. **에러 메시지**: 보안상 민감한 정보 노출 금지 (예: "이메일이 존재하지 않습니다" → "이메일 또는 비밀번호가 올바르지 않습니다")

### Mock 데이터 제거
- Mock API 제거는 실제 API 구현 완료 및 테스트 통과 후 진행
- 단계적 마이그레이션으로 안전성 확보

---

## 🚀 실행 순서

1. **환경 설정 확인** (.env.local)
2. **Phase 1 실행** (Supabase Client 설정)
3. **Phase 2 실행** (API Routes 구현)
4. **Phase 3 실행** (Store 업데이트)
5. **Phase 4 실행** (컴포넌트 수정)
6. **Phase 5 실행** (미들웨어 및 보안)
7. **Phase 6 실행** (타입 및 유틸리티)
8. **테스트 수행** (모든 시나리오)
9. **Playwright 검증** (E2E 테스트)
10. **배포 준비** (Mock 데이터 제거)

---

## 📚 참고 문서

- [PRD.md](../PRD.md) - 프로젝트 요구사항
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - 데이터베이스 스키마
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

_이 계획서는 Task 3(Supabase Auth 기반 회원가입/로그인 API 구현)의 상세 구현 계획입니다._
