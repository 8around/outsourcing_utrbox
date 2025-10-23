-- =============================================
-- UTRBOX Database Schema Migration
-- Version: 1.0.0
-- Date: 2025-10-24
-- Description: Initial schema with 4 tables (users, collections, contents, detected_contents)
-- =============================================

-- =============================================
-- 1. HELPER FUNCTIONS
-- =============================================

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
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

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
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 신규 사용자 자동 프로필 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User_' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;


-- =============================================
-- 2. TABLES
-- =============================================

-- 2.1 users (사용자 프로필)
CREATE TABLE IF NOT EXISTS public.users (
  -- Primary Key (Supabase Auth 참조)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  name TEXT NOT NULL,
  organization TEXT,

  -- Authorization
  role TEXT CHECK (role IN ('member', 'admin')) DEFAULT 'member',
  is_approved BOOLEAN,  -- NULL: 대기, TRUE: 승인, FALSE: 거부

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 collections (컬렉션)
CREATE TABLE IF NOT EXISTS public.collections (
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

-- 2.3 contents (원본 콘텐츠 + AI 분석 결과)
CREATE TABLE IF NOT EXISTS public.contents (
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

-- 2.4 detected_contents (발견된 콘텐츠)
CREATE TABLE IF NOT EXISTS public.detected_contents (
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


-- =============================================
-- 3. CONSTRAINTS
-- =============================================

-- collections: 사용자별 컬렉션명 중복 방지
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_collection_name'
  ) THEN
    ALTER TABLE public.collections
      ADD CONSTRAINT unique_user_collection_name
      UNIQUE (user_id, name);
  END IF;
END $$;


-- =============================================
-- 4. INDEXES
-- =============================================

-- 4.1 users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON public.users(is_approved);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- 4.2 collections 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);

-- 4.3 contents 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON public.contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_collection_id ON public.contents(collection_id);
CREATE INDEX IF NOT EXISTS idx_contents_is_analyzed ON public.contents(is_analyzed);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_user_analyzed ON public.contents(user_id, is_analyzed);
CREATE INDEX IF NOT EXISTS idx_contents_collection_analyzed ON public.contents(collection_id, is_analyzed);
CREATE INDEX IF NOT EXISTS idx_contents_pending ON public.contents(created_at DESC) WHERE is_analyzed IS NULL;

-- 4.4 detected_contents 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_detected_contents_content_id ON public.detected_contents(content_id);
CREATE INDEX IF NOT EXISTS idx_detected_contents_reviewed_by ON public.detected_contents(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_detected_contents_review_status ON public.detected_contents(admin_review_status);
CREATE INDEX IF NOT EXISTS idx_detected_contents_detection_type ON public.detected_contents(detection_type);
CREATE INDEX IF NOT EXISTS idx_detected_contents_created_at ON public.detected_contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detected_contents_content_status ON public.detected_contents(content_id, admin_review_status);
CREATE INDEX IF NOT EXISTS idx_detected_contents_pending ON public.detected_contents(created_at DESC) WHERE admin_review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_detected_contents_reviewed_at ON public.detected_contents(reviewed_at) WHERE reviewed_at IS NOT NULL;


-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- 5.1 users 테이블 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_approved = (SELECT is_approved FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() != id
    AND public.is_admin()
  );

-- 5.2 collections 테이블 RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can view own collections" ON public.collections;
CREATE POLICY "Approved users can view own collections"
  ON public.collections
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

DROP POLICY IF EXISTS "Approved users can create collections" ON public.collections;
CREATE POLICY "Approved users can create collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections"
  ON public.collections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections"
  ON public.collections
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all collections" ON public.collections;
CREATE POLICY "Admins can manage all collections"
  ON public.collections
  FOR ALL
  USING (public.is_admin());

-- 5.3 contents 테이블 RLS
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can view own contents" ON public.contents;
CREATE POLICY "Approved users can view own contents"
  ON public.contents
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

DROP POLICY IF EXISTS "Approved users can upload contents" ON public.contents;
CREATE POLICY "Approved users can upload contents"
  ON public.contents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

DROP POLICY IF EXISTS "Users can update own contents" ON public.contents;
CREATE POLICY "Users can update own contents"
  ON public.contents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contents" ON public.contents;
CREATE POLICY "Users can delete own contents"
  ON public.contents
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all contents" ON public.contents;
CREATE POLICY "Admins can manage all contents"
  ON public.contents
  FOR ALL
  USING (public.is_admin());

-- 5.4 detected_contents 테이블 RLS
ALTER TABLE public.detected_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view matched detections" ON public.detected_contents;
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

DROP POLICY IF EXISTS "Admins can view all detections" ON public.detected_contents;
CREATE POLICY "Admins can view all detections"
  ON public.detected_contents
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update detections" ON public.detected_contents;
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete detections" ON public.detected_contents;
CREATE POLICY "Admins can delete detections"
  ON public.detected_contents
  FOR DELETE
  USING (public.is_admin());


-- =============================================
-- 6. TRIGGERS
-- =============================================

-- 6.1 updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contents_updated_at ON public.contents;
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6.2 신규 사용자 자동 프로필 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 7. STORAGE RLS POLICIES
-- =============================================

-- Storage bucket 'contents'에 대한 RLS 정책

-- 승인된 사용자만 자신의 파일 업로드 가능
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.is_approved_user()
  );

-- 승인된 사용자만 자신의 파일 조회 가능
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 승인된 사용자만 자신의 파일 삭제 가능
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 관리자는 모든 파일 관리 가능
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
CREATE POLICY "Admins can manage all images"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contents'
    AND public.is_admin()
  );


-- =============================================
-- 8. COMMENTS (테이블 및 컬럼 설명)
-- =============================================

-- 8.1 users 테이블 주석
COMMENT ON TABLE public.users IS '사용자 프로필 정보 (인증은 auth.users 활용)';
COMMENT ON COLUMN public.users.id IS 'auth.users.id 참조';
COMMENT ON COLUMN public.users.is_approved IS 'NULL: 승인 대기, TRUE: 승인, FALSE: 거부';
COMMENT ON COLUMN public.users.role IS 'member: 일반 사용자, admin: 관리자';

-- 8.2 collections 테이블 주석
COMMENT ON TABLE public.collections IS '콘텐츠 그룹화 컬렉션';
COMMENT ON CONSTRAINT unique_user_collection_name ON public.collections IS '사용자별 컬렉션명 중복 방지';

-- 8.3 contents 테이블 주석
COMMENT ON TABLE public.contents IS '업로드된 원본 콘텐츠 및 AI 분석 결과';
COMMENT ON COLUMN public.contents.file_path IS 'Supabase Storage 경로 (파일 크기, MIME type은 Storage에서 관리)';
COMMENT ON COLUMN public.contents.is_analyzed IS 'NULL: 분석 대기, FALSE: 분석 중, TRUE: 분석 완료';
COMMENT ON COLUMN public.contents.message IS '사용자 전달 메시지 또는 에러 메시지';
COMMENT ON COLUMN public.contents.label_data IS 'Google Vision API LABEL_DETECTION 원본 응답 (JSONB)';
COMMENT ON COLUMN public.contents.text_data IS 'Google Vision API TEXT_DETECTION 원본 응답 (JSONB)';

-- 8.4 detected_contents 테이블 주석
COMMENT ON TABLE public.detected_contents IS 'AI가 발견한 유사/일치 콘텐츠 (WEB_DETECTION 결과)';
COMMENT ON COLUMN public.detected_contents.detection_type IS 'full: 완전일치, partial: 부분일치, similar: 시각적유사';
COMMENT ON COLUMN public.detected_contents.admin_review_status IS 'pending: 검토대기, match: 일치, no_match: 불일치, cannot_compare: 비교불가';
COMMENT ON COLUMN public.detected_contents.source_url IS '발견된 페이지 URL (없을 수 있음)';
COMMENT ON COLUMN public.detected_contents.image_url IS '발견된 이미지 URL (필수)';


-- =============================================
-- Migration Complete
-- =============================================
