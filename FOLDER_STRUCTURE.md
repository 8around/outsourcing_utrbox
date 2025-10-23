# UTRBOX 프로젝트 폴더 구조

## 📋 목차
1. [전체 구조 개요](#1-전체-구조-개요)
2. [루트 디렉터리](#2-루트-디렉터리)
3. [app 디렉터리](#3-app-디렉터리)
4. [components 디렉터리](#4-components-디렉터리)
5. [lib 디렉터리](#5-lib-디렉터리)
6. [기타 디렉터리](#6-기타-디렉터리)
7. [파일 명명 규칙](#7-파일-명명-규칙)

---

## 1. 전체 구조 개요

NextJS 14 App Router 기반의 프로젝트 구조로, 기능별 모듈화와 관심사 분리를 중점으로 설계되었습니다.

```
utrbox/
├── app/                    # Next.js 14 App Router
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 비즈니스 로직 및 유틸리티
├── hooks/                 # 커스텀 React 훅
├── types/                 # TypeScript 타입 정의
├── styles/                # 전역 스타일 및 CSS 모듈
├── public/                # 정적 자산
├── tests/                 # 테스트 파일
├── scripts/               # 빌드 및 유틸리티 스크립트
└── docs/                  # 프로젝트 문서
```

---

## 2. 루트 디렉터리

### 2.1 설정 파일

```
utrbox/
├── .env                        # 환경 변수 (로컬)
├── .env.local                  # 로컬 환경 변수 (Git 제외)
├── .env.production            # 프로덕션 환경 변수
├── .eslintrc.json             # ESLint 설정
├── .gitignore                 # Git 제외 파일
├── .prettierrc                # Prettier 설정
├── next.config.js             # Next.js 설정
├── package.json               # 프로젝트 의존성
├── postcss.config.js          # PostCSS 설정
├── tailwind.config.ts         # Tailwind CSS 설정
├── tsconfig.json              # TypeScript 설정
├── middleware.ts              # Next.js 미들웨어
└── README.md                  # 프로젝트 문서
```

### 2.2 문서 파일

```
utrbox/
├── PRD.md                     # 제품 요구사항 문서
├── DATABASE_SCHEMA.md         # 데이터베이스 스키마 문서
├── FOLDER_STRUCTURE.md        # 폴더 구조 문서 (현재 파일)
└── CHANGELOG.md               # 변경 이력
```

---

## 3. app 디렉터리

Next.js 14 App Router 구조를 따르는 라우팅 및 페이지 구성

```
app/
├── layout.tsx                 # 루트 레이아웃
├── page.tsx                   # 홈페이지
├── loading.tsx                # 전역 로딩 컴포넌트
├── error.tsx                  # 전역 에러 바운더리
├── not-found.tsx              # 404 페이지
├── globals.css                # 전역 스타일
│
├── (auth)/                    # 인증 관련 라우트 그룹
│   ├── layout.tsx                 # 인증 페이지 공통 레이아웃
│   ├── login/
│   │   ├── page.tsx              # 로그인 페이지
│   │   └── loading.tsx           # 로그인 로딩 상태
│   ├── signup/
│   │   ├── page.tsx              # 회원가입 페이지
│   │   └── loading.tsx           # 회원가입 로딩 상태
│   ├── reset-password/
│   │   ├── page.tsx              # 비밀번호 재설정 페이지
│   │   └── loading.tsx           # 재설정 로딩 상태
│   └── verify-email/
│       └── page.tsx              # 이메일 인증 페이지
│
├── (user)/                    # 사용자 포털 라우트 그룹
│   ├── layout.tsx                 # 사용자 포털 레이아웃 (사이드바, 헤더)
│   ├── dashboard/
│   │   ├── page.tsx              # 대시보드 메인
│   │   ├── loading.tsx           # 대시보드 로딩
│   │   └── components/           # 대시보드 전용 컴포넌트
│   │       ├── StatsCard.tsx
│   │       └── RecentActivity.tsx
│   ├── contents/
│   │   ├── page.tsx              # 콘텐츠 목록
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 콘텐츠 상세
│   │   │   ├── edit/
│   │   │   │   └── page.tsx      # 콘텐츠 수정
│   │   │   └── loading.tsx       # 상세 페이지 로딩
│   │   ├── upload/
│   │   │   └── page.tsx          # 콘텐츠 업로드
│   │   └── components/           # 콘텐츠 관련 컴포넌트
│   │       ├── ContentGrid.tsx
│   │       ├── ContentList.tsx
│   │       └── UploadDropzone.tsx
│   ├── collections/
│   │   ├── page.tsx              # 컬렉션 목록
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 컬렉션 상세
│   │   │   └── loading.tsx       # 컬렉션 로딩
│   │   ├── create/
│   │   │   └── page.tsx          # 컬렉션 생성
│   │   └── components/           # 컬렉션 관련 컴포넌트
│   │       ├── CollectionTree.tsx
│   │       └── CollectionCard.tsx
│   ├── detections/
│   │   ├── page.tsx              # 발견 결과 목록
│   │   └── [id]/
│   │       └── page.tsx          # 발견 결과 상세
│   └── profile/
│       ├── page.tsx              # 프로필 페이지
│       └── settings/
│           └── page.tsx          # 계정 설정
│
├── (admin)/                   # 관리자 포털 라우트 그룹
│   ├── layout.tsx                 # 관리자 레이아웃 (관리자 사이드바, 헤더)
│   ├── admin/
│   │   ├── page.tsx              # 관리자 대시보드
│   │   └── loading.tsx           # 관리자 대시보드 로딩
│   ├── admin/members/
│   │   ├── page.tsx              # 회원 목록
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 회원 상세
│   │   │   └── edit/
│   │   │       └── page.tsx      # 회원 정보 수정
│   │   └── components/           # 회원 관리 컴포넌트
│   │       ├── MemberTable.tsx
│   │       └── MemberFilters.tsx
│   ├── admin/contents/
│   │   ├── page.tsx              # 전체 콘텐츠 목록
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 콘텐츠 검토 페이지
│   │   │   └── analyze/
│   │   │       └── page.tsx      # AI 분석 실행
│   │   └── components/           # 콘텐츠 관리 컴포넌트
│   │       ├── ContentReviewModal.tsx
│   │       └── AnalysisResults.tsx
│   ├── admin/analysis/
│   │   ├── page.tsx              # AI 분석 관리
│   │   ├── batch/
│   │   │   └── page.tsx          # 일괄 분석
│   │   └── components/           # 분석 관련 컴포넌트
│   │       ├── AnalysisQueue.tsx
│   │       └── AnalysisHistory.tsx
│   ├── admin/detections/
│   │   ├── page.tsx              # 전체 발견 목록
│   │   ├── review/
│   │   │   └── page.tsx          # 검토 대기 목록
│   │   └── components/           # 검토 관련 컴포넌트
│   │       ├── ComparisonModal.tsx
│   │       └── ReviewForm.tsx
│   └── admin/settings/
│       ├── page.tsx              # 시스템 설정
│       └── components/
│           ├── APISettings.tsx
│           └── SystemConfig.tsx
│
└── api/                       # API 라우트
    ├── auth/
    │   ├── login/
    │   │   └── route.ts          # POST /api/auth/login
    │   ├── logout/
    │   │   └── route.ts          # POST /api/auth/logout
    │   ├── signup/
    │   │   └── route.ts          # POST /api/auth/signup
    │   ├── reset/
    │   │   └── route.ts          # POST /api/auth/reset
    │   ├── verify/
    │   │   └── route.ts          # POST /api/auth/verify
    │   └── me/
    │       └── route.ts          # GET /api/auth/me
    ├── contents/
    │   ├── route.ts              # GET, POST /api/contents
    │   ├── [id]/
    │   │   └── route.ts          # GET, PUT, DELETE /api/contents/[id]
    │   ├── upload/
    │   │   └── route.ts          # POST /api/contents/upload
    │   └── batch/
    │       └── route.ts          # POST /api/contents/batch
    ├── collections/
    │   ├── route.ts              # GET, POST /api/collections
    │   └── [id]/
    │       └── route.ts          # GET, PUT, DELETE /api/collections/[id]
    ├── analysis/
    │   ├── start/
    │   │   └── route.ts          # POST /api/analysis/start
    │   ├── [id]/
    │   │   └── route.ts          # GET /api/analysis/[id]
    │   └── batch/
    │       └── route.ts          # POST /api/analysis/batch
    ├── detections/
    │   ├── route.ts              # GET /api/detections
    │   ├── [id]/
    │   │   └── route.ts          # GET, PUT /api/detections/[id]
    │   └── review/
    │       └── route.ts          # POST /api/detections/review
    ├── admin/
    │   ├── users/
    │   │   ├── route.ts          # GET /api/admin/users
    │   │   └── [id]/
    │   │       └── route.ts      # GET, PUT /api/admin/users/[id]
    │   ├── stats/
    │   │   └── route.ts          # GET /api/admin/stats
    │   └── system/
    │       └── route.ts          # GET, PUT /api/admin/system
    └── webhooks/
        ├── google/
        │   └── route.ts          # POST /api/webhooks/google
        └── supabase/
            └── route.ts          # POST /api/webhooks/supabase
```

---

## 4. components 디렉터리

재사용 가능한 React 컴포넌트 구성

```
components/
├── ui/                        # shadcn/ui 기본 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ...
├── auth/                      # 인증 관련 컴포넌트
│   ├── LoginForm.tsx         # 로그인 폼
│   ├── SignupForm.tsx        # 회원가입 폼
│   ├── ResetPasswordForm.tsx # 비밀번호 재설정 폼
│   └── AuthGuard.tsx         # 인증 가드 컴포넌트
├── content/                   # 콘텐츠 관련 컴포넌트
│   ├── ContentCard.tsx       # 콘텐츠 카드
│   ├── ContentGrid.tsx       # 콘텐츠 그리드
│   ├── ContentList.tsx       # 콘텐츠 리스트
│   ├── ContentDetail.tsx     # 콘텐츠 상세
│   ├── ContentUploader.tsx   # 업로드 컴포넌트
│   └── ContentFilters.tsx    # 필터 컴포넌트
├── admin/                     # 관리자 전용 컴포넌트
│   ├── MemberTable.tsx       # 회원 테이블
│   ├── ReviewModal.tsx       # 검토 모달
│   ├── ComparisonView.tsx    # 비교 뷰
│   ├── AnalysisPanel.tsx     # 분석 패널
│   └── StatsDashboard.tsx    # 통계 대시보드
├── layout/                    # 레이아웃 컴포넌트
│   ├── Header.tsx            # 헤더
│   ├── Sidebar.tsx           # 사이드바
│   ├── Footer.tsx            # 푸터
│   ├── Navigation.tsx        # 네비게이션
│   └── Breadcrumb.tsx        # 브레드크럼
├── common/                    # 공통 컴포넌트
│   ├── LoadingSpinner.tsx    # 로딩 스피너
│   ├── ErrorBoundary.tsx     # 에러 바운더리
│   ├── EmptyState.tsx        # 빈 상태
│   ├── Pagination.tsx        # 페이지네이션
│   ├── SearchInput.tsx       # 검색 입력
│   ├── ConfirmDialog.tsx     # 확인 대화상자
│   └── ImageViewer.tsx       # 이미지 뷰어
└── providers/                 # Context Provider
    ├── AuthProvider.tsx       # 인증 컨텍스트
    ├── ThemeProvider.tsx      # 테마 컨텍스트
    ├── ToastProvider.tsx      # 토스트 컨텍스트
    └── QueryProvider.tsx      # React Query 프로바이더
```

---

## 5. lib 디렉터리

비즈니스 로직, 유틸리티 함수, 외부 서비스 연동

```
lib/
├── supabase/                  # Supabase 클라이언트 및 헬퍼
│   ├── client.ts             # Supabase 클라이언트 초기화
│   ├── server.ts             # 서버사이드 클라이언트
│   ├── auth.ts               # 인증 헬퍼 함수
│   ├── database.ts           # 데이터베이스 쿼리 함수
│   ├── storage.ts            # 스토리지 헬퍼 함수
│   └── realtime.ts           # 실시간 구독 함수
├── google-vision/             # Google Vision API 연동
│   ├── client.ts             # Google Vision 클라이언트
│   ├── analyze.ts            # 이미지 분석 함수
│   ├── types.ts              # API 타입 정의
│   └── utils.ts              # 유틸리티 함수
├── api/                       # API 클라이언트
│   ├── client.ts             # API 클라이언트 설정
│   ├── auth.ts               # 인증 API 호출
│   ├── contents.ts           # 콘텐츠 API 호출
│   ├── collections.ts        # 컬렉션 API 호출
│   ├── analysis.ts           # 분석 API 호출
│   └── admin.ts              # 관리자 API 호출
├── utils/                     # 유틸리티 함수
│   ├── format.ts             # 포맷팅 유틸리티
│   ├── date.ts               # 날짜 유틸리티
│   ├── file.ts               # 파일 유틸리티
│   ├── image.ts              # 이미지 처리 유틸리티
│   ├── string.ts             # 문자열 유틸리티
│   └── validation.ts         # 유효성 검증 유틸리티
├── validators/                # 유효성 검증 (Zod 스키마)
│   ├── auth.ts               # 인증 스키마
│   ├── content.ts            # 콘텐츠 스키마
│   ├── collection.ts         # 컬렉션 스키마
│   └── user.ts               # 사용자 스키마
└── constants/                 # 상수 정의
    ├── routes.ts             # 라우트 상수
    ├── api.ts                # API 엔드포인트
    ├── messages.ts           # 메시지 상수
    └── config.ts             # 설정 상수
```

---

## 6. 기타 디렉터리

### 6.1 hooks 디렉터리

```
hooks/
├── useAuth.ts                # 인증 관련 훅
├── useUser.ts                # 사용자 정보 훅
├── useContent.ts             # 콘텐츠 관련 훅
├── useCollection.ts          # 컬렉션 관련 훅
├── useUpload.ts              # 업로드 관련 훅
├── useAnalysis.ts            # 분석 관련 훅
├── useDebounce.ts            # 디바운스 훅
├── useIntersection.ts        # Intersection Observer 훅
└── useMediaQuery.ts          # 미디어 쿼리 훅
```

### 6.2 types 디렉터리

```
types/
├── index.ts                  # 타입 내보내기
├── auth.ts                   # 인증 관련 타입
├── user.ts                   # 사용자 타입
├── content.ts                # 콘텐츠 타입
├── collection.ts             # 컬렉션 타입
├── analysis.ts               # 분석 관련 타입
├── detection.ts              # 발견 관련 타입
├── api.ts                    # API 응답 타입
└── supabase.ts               # Supabase 생성 타입
```

### 6.3 styles 디렉터리

```
styles/
├── globals.css               # 전역 스타일
├── variables.css             # CSS 변수
└── components/               # 컴포넌트별 스타일
    ├── button.module.css
    ├── card.module.css
    └── table.module.css
```

### 6.4 public 디렉터리

```
public/
├── images/
│   ├── logo.svg             # 로고
│   ├── favicon.ico          # 파비콘
│   └── og-image.png         # Open Graph 이미지
├── fonts/                    # 커스텀 폰트
│   ├── Inter-Regular.woff2
│   └── NotoSansKR-Regular.woff2
└── icons/                    # 아이콘
    ├── upload.svg
    ├── download.svg
    └── delete.svg
```

### 6.5 tests 디렉터리

```
tests/
├── unit/                     # 단위 테스트
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/              # 통합 테스트
│   ├── api/
│   └── auth/
├── e2e/                      # E2E 테스트
│   ├── auth.spec.ts
│   ├── upload.spec.ts
│   └── admin.spec.ts
└── fixtures/                 # 테스트 픽스처
    ├── users.json
    └── contents.json
```

### 6.6 scripts 디렉터리

```
scripts/
├── setup.js                  # 초기 설정 스크립트
├── seed.js                   # 시드 데이터 스크립트
├── migrate.js                # 마이그레이션 스크립트
└── backup.js                 # 백업 스크립트
```

### 6.7 docs 디렉터리

```
docs/
├── api/                      # API 문서
│   ├── authentication.md
│   ├── contents.md
│   └── admin.md
├── guides/                   # 사용 가이드
│   ├── user-guide.md
│   └── admin-guide.md
└── development/              # 개발 문서
    ├── setup.md
    ├── deployment.md
    └── troubleshooting.md
```

---

## 7. 파일 명명 규칙

### 7.1 컴포넌트 파일
- **React 컴포넌트**: PascalCase (예: `ContentCard.tsx`)
- **컴포넌트 스타일**: 같은 이름의 `.module.css` (예: `ContentCard.module.css`)
- **컴포넌트 테스트**: 같은 이름의 `.test.tsx` (예: `ContentCard.test.tsx`)

### 7.2 유틸리티 및 함수
- **유틸리티 함수**: camelCase (예: `formatDate.ts`)
- **상수**: UPPER_SNAKE_CASE 내용, camelCase 파일명 (예: `apiEndpoints.ts`)
- **타입 정의**: camelCase (예: `contentTypes.ts`)

### 7.3 Next.js 특수 파일
- **페이지**: `page.tsx`
- **레이아웃**: `layout.tsx`
- **로딩**: `loading.tsx`
- **에러**: `error.tsx`
- **API 라우트**: `route.ts`

### 7.4 설정 파일
- **설정**: kebab-case 또는 dotfile (예: `next.config.js`, `.eslintrc.json`)
- **환경 변수**: `.env`, `.env.local`, `.env.production`

### 7.5 테스트 파일
- **단위 테스트**: `*.test.ts` 또는 `*.test.tsx`
- **E2E 테스트**: `*.spec.ts`
- **테스트 유틸리티**: `test-utils.ts`

---

## 8. Import 별칭 설정

### 8.1 tsconfig.json 경로 별칭

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["lib/utils/*"],
      "@/styles/*": ["styles/*"]
    }
  }
}
```

### 8.2 Import 예시

```typescript
// 절대 경로 import
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import type { User } from '@/types/user'

// 상대 경로 import (같은 폴더 내)
import { LocalComponent } from './LocalComponent'
```

---

## 9. 폴더 구조 모범 사례

### 9.1 기능별 그룹화
- 관련된 파일들을 같은 폴더에 보관
- 컴포넌트와 관련 스타일, 테스트를 함께 배치

### 9.2 배럴 파일 사용
```typescript
// components/content/index.ts
export { ContentCard } from './ContentCard'
export { ContentGrid } from './ContentGrid'
export { ContentList } from './ContentList'
```

### 9.3 코드 분할
- 큰 컴포넌트는 하위 컴포넌트로 분할
- 라우트별 코드 스플리팅 활용

### 9.4 일관된 구조 유지
- 모든 feature 폴더는 동일한 구조 유지
- 새로운 기능 추가 시 기존 패턴 따르기

---

## 10. 빌드 출력 구조

### 10.1 Next.js 빌드 출력

```
.next/
├── cache/                    # 빌드 캐시
├── server/                   # 서버 번들
├── static/                   # 정적 자산
└── BUILD_ID                  # 빌드 식별자
```

### 10.2 Vercel 배포 구조

```
.vercel/
├── output/                   # 빌드 출력
│   ├── functions/           # 서버리스 함수
│   └── static/              # 정적 파일
└── project.json             # 프로젝트 설정
```

---

_이 문서는 UTRBOX 프로젝트의 폴더 구조를 정의합니다. 새로운 기능 추가 시 이 구조를 참고하여 일관성을 유지해야 합니다._