# UTRBOX 데이터베이스 스키마 설계

## 📋 목차
1. [데이터베이스 개요](#1-데이터베이스-개요)
2. [테이블 구조](#2-테이블-구조)
3. [Supabase RLS 정책](#3-supabase-rls-정책)
4. [인덱스 설계](#4-인덱스-설계)
5. [트리거 및 함수](#5-트리거-및-함수)
6. [데이터 마이그레이션](#6-데이터-마이그레이션)

---

## 1. 데이터베이스 개요

### 1.1 기술 스택
- **Database**: PostgreSQL 15+ (Supabase)
- **ORM/Query Builder**: Supabase Client
- **Migration Tool**: Supabase CLI
- **Backup**: Supabase 자동 백업 (Point-in-time Recovery)

### 1.2 명명 규칙
- **테이블명**: 복수형, snake_case (예: `users`, `contents`)
- **컬럼명**: snake_case (예: `created_at`, `file_name`)
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `테이블명_id` (예: `user_id`, `content_id`)
- **인덱스**: `idx_테이블명_컬럼명` (예: `idx_contents_user_id`)

---

## 2. 테이블 구조

### 2.1 users (사용자)
사용자 계정 정보를 저장하는 테이블

```sql
CREATE TABLE public.users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Profile
  name TEXT NOT NULL,
  organization TEXT,

  -- Authorization
  role TEXT CHECK (role IN ('member', 'admin')) DEFAULT 'member',
  status TEXT CHECK (status IN ('pending', 'approved', 'blocked')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
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
  description TEXT,

  -- Statistics
  content_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_created_at ON public.collections(created_at DESC);

-- Constraints
ALTER TABLE public.collections
  ADD CONSTRAINT unique_user_collection_name
  UNIQUE (user_id, name);
```

### 2.3 contents (원본 콘텐츠)
업로드된 원본 콘텐츠 정보 테이블

```sql
CREATE TABLE public.contents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,

  -- File Information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png')),

  -- Processing Status
  status TEXT CHECK (status IN ('pending', 'analyzing', 'analyzed', 'error')) DEFAULT 'pending',
  error_message TEXT,

  -- Detection Statistics
  detection_count INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,

  -- Image Metadata
  width INTEGER,
  height INTEGER,

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_collection_id ON public.contents(collection_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX idx_contents_file_name ON public.contents(file_name);
```

### 2.4 analysis_results (AI 분석 결과)
Google Vision API 분석 결과 저장 테이블

```sql
CREATE TABLE public.analysis_results (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,

  -- Analysis Type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('label', 'text', 'web')),

  -- API Response
  raw_response JSONB NOT NULL,
  processed_data JSONB,

  -- Processing Info
  processing_time_ms INTEGER,
  api_version TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analysis_results_content_id ON public.analysis_results(content_id);
CREATE INDEX idx_analysis_results_type ON public.analysis_results(analysis_type);
CREATE INDEX idx_analysis_results_created_at ON public.analysis_results(created_at DESC);

-- Constraints
ALTER TABLE public.analysis_results
  ADD CONSTRAINT unique_content_analysis_type
  UNIQUE (content_id, analysis_type);
```

### 2.5 detected_contents (발견된 콘텐츠)
AI가 발견한 유사/일치 콘텐츠 정보 테이블

```sql
CREATE TABLE public.detected_contents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,

  -- Detection Source
  source_url TEXT,
  image_url TEXT NOT NULL,
  page_title TEXT,

  -- Similarity Metrics
  similarity_score DECIMAL(5, 4) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  detection_type TEXT CHECK (detection_type IN ('full_match', 'partial_match', 'visually_similar')) NOT NULL,

  -- Admin Review
  admin_review_status TEXT CHECK (admin_review_status IN ('pending', 'match', 'no_match', 'cannot_compare')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_detected_contents_content_id ON public.detected_contents(content_id);
CREATE INDEX idx_detected_contents_review_status ON public.detected_contents(admin_review_status);
CREATE INDEX idx_detected_contents_detection_type ON public.detected_contents(detection_type);
CREATE INDEX idx_detected_contents_reviewed_by ON public.detected_contents(reviewed_by);
CREATE INDEX idx_detected_contents_created_at ON public.detected_contents(created_at DESC);
CREATE INDEX idx_detected_contents_similarity ON public.detected_contents(similarity_score DESC);
```

### 2.6 activity_logs (활동 로그)
사용자 활동 및 시스템 이벤트 로그 테이블

```sql
CREATE TABLE public.activity_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Activity Info
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,

  -- Request Info
  ip_address INET,
  user_agent TEXT,

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
```

---

## 3. Supabase RLS 정책

### 3.1 users 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );

-- 관리자는 모든 사용자 수정 가능
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );
```

### 3.2 collections 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 컬렉션만 조회 가능
CREATE POLICY "Users can view own collections"
  ON public.collections
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 컬렉션 생성 가능
CREATE POLICY "Users can create own collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );
```

### 3.3 contents 테이블 정책

```sql
-- Enable RLS
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 콘텐츠만 조회 가능
CREATE POLICY "Users can view own contents"
  ON public.contents
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 콘텐츠 업로드 가능
CREATE POLICY "Users can upload contents"
  ON public.contents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
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
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );
```

### 3.4 detected_contents 테이블 정책

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
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );

-- 관리자만 발견 내용 수정 가능 (검토 결과 등록)
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'approved'
    )
  );
```

---

## 4. 인덱스 설계

### 4.1 성능 최적화 인덱스

```sql
-- 복합 인덱스
CREATE INDEX idx_contents_user_status ON public.contents(user_id, status);
CREATE INDEX idx_contents_collection_status ON public.contents(collection_id, status);
CREATE INDEX idx_detected_contents_content_status ON public.detected_contents(content_id, admin_review_status);

-- 부분 인덱스 (조건부 인덱스)
CREATE INDEX idx_contents_pending ON public.contents(created_at DESC)
  WHERE status = 'pending';
CREATE INDEX idx_detected_contents_pending ON public.detected_contents(created_at DESC)
  WHERE admin_review_status = 'pending';

-- 전문 검색용 인덱스 (GIN)
CREATE INDEX idx_contents_metadata ON public.contents USING GIN (metadata);
CREATE INDEX idx_analysis_results_data ON public.analysis_results USING GIN (processed_data);
```

### 4.2 통계용 인덱스

```sql
-- 대시보드 쿼리 최적화
CREATE INDEX idx_contents_created_at_status ON public.contents(created_at, status);
CREATE INDEX idx_detected_contents_reviewed_at ON public.detected_contents(reviewed_at)
  WHERE reviewed_at IS NOT NULL;
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
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

### 5.2 통계 업데이트 트리거

```sql
-- 컬렉션 콘텐츠 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_collection_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET content_count = content_count + 1,
        total_size = total_size + NEW.file_size
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET content_count = content_count - 1,
        total_size = total_size - OLD.file_size
    WHERE id = OLD.collection_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.collection_id != NEW.collection_id THEN
    UPDATE public.collections
    SET content_count = content_count - 1,
        total_size = total_size - OLD.file_size
    WHERE id = OLD.collection_id;

    UPDATE public.collections
    SET content_count = content_count + 1,
        total_size = total_size + NEW.file_size
    WHERE id = NEW.collection_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collection_stats_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_stats();

-- 콘텐츠 감지 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_content_detection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contents
    SET detection_count = detection_count + 1,
        match_count = match_count + CASE
          WHEN NEW.admin_review_status = 'match' THEN 1
          ELSE 0
        END
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.admin_review_status != NEW.admin_review_status THEN
    UPDATE public.contents
    SET match_count = match_count +
        CASE
          WHEN NEW.admin_review_status = 'match' AND OLD.admin_review_status != 'match' THEN 1
          WHEN NEW.admin_review_status != 'match' AND OLD.admin_review_status = 'match' THEN -1
          ELSE 0
        END
    WHERE id = NEW.content_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_detection_trigger
  AFTER INSERT OR UPDATE ON public.detected_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_content_detection_count();
```

### 5.3 활동 로그 자동 기록

```sql
-- 로그인 활동 자동 기록
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_login_at != OLD.last_login_at THEN
    INSERT INTO public.activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'login',
      'user',
      NEW.id,
      jsonb_build_object('timestamp', NEW.last_login_at)
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_login_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_login();
```

---

_이 문서는 UTRBOX 시스템의 데이터베이스 스키마 설계를 정의합니다. 변경사항이 발생할 경우 마이그레이션과 함께 문서를 업데이트해야 합니다._