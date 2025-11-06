# Supabase 이메일 템플릿

## 📋 목차
1. [개요](#1-개요)
2. [이메일 인증 템플릿](#2-이메일-인증-템플릿)
3. [비밀번호 재설정 템플릿](#3-비밀번호-재설정-템플릿)
4. [템플릿 설정 방법](#4-템플릿-설정-방법)
5. [변수 참조](#5-변수-참조)
6. [주의사항](#6-주의사항)

---

## 1. 개요

UTRBOX 프로젝트에서 사용하는 Supabase 이메일 템플릿 정의 문서입니다. Supabase Dashboard의 Auth > Email Templates에서 설정됩니다.

### 1.1 템플릿 목적
- 회원가입 시 이메일 인증
- 비밀번호 재설정
- 한국어 사용자를 위한 로컬라이즈된 메시지
- 커스텀 검증 엔드포인트로 리다이렉션

### 1.2 템플릿 특징
- 커스텀 API 엔드포인트 사용 (`/api/auth/verify`, `/api/auth/reset-password/confirm`)
- 토큰 해시와 이메일을 쿼리 파라미터로 전달
- redirectTo 옵션 없이 템플릿에서 직접 URL 구성
- 관리자 승인 프로세스 연동 (이메일 인증)

---

## 2. 이메일 인증 템플릿

### 2.1 Confirm Signup (회원가입 확인)

**템플릿 유형**: `Confirm Signup`

#### HTML 템플릿

```html
<h2>UTRBOX 이메일 인증</h2>

<p>{{ .Email }} 계정의 이메일 인증을 완료하려면 아래 버튼을 클릭해주세요.</p>

<p style="margin: 30px 0;">
  <a
    href="{{ .SiteURL }}/api/auth/verify?token_hash={{ .TokenHash }}&email={{ .Email }}"
    style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
  >
    이메일 인증
  </a>
</p>

<p style="color: #6B7280; font-size: 14px;">
  이 링크는 1시간 동안 유효합니다.<br>
  본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
</p>
```

#### 템플릿 설명
- **제목**: "UTRBOX 이메일 인증" - 서비스명을 명확히 표시
- **본문**: 사용자 이메일 주소를 포함한 안내 메시지
- **CTA 버튼**: 인디고 색상(#4F46E5)의 눈에 띄는 인증 버튼
- **유효기간 안내**: 1시간 제한 명시
- **보안 안내**: 본인이 요청하지 않은 경우의 대처 방법

---

## 3. 비밀번호 재설정 템플릿

### 3.1 Change Email / Reset Password (비밀번호 재설정)

**템플릿 유형**: `Change Email` 또는 `Reset Password`

#### HTML 템플릿

```html
<h2>UTRBOX 비밀번호 재설정</h2>

<p>{{ .Email }} 계정의 비밀번호를 재설정하려면 아래 버튼을 클릭해주세요.</p>

<p style="margin: 30px 0;">
  <a
    href="{{ .SiteURL }}/api/auth/reset-password/confirm?token_hash={{ .TokenHash }}&type=recovery&email={{ .Email }}"
    style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
  >
    비밀번호 재설정
  </a>
</p>

<p style="color: #6B7280; font-size: 14px;">
  이 링크는 1시간 동안 유효합니다.<br>
  본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
</p>
```

#### 템플릿 설명
- **제목**: "UTRBOX 비밀번호 재설정" - 명확한 목적 표시
- **본문**: 사용자 이메일 주소를 포함한 안내 메시지
- **CTA 버튼**: 인디고 색상(#4F46E5)의 눈에 띄는 재설정 버튼
- **유효기간 안내**: 1시간 제한 명시
- **보안 안내**: 본인이 요청하지 않은 경우의 대처 방법

#### 리다이렉트 URL 구조
```
{{ .SiteURL }}/api/auth/reset-password/confirm?token_hash={{ .TokenHash }}&type=recovery
```
- `SiteURL`: 프로젝트의 기본 URL
- `token_hash`: Supabase가 생성한 일회용 토큰
- `type=recovery`: 비밀번호 재설정 타입 (필수)
- `email`: 대상 이메일 주소 (선택적, UX 개선용)

#### 주요 차이점
- **type=recovery 파라미터**: 비밀번호 재설정에는 필수 (이메일 인증과의 차이)
- **엔드포인트**: `/api/auth/reset-password/confirm` (이메일 인증: `/api/auth/verify`)
- **redirectTo 옵션 불필요**: 템플릿에서 직접 URL 구성

---

## 4. 템플릿 설정 방법

### 4.1 Supabase Dashboard 접근
1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. Authentication > Email Templates 메뉴 이동

### 4.2 이메일 인증 템플릿 적용
1. **Template type** 선택: `Confirm signup`
2. HTML 템플릿 코드 붙여넣기
3. **Save** 버튼 클릭

### 4.3 비밀번호 재설정 템플릿 적용
1. **Template type** 선택: `Change Email` 또는 `Reset Password`
2. HTML 템플릿 코드 붙여넣기
3. **Save** 버튼 클릭

### 4.4 redirectTo 옵션 불필요
- 커스텀 템플릿에서 {{ .SiteURL }}을 사용하여 직접 URL 구성
- {{ .ConfirmationURL }} 변수를 사용하지 않음
- API 코드에서 redirectTo 옵션 제거 가능

---

## 5. 변수 참조

### 5.1 Supabase 제공 변수
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{ .Email }}` | 수신자 이메일 주소 | user@example.com |
| `{{ .TokenHash }}` | 인증용 토큰 해시 | pkce_abc123... |
| `{{ .SiteURL }}` | 사이트 기본 URL | https://utrbox.com |
| `{{ .ConfirmationURL }}` | 기본 확인 URL (미사용) | - |

### 5.2 커스텀 처리
- 기본 `{{ .ConfirmationURL }}` 대신 커스텀 엔드포인트 사용
- 이메일 인증: `/api/auth/verify` 라우트에서 토큰 검증
- 비밀번호 재설정: `/api/auth/reset-password/confirm` 라우트에서 토큰 검증

---

## 6. 주의사항

### 6.1 구현 관련
- **토큰 유효기간**: 1시간 (Supabase 기본값)
- **재전송 제한**: 동일 이메일 1분 간격 제한
- **세션 관리**: 인증 성공 후 관리자 승인 대기를 위해 세션 즉시 제거

### 6.2 보안 고려사항
- 토큰은 일회용으로 한 번 사용 시 만료
- HTTPS 환경에서만 작동
- 이메일 주소 파라미터는 추가 검증 및 UX 개선 목적

### 6.3 사용자 경험
- 인증 후 로그인 페이지로 리다이렉트
- 성공/실패 메시지 토스트로 표시
- 만료 시 재전송 버튼 제공 (LoginForm에서 처리)

---

## 7. 연관 파일

### 7.1 백엔드 처리
- `/app/api/auth/verify/route.ts`: 이메일 인증 토큰 검증
- `/app/api/auth/resend-verification/route.ts`: 인증 메일 재전송
- `/app/api/auth/reset-password/route.ts`: 비밀번호 재설정 이메일 전송
- `/app/api/auth/reset-password/confirm/route.ts`: 비밀번호 재설정 토큰 검증 (향후 구현)
- `/lib/supabase/auth.ts`: 헬퍼 함수 (signUpUser, resetUserPassword 등)
- `/lib/utils/errors.ts`: 에러 메시지 한국어 매핑

### 7.2 프론트엔드
- `/components/auth/LoginForm.tsx`: 로그인 및 재전송 버튼
- `/components/auth/SignupForm.tsx`: 회원가입
- `/components/auth/ResetPasswordForm.tsx`: 비밀번호 재설정 요청

### 7.3 문서
- `/docs/035_이메일_인증_커스터마이징_및_사용자_피드백_개선.md`: 이메일 인증 구현
- `/docs/037_Supabase_Auth_에러코드_한국어_메시지_매핑.md`: 에러 처리
- `/docs/038_비밀번호_재설정_AuthResponse_패턴_구현.md`: 비밀번호 재설정 구현

---

## 8. 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| v1.0 | 2025-11-06 | 초기 이메일 인증 템플릿 생성 |
| v1.1 | 2025-11-06 | 비밀번호 재설정 템플릿 추가, redirectTo 옵션 불필요 설명 추가 |

---

_이 문서는 UTRBOX 프로젝트의 Supabase 이메일 템플릿을 정의합니다. 템플릿 수정 시 이 문서도 함께 업데이트해야 합니다._