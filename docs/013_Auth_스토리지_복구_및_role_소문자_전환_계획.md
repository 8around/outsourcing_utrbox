# signInUser에서 isApproved 반환 + auth-storage 조건부 복구 + role 소문자 전환 계획

## 목표

- lib/supabase/auth.ts의 `signInUser`가 승인 여부를 boolean(`isApproved`)로 함께 반환
- 로그인 API(`/api/auth/login`) 응답에 `isApproved` 포함(전파)
- 스토어의 승인 상태를 `status` 문자열 대신 `isApproved: boolean`으로 저장/사용
- auth-storage가 삭제된 경우에만 BrowserClient로 세션/프로필 조회해 스토어 복구
- 사용자 `role`을 전역적으로 `'admin' | 'member'` 소문자 스킴으로 통일, 대문자 체크 코드 제거/수정

## 변경 파일

- `lib/supabase/auth.ts`: `signInUser` 반환 타입/데이터에 `isApproved: boolean` 추가, `role` 소문자 정규화
- `app/api/auth/login/route.ts`: 응답 바디가 `isApproved`와 소문자 `role`을 그대로 전달하도록 유지(변경 최소)
- `lib/stores/authStore.ts`: 로컬 `AuthUser`로 타입 전환(`isApproved: boolean`, `role: 'admin'|'member'`)
- `components/auth/LoginForm.tsx`: 성공 시 `isApproved` 및 소문자 `role`을 스토어에 저장
- `hooks/use-auth-recovery.ts` (신규): auth-storage 삭제 시에만 BrowserClient로 복구(프로필에서 `is_approved` → `isApproved`, `role` 소문자화)
- `app/(user)/layout.tsx`: 복구 훅 연결(복구 중 경량 로딩 표시)
- `types/user.ts`: `UserRole`을 `'admin' | 'member'`로 변경, `UserStatus` 사용처 제거 또는 유지 시 맵핑 문서화
- 미들웨어/관리자 페이지 등 역할 비교 로직 확인(소문자 기준으로 검증)

## 구현 요지

### 1) signInUser 반환 변경 및 role 정규화

```ts
// lib/supabase/auth.ts (성공 케이스 핵심)
return {
  success: true,
  data: {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      name: profile.name,
      organization: profile.organization,
      role: profile.role,
      isApproved: profile.is_approved,
    },
  },
  error: null,
}
```

### 2) 스토어 타입 전환(요지)

```ts
// lib/stores/authStore.ts
interface AuthUser {
  id: string
  email: string
  name: string
  organization: string
  role: 'admin' | 'member'
  isApproved: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (user: Partial<AuthUser>) => void
}
```

### 3) LoginForm 매핑 수정(요지)

```ts
// components/auth/LoginForm.tsx (성공 분기)
login({
  id: result.data.user.id,
  email: result.data.user.email,
  name: result.data.user.name,
  organization: result.data.user.organization,
  role: result.data.user.role, // 이미 소문자
  isApproved: result.data.user.is_approved,
})
```

### 4) auth-storage 조건부 복구 훅(요지)

- localStorage에 `auth-storage`가 없을 때만 실행
- `supabase.auth.getUser()` → 프로필 조회 → `login()`으로 재구성
- `role = profile.role` / `isApproved = profile.is_approved`

간결 구현 예시:

```ts
// hooks/use-auth-recovery.ts
'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export function useAuthRecovery() {
  const attempted = useRef(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (attempted.current) return
    if (typeof window === 'undefined') return
    const missing = localStorage.getItem('auth-storage') === null
    if (!missing) return

    attempted.current = true
    setRecovering(true)
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setRecovering(false)
        return
      }
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

      if (profile) {
        useAuthStore.getState().login({
          id: user.id,
          email: user.email || '',
          name: profile.name,
          organization: profile.organization,
          role: profile.role,
          isApproved: profile.is_approved,
          created_at: profile.created_at ?? '',
          updated_at: profile.updated_at ?? '',
        })
      }
      setRecovering(false)
    })()
  }, [])

  return { recovering }
}
```

## 영향 분석

- 서버: DB/미들웨어 로직 변경 없음(미들웨어는 이미 `'admin'` 소문자 사용)
- API: 로그인 응답에 필드 추가(`isApproved`)와 소문자 role 표준화(후방 호환성 높음)
- 클라이언트: `User` 타입을 참조하는 코드에서 `status` → `isApproved`, `role` 대소문자 의존 제거 필요
- 현 코드 기준 사용처: 헤더/대시보드 등은 `name/email/organization/role`만 사용 → 영향 낮음. `user.status` 직접 사용처는 없음(확인 후 필요 시 치환)

## 역할 비교 코드 점검/수정 계획

- 정규식/검색 키워드: `Admin\b`, `Member\b`, `role\s*===\s*['\"]Admin`, `role\s*===\s*['\"]Member`
- 수정 정책: 모두 소문자로 치환(`'admin'|'member'`), 비교 전 `toLowerCase()` 가드 필요 시 추가
- 확인 대상: `middleware.ts`(이미 소문자), `components/**`, `app/**`, `lib/**`

## 단계별 작업

1. `lib/supabase/auth.ts`: `signInUser` 반환에 `isApproved` 추가, `role` 소문자화
2. `lib/stores/authStore.ts`: `AuthUser`(isApproved:boolean, role 소문자)로 전환
3. `components/auth/LoginForm.tsx`: 응답의 `isApproved/role` 매핑
4. `hooks/use-auth-recovery.ts`: 조건부 복구 구현 및 소문자 role/boolean isApproved 반영
5. `app/(user)/layout.tsx`: 복구 훅 연결(선택 로딩)
6. `types/user.ts`: `UserRole`을 `'admin'|'member'`로 변경(교차 사용부 영향 점검)
7. 코드베이스 전역 검색으로 대문자 역할 비교 로직 치환 및 검증

## To-dos

- [ ] signInUser가 isApproved:boolean을 반환하도록 타입/데이터 수정
- [ ] authStore의 User를 AuthUser(isApproved:boolean)로 전환
- [ ] LoginForm에서 isApproved를 스토어에 저장하도록 수정
- [ ] hooks/use-auth-recovery.ts 추가 및 조건부 복구 구현
- [ ] app/(user)/layout.tsx에 복구 훅 연결 및 복구 중 로딩 처리
- [ ] user.status 사용처 점검 후 필요 시 isApproved로 치환
