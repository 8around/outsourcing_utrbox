# UTRBOX 프로젝트 초기화 계획서

**작성일**: 2025-10-23
**작업 번호**: Task #1
**목적**: Next.js 14 기반 프로젝트 환경 구성 및 필수 라이브러리 설치

---

## 1. 개요

UTRBOX 프로젝트의 기본 환경을 구성합니다. Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, shadcn/ui, Supabase 클라이언트를 포함한 필수 라이브러리를 설치하고 프로젝트 구조를 생성합니다.

---

## 2. 기술 스택 요구사항

### 2.1 코어 프레임워크
- **Next.js**: 14.x (App Router)
- **React**: 18.x
- **TypeScript**: 5.x
- **Node.js**: 18.x 이상

### 2.2 스타일링
- **Tailwind CSS**: 3.x
- **PostCSS**: 최신 안정 버전
- **shadcn/ui**: 최신 버전 (Radix UI 기반)

### 2.3 상태 관리
- **Zustand**: 4.x

### 2.4 폼 처리 및 검증
- **React Hook Form**: 7.x
- **Zod**: 3.x

### 2.5 백엔드 연동
- **Supabase JS Client**: 2.x

### 2.6 개발 도구
- **ESLint**: Next.js 기본 설정
- **Prettier**: 코드 포맷팅
- **TypeScript ESLint**: 타입 체크

---

## 3. 실행 계획

### 3.1 Next.js 프로젝트 초기화

```bash
# Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind CSS, ESLint 포함)
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*"
```

**옵션 설명**:
- `--typescript`: TypeScript 활성화
- `--tailwind`: Tailwind CSS 설정 포함
- `--app`: App Router 사용
- `--eslint`: ESLint 설정 포함
- `--no-src-dir`: src 디렉터리 없이 루트에 app 폴더 생성
- `--import-alias "@/*"`: 절대 경로 import 별칭 설정

### 3.2 필수 라이브러리 설치

#### 상태 관리
```bash
npm install zustand
```

#### 폼 처리 및 검증
```bash
npm install react-hook-form zod @hookform/resolvers
```

#### Supabase 클라이언트
```bash
npm install @supabase/supabase-js
```

#### shadcn/ui 초기화
```bash
npx shadcn@latest init
```

**shadcn/ui 설정**:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: tailwind.config.ts
- Components location: components/ui
- Utils location: lib/utils.ts

#### shadcn/ui 기본 컴포넌트 설치
```bash
npx shadcn@latest add button card input label select form dialog dropdown-menu table tabs toast
```

#### 개발 도구
```bash
npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
```

### 3.3 환경 변수 설정

`.env.local` 파일 생성:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Vision API
GOOGLE_VISION_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**주의사항**:
- 실제 키 값은 개발자로부터 전달받아야 함
- `.env.local`은 `.gitignore`에 포함되어야 함
- 프로덕션 환경에서는 Vercel 환경 변수 사용

### 3.4 폴더 구조 생성

`FOLDER_STRUCTURE.md`에 정의된 구조에 따라 기본 디렉터리 생성:

```bash
# 기본 디렉터리 생성
mkdir -p components/ui
mkdir -p components/auth
mkdir -p components/content
mkdir -p components/admin
mkdir -p components/layout
mkdir -p components/common
mkdir -p components/providers
mkdir -p lib/supabase
mkdir -p lib/google-vision
mkdir -p lib/api
mkdir -p lib/utils
mkdir -p lib/validators
mkdir -p lib/constants
mkdir -p hooks
mkdir -p types
mkdir -p styles
mkdir -p public/images
mkdir -p public/fonts
mkdir -p public/icons
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p scripts
```

### 3.5 설정 파일 생성

#### Prettier 설정 (`.prettierrc`)
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### TypeScript 경로 별칭 설정 (`tsconfig.json` 수정)
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

---

## 4. 검증 계획

### 4.1 빌드 테스트
```bash
npm run build
```
- 빌드 오류 없이 완료되어야 함
- `.next` 폴더 생성 확인

### 4.2 개발 서버 실행
```bash
npm run dev
```
- `http://localhost:3000` 접속 시 Next.js 기본 페이지 렌더링 확인

### 4.3 TypeScript 타입 체크
```bash
npm run build
```
- TypeScript 타입 오류 없음 확인

### 4.4 환경 변수 확인
- `.env.local` 파일 존재 확인
- 환경 변수가 정상적으로 읽히는지 확인 (콘솔 로그 테스트)

---

## 5. 주의사항

### 5.1 기존 파일 보존
- `.git` 디렉터리는 보존
- `PRD.md`, `DATABASE_SCHEMA.md`, `FOLDER_STRUCTURE.md` 문서 보존
- `.taskmaster` 디렉터리 보존
- `.mcp.json`, `CLAUDE.md` 보존

### 5.2 Next.js 초기화 충돌 방지
- 현재 디렉터리에 파일이 있으므로 `create-next-app` 실행 시 주의
- 필요시 임시 디렉터리에서 생성 후 병합

### 5.3 의존성 버전 관리
- `package.json`에 명시된 버전 준수
- 보안 취약점 있는 패키지는 최신 패치 버전 사용

---

## 6. 예상 결과물

### 6.1 생성될 파일
- `package.json` - 프로젝트 의존성 및 스크립트
- `tsconfig.json` - TypeScript 설정
- `tailwind.config.ts` - Tailwind CSS 설정
- `next.config.js` - Next.js 설정
- `postcss.config.js` - PostCSS 설정
- `.eslintrc.json` - ESLint 설정
- `.prettierrc` - Prettier 설정
- `.env.local` - 환경 변수 (Git 제외)
- `app/layout.tsx` - 루트 레이아웃
- `app/page.tsx` - 홈페이지
- `app/globals.css` - 전역 스타일
- `components/ui/*` - shadcn/ui 컴포넌트들

### 6.2 생성될 디렉터리
- `app/` - Next.js App Router 디렉터리
- `components/` - 재사용 컴포넌트
- `lib/` - 비즈니스 로직 및 유틸리티
- `hooks/` - 커스텀 React 훅
- `types/` - TypeScript 타입 정의
- `public/` - 정적 파일
- `styles/` - 스타일 파일
- `tests/` - 테스트 파일

---

## 7. 다음 단계

이 태스크 완료 후:
1. Supabase 클라이언트 설정 (Task #2)
2. 인증 시스템 구현 (Task #3)
3. 데이터베이스 스키마 적용 (Task #4)

---

## 8. 참고 문서

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Supabase JS Client Documentation](https://supabase.com/docs/reference/javascript)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

---

_이 계획서는 UTRBOX 프로젝트 초기화를 위한 상세 가이드입니다._
