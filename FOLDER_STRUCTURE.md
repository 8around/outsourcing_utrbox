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
└── public/                # 정적 자산
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
├── CLAUDE.md                          # Claude Code 작업 지시사항
├── DATABASE_SCHEMA.md                 # 데이터베이스 스키마 문서
├── FOLDER_STRUCTURE.md                # 폴더 구조 문서 (현재 파일)
├── GOOGLE_VISION_ERROR_CODES.md       # Google Vision API 에러 코드
├── PRD.md                             # 제품 요구사항 문서
├── README.md                          # 프로젝트 README
├── SUPABASE_COMPUTE_RECOMMENDATION.md # Supabase 컴퓨팅 리소스 권장사항
├── SUPABASE_EMAIL_TEMPLATES.md        # Supabase 이메일 템플릿
├── VisionAPIExample.md                # Vision API 사용 예시
└── utrbox_prd_final.md                # 최종 PRD 문서
```

---

## 3. app 디렉터리

Next.js 14 App Router 구조를 따르는 라우팅 및 페이지 구성

```
app/
├── layout.tsx                 # 루트 레이아웃
├── page.tsx                   # 홈페이지
├── globals.css                # 전역 스타일
├── favicon.ico                # 파비콘
│
├── (auth)/                    # 인증 관련 라우트 그룹
│   ├── layout.tsx                 # 인증 페이지 공통 레이아웃
│   ├── login/
│   │   └── page.tsx              # 로그인 페이지
│   ├── signup/
│   │   └── page.tsx              # 회원가입 페이지
│   └── reset-password/
│       └── page.tsx              # 비밀번호 재설정 페이지
│
├── (user)/                    # 사용자 포털 라우트 그룹
│   ├── layout.tsx                 # 사용자 포털 레이아웃 (사이드바, 헤더)
│   ├── page.tsx                   # 사용자 루트 페이지
│   ├── contents/
│   │   └── [id]/
│   │       └── page.tsx          # 콘텐츠 상세
│   └── collections/
│       ├── layout.tsx            # 컬렉션 레이아웃
│       ├── page.tsx              # 컬렉션 목록
│       └── [id]/
│           └── page.tsx          # 컬렉션 상세
│
├── (admin)/                   # 관리자 포털 라우트 그룹 (admin 경로)
│   ├── layout.tsx                 # 관리자 레이아웃 (관리자 사이드바, 헤더)
│   ├── dashboard/
│   │   └── page.tsx              # 관리자 대시보드
│   ├── contents/
│   │   ├── page.tsx              # 전체 콘텐츠 목록
│   │   └── [id]/
│   │       └── page.tsx          # 콘텐츠 상세 및 분석
│   ├── review/
│   │   ├── page.tsx              # 검토 대기 목록
│   │   └── [detectionId]/
│   │       └── page.tsx          # 발견 검토 상세
│   ├── users/
│   │   ├── page.tsx              # 회원 목록
│   │   └── [id]/
│   │       └── page.tsx          # 회원 상세
│   └── login/
│       └── page.tsx              # 관리자 로그인 페이지
│
└── api/                       # API 라우트
    ├── auth/
    │   ├── login/
    │   │   └── route.ts          # POST /api/auth/login
    │   ├── logout/
    │   │   └── route.ts          # POST /api/auth/logout
    │   ├── signup/
    │   │   └── route.ts          # POST /api/auth/signup
    │   ├── reset-password/
    │   │   └── route.ts          # POST /api/auth/reset-password
    │   ├── verify/
    │   │   └── route.ts          # GET /api/auth/verify (이메일 인증)
    │   ├── resend-verification/
    │   │   └── route.ts          # POST /api/auth/resend-verification
    │   └── me/
    │       └── route.ts          # GET /api/auth/me
    ├── contents/
    │   └── [id]/
    │       └── status/
    │           └── route.ts      # PATCH /api/contents/[id]/status
    ├── detected-contents/
    │   └── [id]/
    │       └── review/
    │           └── route.ts      # POST /api/detected-contents/[id]/review
    └── vision/
        ├── analyze/
        │   └── route.ts          # POST /api/vision/analyze
        └── redetect/
            └── route.ts          # POST /api/vision/redetect
