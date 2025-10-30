# UTRBOX 데이터베이스 스키마 설계 (최종 최적화 버전)

## 📋 목차
1. [데이터베이스 개요](#1-데이터베이스-개요)
2. [테이블 구조](#2-테이블-구조)
3. [인덱스 설계](#3-인덱스-설계)
4. [Supabase RLS 정책](#4-supabase-rls-정책)
5. [트리거 및 함수](#5-트리거-및-함수)
6. [Supabase Storage 설정](#6-supabase-storage-설정)

---

## 1. 데이터베이스 개요

### 1.1 기술 스택
- **Database**: PostgreSQL 15+ (Supabase)
- **Authentication**: Supabase Auth (auth.users 테이블 활용)
- **Storage**: Supabase Storage (이미지 파일 관리)
- **Query Client**: Supabase Client (JavaScript/TypeScript)
- **Migration Tool**: Supabase CLI

### 1.2 명명 규칙
- **테이블명**: 복수형, snake_case (예: `users`, `contents`)
- **컬럼명**: snake_case (예: `created_at`, `file_name`)
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `테이블명_id` (예: `user_id`, `content_id`)
- **인덱스**: `idx_테이블명_컬럼명` (예: `idx_contents_user_id`)

### 1.3 설계 원칙
- **PRD 요구사항 충족**: 명시된 기능만 구현
- **오버스펙 제거**: 불필요한 컬럼, 테이블, 트리거 삭제
- **Supabase 기능 활용**: Auth, Storage 기능에 위임
- **성능 최적화**: 필요한 인덱스만 생성, JSONB 활용

---

## 2. 테이블 구조

### 2.1 users (사용자 프로필)
Supabase Auth와 연동하여 사용자 프로필 정보만 관리

```sql
CREATE TABLE public.users (
  -- Primary Key (Supabase Auth 참조)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  name TEXT NOT NULL,
  email TEXT,  -- auth.users의 email 복사 (쿼리 성능 향상)
  organization TEXT,

  -- Authorization
  role TEXT CHECK (role IN ('member', 'admin')) DEFAULT 'member',
  is_approved BOOLEAN,  -- NULL: 대기, TRUE: 승인, FALSE: 거부

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.users IS '사용자 프로필 정보 (인증은 auth.users 활용)';
COMMENT ON COLUMN public.users.id IS 'auth.users.id 참조';
COMMENT ON COLUMN public.users.email IS '사용자 이메일 (auth.users에서 복사)';
COMMENT ON COLUMN public.users.is_approved IS 'NULL: 승인 대기, TRUE: 승인, FALSE: 거부';
COMMENT ON COLUMN public.users.role IS 'member: 일반 사용자, admin: 관리자';
```

### 2.2 collections (컬렉션)
콘텐츠를 그룹화하는 컬렉션 테이블

```sql
CREATE TABLE public.collections (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Collection Info
  name TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraints
ALTER TABLE public.collections
  ADD CONSTRAINT unique_user_collection_name
  UNIQUE (user_id, name);

-- Comments
COMMENT ON TABLE public.collections IS '콘텐츠 그룹화 컬렉션';
COMMENT ON CONSTRAINT unique_user_collection_name ON public.collections IS '사용자별 컬렉션명 중복 방지';
```

### 2.3 contents (원본 콘텐츠 + AI 분석 결과)
업로드된 원본 콘텐츠 정보 및 AI 분석 결과 통합 관리

```sql
CREATE TABLE public.contents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,

  -- 파일 정보
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,  -- Supabase Storage 경로

  -- 분석 상태
  is_analyzed BOOLEAN,  -- NULL: 대기, FALSE: 분석중, TRUE: 완료
  message TEXT,         -- 사용자 전달 메시지 또는 에러 메시지

  -- AI 분석 결과 (LABEL, TEXT)
  label_data JSONB,     -- LABEL_DETECTION 원본 응답
  text_data JSONB,      -- TEXT_DETECTION 원본 응답

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.contents IS '업로드된 원본 콘텐츠 및 AI 분석 결과';
COMMENT ON COLUMN public.contents.file_path IS 'Supabase Storage 경로 (파일 크기, MIME type은 Storage에서 관리)';
COMMENT ON COLUMN public.contents.is_analyzed IS 'NULL: 분석 대기, FALSE: 분석 중, TRUE: 분석 완료';
COMMENT ON COLUMN public.contents.message IS '사용자 전달 메시지 또는 에러 메시지';
COMMENT ON COLUMN public.contents.label_data IS 'Google Vision API LABEL_DETECTION 원본 응답 (JSONB)';
COMMENT ON COLUMN public.contents.text_data IS 'Google Vision API TEXT_DETECTION 원본 응답 (JSONB)';

-- 상태 구분 예시:
-- NULL + NULL = 분석 대기
-- FALSE + NULL = 분석 중
-- TRUE + NULL = 분석 완료 (메시지 없음)
-- TRUE + "메시지" = 분석 완료 + 사용자 전달 메시지
-- FALSE + "메시지" = 분석 실패 + 에러 메시지
```

### 2.4 detected_contents (발견된 콘텐츠)
AI가 발견한 유사/일치 콘텐츠 정보 테이블 (WEB_DETECTION 결과)

```sql
CREATE TABLE public.detected_contents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,

  -- Detection Source (WEB_DETECTION 결과)
  source_url TEXT,
  image_url TEXT NOT NULL,
  page_title TEXT,
  detection_type TEXT CHECK (detection_type IN ('full', 'partial', 'similar')) NOT NULL,

  -- Admin Review
  admin_review_status TEXT CHECK (admin_review_status IN ('pending', 'match', 'no_match', 'cannot_compare')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.detected_contents IS 'AI가 발견한 유사/일치 콘텐츠 (WEB_DETECTION 결과)';
COMMENT ON COLUMN public.detected_contents.detection_type IS 'full: 완전일치, partial: 부분일치, similar: 시각적유사';
COMMENT ON COLUMN public.detected_contents.admin_review_status IS 'pending: 검토대기, match: 일치, no_match: 불일치, cannot_compare: 비교불가';
COMMENT ON COLUMN public.detected_contents.source_url IS '발견된 페이지 URL (없을 수 있음)';
COMMENT ON COLUMN public.detected_contents.image_url IS '발견된 이미지 URL (필수)';
```

---

## 3. 인덱스 설계

### 3.1 users 테이블 인덱스

```sql
-- 기본 인덱스
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_approved ON public.users(is_approved);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_users_email ON public.users(email);  -- 이메일 검색 성능 향상
```

### 3.2 collections 테이블 인덱스

```sql
-- 기본 인덱스
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_created_at ON public.collections(created_at DESC);
```

### 3.3 contents 테이블 인덱스

```sql
-- Foreign Key 인덱스
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_collection_id ON public.contents(collection_id);

-- 상태 인덱스
CREATE INDEX idx_contents_is_analyzed ON public.contents(is_analyzed);

-- 시간 인덱스
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);

-- 복합 인덱스 (성능 최적화)
CREATE INDEX idx_contents_user_analyzed ON public.contents(user_id, is_analyzed);
CREATE INDEX idx_contents_collection_analyzed ON public.contents(collection_id, is_analyzed);

-- 부분 인덱스 (조건부, 분석 대기 중인 콘텐츠만)
CREATE INDEX idx_contents_pending ON public.contents(created_at DESC)
  WHERE is_analyzed IS NULL;
```

### 3.4 detected_contents 테이블 인덱스

```sql
-- Foreign Key 인덱스
CREATE INDEX idx_detected_contents_content_id ON public.detected_contents(content_id);
CREATE INDEX idx_detected_contents_reviewed_by ON public.detected_contents(reviewed_by);

-- 상태 인덱스
CREATE INDEX idx_detected_contents_review_status ON public.detected_contents(admin_review_status);
CREATE INDEX idx_detected_contents_detection_type ON public.detected_contents(detection_type);

-- 시간 인덱스
CREATE INDEX idx_detected_contents_created_at ON public.detected_contents(created_at DESC);

-- 복합 인덱스 (성능 최적화)
CREATE INDEX idx_detected_contents_content_status ON public.detected_contents(content_id, admin_review_status);

-- 부분 인덱스 (조건부, 검토 대기 중인 콘텐츠만)
CREATE INDEX idx_detected_contents_pending ON public.detected_contents(created_at DESC)
  WHERE admin_review_status = 'pending';

CREATE INDEX idx_detected_contents_reviewed_at ON public.detected_contents(reviewed_at)
  WHERE reviewed_at IS NOT NULL;
```

### 3.5 인덱스 전략 설명

| 인덱스 타입 | 목적 | 예시 |
|-----------|------|------|
| **단일 컬럼 인덱스** | 자주 검색/필터링되는 컬럼 | `idx_contents_user_id` |
| **복합 인덱스** | 함께 사용되는 컬럼 조합 | `idx_contents_user_analyzed` |
| **부분 인덱스** | 특정 조건의 행만 인덱싱 | `WHERE is_analyzed IS NULL` |

### 3.6 인덱스 관리 쿼리

```sql
-- 인덱스 사용 통계 확인
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- 사용되지 않는 인덱스 확인
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 4. Supabase RLS 정책

### 4.1 헬퍼 함수

```sql
-- 현재 사용자가 승인된 관리자인지 확인
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = TRUE
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 현재 사용자가 승인된 사용자인지 확인
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_approved = TRUE
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;
```

### 4.2 users 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능 (role, is_approved 제외)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_approved = (SELECT is_approved FROM public.users WHERE id = auth.uid())
  );

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (public.is_admin());

-- 관리자는 모든 사용자 수정 가능
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin());

-- 관리자는 사용자 삭제 가능 (자기 자신 제외)
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() != id
    AND public.is_admin()
  );
```

### 4.3 collections 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 승인된 사용자만 조회 가능 (자신의 컬렉션)
CREATE POLICY "Approved users can view own collections"
  ON public.collections
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- 승인된 사용자만 생성 가능
CREATE POLICY "Approved users can create collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- 사용자는 자신의 컬렉션만 수정 가능
CREATE POLICY "Users can update own collections"
  ON public.collections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 컬렉션만 삭제 가능
CREATE POLICY "Users can delete own collections"
  ON public.collections
  FOR DELETE
  USING (auth.uid() = user_id);

-- 관리자는 모든 컬렉션 관리 가능
CREATE POLICY "Admins can manage all collections"
  ON public.collections
  FOR ALL
  USING (public.is_admin());
```

### 4.4 contents 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 승인된 사용자만 조회 가능 (자신의 콘텐츠)
CREATE POLICY "Approved users can view own contents"
  ON public.contents
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- 승인된 사용자만 업로드 가능
CREATE POLICY "Approved users can upload contents"
  ON public.contents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- 사용자는 자신의 콘텐츠만 수정 가능
CREATE POLICY "Users can update own contents"
  ON public.contents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 콘텐츠만 삭제 가능
CREATE POLICY "Users can delete own contents"
  ON public.contents
  FOR DELETE
  USING (auth.uid() = user_id);

-- 관리자는 모든 콘텐츠 관리 가능
CREATE POLICY "Admins can manage all contents"
  ON public.contents
  FOR ALL
  USING (public.is_admin());
```

### 4.5 detected_contents 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.detected_contents ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 콘텐츠의 '일치' 판정된 발견 내용만 조회 가능
CREATE POLICY "Users can view matched detections"
  ON public.detected_contents
  FOR SELECT
  USING (
    admin_review_status = 'match'
    AND EXISTS (
      SELECT 1 FROM public.contents
      WHERE contents.id = detected_contents.content_id
      AND contents.user_id = auth.uid()
    )
  );

-- 관리자는 모든 발견 내용 조회 가능
CREATE POLICY "Admins can view all detections"
  ON public.detected_contents
  FOR SELECT
  USING (public.is_admin());

-- 관리자만 발견 내용 수정 가능 (검토 결과 등록)
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (public.is_admin());

-- 시스템(서버)만 발견 내용 생성 가능 (서비스 역할 키 사용)
-- 일반 사용자는 INSERT 불가

-- 관리자는 발견 내용 삭제 가능
CREATE POLICY "Admins can delete detections"
  ON public.detected_contents
  FOR DELETE
  USING (public.is_admin());
```

---

## 5. 트리거 및 함수

### 5.1 자동 업데이트 트리거

```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- collections 테이블 updated_at 트리거
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- contents 테이블 updated_at 트리거
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 트리거 관리

```sql
-- 트리거 비활성화 (대량 작업 시)
ALTER TABLE public.contents DISABLE TRIGGER update_contents_updated_at;

-- 트리거 재활성화
ALTER TABLE public.contents ENABLE TRIGGER update_contents_updated_at;

-- 트리거 목록 확인
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 6. Supabase Storage 설정

### 6.1 버킷 생성

```javascript
// Supabase Dashboard에서 생성
// 또는 Supabase Client로 생성
const { data, error } = await supabase.storage.createBucket('contents', {
  public: false,  // Private 버킷 (RLS 기반 접근 제어)
  fileSizeLimit: 10485760,  // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
});
```

### 6.2 Storage RLS 정책

```sql
-- 승인된 사용자만 자신의 파일 업로드 가능
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.is_approved_user()
  );

-- 승인된 사용자만 자신의 파일 조회 가능
CREATE POLICY "Users can view own images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 승인된 사용자만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 관리자는 모든 파일 관리 가능
CREATE POLICY "Admins can manage all images"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contents'
    AND public.is_admin()
  );
```

### 6.3 파일 업로드 예시

```typescript
// 파일 업로드 (userId 폴더에 저장)
const userId = user.id;
const fileName = `${Date.now()}_${file.name}`;
const filePath = `${userId}/${fileName}`;

const { data, error } = await supabase.storage
  .from('contents')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

// DB에 메타데이터 저장
if (!error) {
  const { error: dbError } = await supabase
    .from('contents')
    .insert({
      user_id: userId,
      collection_id: collectionId,
      file_name: file.name,
      file_path: filePath,
      is_analyzed: null  // 분석 대기
    });
}
```

### 6.4 Google Vision API 호출 시 URL 사용

```typescript
// Supabase Storage publicUrl 생성 (서명된 URL)
const { data: { publicUrl } } = supabase.storage
  .from('contents')
  .getPublicUrl(filePath);

// Google Vision API 호출 (Image URL 방식)
const visionRequest = {
  requests: [
    {
      image: {
        source: {
          imageUri: publicUrl  // Supabase Storage URL
        }
      },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'WEB_DETECTION', maxResults: 30 }
      ]
    }
  ]
};
```

### 6.5 허용 MIME Types

**Supabase Storage 버킷 정책:**
- `image/jpeg` (JPG, JPEG)
- `image/png` (PNG)
- `image/webp` (WEBP)

**Google Vision API 지원 형식:**
- JPEG, PNG, WEBP (publicUrl로 직접 요청 가능)

---

_이 문서는 UTRBOX 시스템의 최종 최적화된 데이터베이스 스키마를 정의합니다._

**최종 수정일**: 2025-10-24
**스키마 버전**: 3.0 (최종 최적화 버전)
**Supabase Auth 연동**: 필수
**Supabase Storage 활용**: 필수
