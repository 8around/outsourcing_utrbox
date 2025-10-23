# UTRBOX 콘텐츠 저작권 관리 시스템 PRD

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [기능 요구사항](#3-기능-요구사항)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [API 및 외부 연동](#5-api-및-외부-연동)
6. [UI/UX 요구사항](#6-uiux-요구사항)
7. [보안 요구사항](#7-보안-요구사항)
8. [배포 및 운영](#8-배포-및-운영)
9. [개발 일정](#9-개발-일정)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보
- **프로젝트명**: UTRBOX 콘텐츠 저작권 관리 시스템
- **버전**: 1.0.0
- **작성일**: 2025-10-23

### 1.2 비전 및 목표
사용자가 업로드한 이미지 콘텐츠의 저작권을 보호하고, AI 기반 유사 콘텐츠 탐지를 통해 효율적인 저작권 관리 체계를 구축합니다.

### 1.3 핵심 기능
- **콘텐츠 업로드 및 관리**: 이미지 업로드, 컬렉션 관리
- **AI 기반 분석**: Google Vision API를 활용한 유사 콘텐츠 탐지
- **관리자 검토 시스템**: 발견된 콘텐츠의 일치/불일치 판정
- **회원 관리**: 승인 기반 회원 시스템

### 1.4 사용자 유형
- **일반 사용자(Member)**: 콘텐츠 업로드 및 관리, 분석 결과 확인
- **관리자(Admin)**: 회원 관리, 콘텐츠 검토, AI 분석 관리

---

## 2. 기술 스택 및 아키텍처

### 2.1 핵심 기술 스택
#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Form Handling**: React Hook Form + Zod

#### Backend
- **Runtime**: Node.js 20.x LTS
- **API Routes**: Next.js API Routes
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **External API**: Google Cloud Vision API

#### Deployment & Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Environment**: Production, Staging, Development

### 2.2 시스템 아키텍처
```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│                                                      │
│  ┌──────────────┐        ┌──────────────┐          │
│  │ User Portal  │        │ Admin Portal │          │
│  └──────────────┘        └──────────────┘          │
└─────────────────────────────────────────────────────┘
                           │
                    Vercel Edge Network
                           │
┌─────────────────────────────────────────────────────┐
│                Next.js 14 Application                │
│                                                      │
│  ┌──────────────────────────────────────┐          │
│  │          App Router                   │          │
│  ├──────────────────────────────────────┤          │
│  │          API Routes                   │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
┌───────────────┐                     ┌───────────────┐
│   Supabase    │                     │ Google Cloud  │
│               │                     │ Vision API    │
│ - Auth        │                     │               │
│ - Database    │                     │ - Label       │
│ - Storage     │                     │ - Text        │
│ - Realtime    │                     │ - Web         │
└───────────────┘                     └───────────────┘
```

### 2.3 프로젝트 구조

Next.js 14 App Router 기반의 모듈화된 프로젝트 구조를 채택하여 확장성과 유지보수성을 확보합니다.

상세한 프로젝트 폴더 구조는 [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) 문서를 참조하세요.

#### 주요 디렉터리 구성
- `app/`: Next.js 14 App Router (페이지, API 라우트)
- `components/`: 재사용 가능한 React 컴포넌트
- `lib/`: 비즈니스 로직 및 외부 서비스 연동
- `hooks/`: 커스텀 React 훅
- `types/`: TypeScript 타입 정의

---

## 3. 기능 요구사항

### 3.1 사용자 포털 (User Portal)

#### 3.1.1 인증 및 계정 관리
- **회원가입**
  - 이메일, 비밀번호, 이름, 소속 정보 입력
  - 이메일 중복 확인
  - 관리자 승인 대기 상태로 등록
  - 승인 대기 안내 메시지 표시

- **로그인**
  - 이메일/비밀번호 인증
  - 승인된 계정만 접근 허용
  - 세션 관리 (JWT 토큰 기반)
  - Remember Me 옵션

- **비밀번호 찾기**
  - 이메일 인증 기반
  - 임시 비밀번호 발송 또는 재설정 링크

#### 3.1.2 콘텐츠 관리
- **콘텐츠 업로드**
  - 지원 형식: JPG, PNG
  - 최대 파일 크기: 10MB
  - 드래그 앤 드롭 지원
  - 다중 파일 업로드
  - 업로드 진행률 표시
  - 컬렉션 선택 옵션

- **콘텐츠 리스트**
  - 그리드/리스트 뷰 전환
  - 썸네일 미리보기
  - 정렬: 업로드일, 이름, 감지 건수
  - 필터: 상태, 날짜 범위, 컬렉션
  - 페이지네이션 (20개/페이지)
  - 검색: 파일명, 설명

- **콘텐츠 상세**
  - 원본 이미지 표시
  - 메타데이터: 크기, 형식, 업로드일
  - AI 분석 상태
  - 발견된 유사 콘텐츠 리스트
  - 다운로드 기능

#### 3.1.3 컬렉션 관리
- **컬렉션 CRUD**
  - 컬렉션 생성: 이름
  - 컬렉션 수정: 이름 변경
  - 컬렉션 삭제: 확인 모달 (포함된 콘텐츠 삭제 경고)
  - 컬렉션 공유: 링크 생성

- **컬렉션 구조**
  - 2계층 구조 (컬렉션 > 콘텐츠)
  - 파일 탐색기 UI
  - 폴더 아이콘으로 컬렉션 표시
  - 콘텐츠 이동 기능

#### 3.1.4 발견 결과 확인
- **발견 콘텐츠 리스트**
  - 관리자가 '일치'로 판정한 콘텐츠만 표시
  - 유사도 점수 표시
  - 발견 날짜 표시
  - 원본과 비교 보기

### 3.2 관리자 포털 (Admin Portal)

#### 3.2.1 관리자 인증
- **관리자 로그인**
  - 별도 로그인 페이지
  - 2FA 인증 (선택사항)
  - IP 기반 접근 제한
  - 로그인 시도 제한 (5회)

#### 3.2.2 회원 관리
- **회원 리스트**
  - 전체 회원 조회
  - 정렬: 가입일, 이름, 이메일
  - 필터: 상태(승인/대기/차단), 역할
  - 검색: 이메일, 이름, 소속
  - 일괄 작업: 승인, 차단

- **회원 상세**
  - 회원 정보 조회/수정
  - 권한 변경 (Member ↔ Admin)
  - 계정 활성화/비활성화
  - 활동 로그 조회
  - 업로드한 콘텐츠 목록

#### 3.2.3 콘텐츠 검토
- **콘텐츠 관리**
  - 전체 콘텐츠 조회
  - 업로더별 필터링
  - 상태별 필터링 (검토 대기/완료)
  - 일괄 삭제
  - 콘텐츠 통계 대시보드

- **AI 분석 실행**
  - 개별/일괄 분석 실행
  - Google Vision API 호출
  - 분석 상태 실시간 업데이트
  - 분석 결과 자동 저장
  - 재분석 기능

#### 3.2.4 비교 검토
- **비교 모달**
  - 좌우 분할 화면 (원본/발견)
  - 이미지 확대/축소
  - 이미지 동기화 스크롤
  - 메타데이터 표시

- **판정 시스템**
  - 일치: 저작권 침해 확인
  - 불일치: 오탐지
  - 비교 불가: 판단 보류
  - 판정 이력 관리
  - 판정 사유 메모

#### 3.2.5 대시보드
- **통계**
  - 총 콘텐츠 수
  - 일일 업로드 수
  - 발견 건수 추이
  - 일치율 통계
  - 사용자 활동 통계

- **실시간 모니터링**
  - 최근 업로드
  - 진행 중인 분석
  - 대기 중인 검토
  - 시스템 상태

---

## 4. 데이터베이스 설계

PostgreSQL 기반의 Supabase를 활용하여 확장 가능하고 안전한 데이터베이스를 구성합니다.

상세한 데이터베이스 스키마, 테이블 구조, RLS 정책, 인덱스 설계 등은 [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) 문서를 참조하세요.

### 4.1 주요 테이블
- **users**: 사용자 계정 정보
- **collections**: 콘텐츠 그룹화를 위한 컬렉션
- **contents**: 업로드된 원본 콘텐츠
- **analysis_results**: Google Vision API 분석 결과
- **detected_contents**: 발견된 유사/일치 콘텐츠
- **activity_logs**: 사용자 활동 로그

### 4.2 보안 정책
- Row Level Security (RLS) 적용
- 역할 기반 접근 제어
- 민감 데이터 암호화

---

## 5. API 및 외부 연동

### 5.1 Google Cloud Vision API

#### 5.1.1 API 기능
- **LABEL_DETECTION**: 이미지 내 객체, 장면, 활동 감지
- **TEXT_DETECTION**: 이미지 내 텍스트 추출
- **WEB_DETECTION**: 웹상의 유사 이미지 검색
  - fullMatchingImages: 완전 일치 이미지
  - partialMatchingImages: 부분 일치 이미지
  - visuallySimilarImages: 시각적 유사 이미지

#### 5.1.2 API 호출 전략
- 첫 요청: 라벨, 텍스트, 웹 탐지 일괄 요청
- 이후 요청: 각 기능 독립적 요청
- 중복 제거: 기존 URL과 다른 결과만 저장
- 에러 처리: 재시도 로직 (3회, exponential backoff)

### 5.2 내부 API 엔드포인트

#### 인증 관련
```
POST   /api/auth/signup       # 회원가입
POST   /api/auth/login        # 로그인
POST   /api/auth/logout       # 로그아웃
POST   /api/auth/reset        # 비밀번호 재설정
GET    /api/auth/me           # 현재 사용자 정보
```

#### 콘텐츠 관련
```
GET    /api/contents          # 콘텐츠 목록
POST   /api/contents          # 콘텐츠 업로드
GET    /api/contents/:id      # 콘텐츠 상세
PUT    /api/contents/:id      # 콘텐츠 수정
DELETE /api/contents/:id      # 콘텐츠 삭제
```

#### 분석 관련
```
POST   /api/analysis/start    # 분석 시작
GET    /api/analysis/:id      # 분석 결과 조회
POST   /api/analysis/batch    # 일괄 분석
```

#### 관리자 관련
```
GET    /api/admin/users       # 회원 목록
PUT    /api/admin/users/:id   # 회원 정보 수정
POST   /api/admin/review      # 검토 결과 저장
GET    /api/admin/stats       # 통계 조회
```

---

## 6. UI/UX 요구사항

### 6.1 디자인 시스템
- **Color Scheme**
  - Primary: Blue (#3B82F6)
  - Secondary: Gray (#6B7280)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)

- **Typography**
  - Font: Inter (Latin), Noto Sans KR (Korean)
  - Headings: 32px, 24px, 20px, 16px
  - Body: 14px, 12px

- **Spacing**: 4px 기반 그리드 시스템

### 6.2 반응형 디자인
- **Breakpoints**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### 6.3 성능 최적화
- 이미지 레이지 로딩
- 무한 스크롤 (콘텐츠 리스트)
- 코드 스플리팅
- 프리페칭

---

## 7. 보안 요구사항

### 7.1 인증 및 권한
- JWT 기반 인증
- Role-based Access Control (RBAC)

### 7.2 파일 업로드 보안
- 파일 타입 검증
- 파일 크기 제한
- 안전한 파일명 처리

### 7.3 API 보안
- Rate Limiting
- API Key 관리
- Request 검증
- Error 메시지 최소화

---

## 8. 배포 및 운영

### 8.1 환경 구성
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경 (Vercel Preview)
- **Production**: 운영 환경 (Vercel Production)

### 8.2 환경 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=
JWT_SECRET=
```

---

## 9. 참고사항

### 9.1 제약사항
- Google Cloud Vision API 일일 호출 제한
- Supabase 무료 플랜 제한 (Storage 1GB, Database 500MB)
- Vercel 무료 플랜 제한 (Serverless Function 실행 시간)

### 9.2 기술 지원
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Google Cloud Vision API: https://cloud.google.com/vision/docs
- Vercel Documentation: https://vercel.com/docs

---

_이 문서는 UTRBOX 콘텐츠 저작권 관리 시스템의 개발 요구사항을 정의합니다. 개발 진행 중 변경사항이 발생할 경우 문서를 업데이트하여 최신 상태를 유지해야 합니다._