```

---

## 4. components 디렉터리

재사용 가능한 React 컴포넌트 구성

```
components/
├── ui/                        # shadcn/ui 기본 컴포넌트
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── breadcrumb.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── collapsible.tsx
│   ├── context-menu.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── resizable.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   └── tooltip.tsx
├── auth/                      # 인증 관련 컴포넌트
│   ├── LoginForm.tsx         # 로그인 폼
│   ├── SignupForm.tsx        # 회원가입 폼
│   ├── ResetPasswordForm.tsx # 비밀번호 재설정 폼
│   └── index.ts              # Export 파일
├── admin/                     # 관리자 전용 컴포넌트
│   ├── contents/             # 콘텐츠 관리 컴포넌트
│   │   ├── AIAnalysisRequestModal.tsx  # AI 분석 요청 모달
│   │   ├── AnalysisStatusModal.tsx     # 분석 상태 모달
│   │   ├── ContentFilters.tsx          # 콘텐츠 필터
│   │   ├── ContentTableClient.tsx      # 콘텐츠 테이블 (클라이언트)
│   │   ├── DetectionTable.tsx          # 발견 테이블
│   │   ├── RedetectionModal.tsx        # 재검출 모달
│   │   └── ReviewStatusModal.tsx       # 검토 상태 모달
│   ├── dashboard/            # 대시보드 컴포넌트
│   │   ├── ActivityFeed.tsx            # 활동 피드
│   │   ├── DashboardStats.tsx          # 대시보드 통계
│   │   ├── PendingContentsCard.tsx     # 대기 콘텐츠 카드
│   │   ├── PendingUsersCard.tsx        # 대기 사용자 카드
│   │   └── StatsCard.tsx               # 통계 카드
│   ├── layout/               # 관리자 레이아웃 컴포넌트
│   │   ├── AdminContext.tsx            # 관리자 컨텍스트
│   │   ├── AdminHeader.tsx             # 관리자 헤더
│   │   └── AdminSidebar.tsx            # 관리자 사이드바
│   └── users/                # 회원 관리 컴포넌트
│       ├── UserActionButtons.tsx       # 회원 액션 버튼
│       ├── UserContentTable.tsx        # 회원 콘텐츠 테이블
│       ├── UserContentToolbar.tsx      # 회원 콘텐츠 툴바
│       ├── UserDetailCard.tsx          # 회원 상세 카드
│       ├── UserFilters.tsx             # 회원 필터
│       ├── UserTable.tsx               # 회원 테이블 (레거시)
│       └── UserTableClient.tsx         # 회원 테이블 (TanStack Table)
├── explorer/                  # 탐색기 컴포넌트
│   ├── ContentExplorerView.tsx  # 콘텐츠 탐색기 뷰
│   ├── ExplorerToolbar.tsx      # 탐색기 툴바
│   ├── Pagination.tsx           # 페이지네이션 (재사용)
│   ├── CollectionSelect.tsx     # 컬렉션 선택
│   ├── CreateCollectionModal.tsx # 컬렉션 생성 모달
│   ├── UploadModal.tsx          # 업로드 모달
│   ├── StatsCards.tsx           # 통계 카드
│   └── index.ts                 # Export 파일
├── layout/                    # 레이아웃 컴포넌트
│   ├── Container.tsx         # 컨테이너
│   ├── Footer.tsx            # 푸터
│   ├── FullHeightContainer.tsx # 전체 높이 컨테이너
│   ├── Header.tsx            # 헤더
│   └── PageContainer.tsx     # 페이지 컨테이너
└── common/                    # 공통 컴포넌트
    ├── ConfirmDialog.tsx     # 확인 대화상자
    ├── EmptyState.tsx        # 빈 상태
    ├── ImageViewer.tsx       # 이미지 뷰어
    ├── LoadingSpinner.tsx    # 로딩 스피너
    ├── MessageViewModal.tsx  # 메시지 보기 모달
    ├── Pagination.tsx        # 페이지네이션
    └── SearchInput.tsx       # 검색 입력
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
│   └── middleware.ts         # 미들웨어 헬퍼 함수
├── api/                       # API 클라이언트
│   ├── collections.ts        # 컬렉션 API (BrowserClient)
│   ├── contents.ts           # 콘텐츠 API (BrowserClient)
│   ├── dashboard.ts          # 대시보드 API (BrowserClient)
│   ├── detections.ts         # 발견 API (BrowserClient)
│   └── users.ts              # 사용자 API (BrowserClient)
├── constants/                 # 전역 상수 정의
│   ├── externalLinks.ts      # 외부 링크 상수 (개인정보처리방침, 이용약관 등)
│   └── index.ts              # Export 파일
├── admin/                     # 관리자 관련 로직
│   ├── types.ts              # 관리자 타입 정의
│   └── store.ts              # 관리자 상태 관리
├── stores/                    # 전역 상태 관리
│   ├── authStore.ts          # 인증 상태
│   ├── contentStore.ts       # 콘텐츠 상태
│   └── explorerStore.ts      # 탐색기 상태
├── google-vision/             # Google Vision API 연동
│   └── client.ts             # Vision API 클라이언트
├── utils/                     # 유틸리티 함수
│   ├── errors.ts             # 에러 처리 유틸리티
│   └── validation.ts         # 유효성 검증 유틸리티
└── utils.ts                   # 공통 유틸리티 함수
```

---

## 6. 기타 디렉터리

### 6.1 hooks 디렉터리

```
hooks/
└── use-toast.ts              # Toast 훅 (shadcn/ui)
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
└── components/               # 컴포넌트별 스타일 (현재 비어있음)
```

### 6.4 public 디렉터리

```
public/
├── images/                   # 이미지 파일
├── fonts/                    # 커스텀 폰트
└── icons/                    # 아이콘
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

_이 문서는 UTRBOX 프로젝트의 폴더 구조를 정의합니다. 새로운 기능 추가 시 이 구조를 참고하여 일관성을 유지해야 합니다._