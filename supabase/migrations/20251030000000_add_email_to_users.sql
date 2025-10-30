-- users 테이블에 email 컬럼 추가 및 handle_new_user 함수 수정
-- 이메일 정보를 public.users에 저장하여 쿼리 성능 향상

-- 1. users 테이블에 email 컬럼 추가
ALTER TABLE public.users
ADD COLUMN email TEXT;

-- 2. email 컬럼에 대한 주석 추가
COMMENT ON COLUMN public.users.email IS '사용자 이메일 (auth.users에서 복사)';

-- 3. email 컬럼에 인덱스 추가 (검색 성능 향상)
CREATE INDEX idx_users_email ON public.users(email);

-- 4. 기존 users 레코드에 대해 auth.users에서 email 가져와서 업데이트
UPDATE public.users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id
AND u.email IS NULL;

-- 5. handle_new_user 함수 수정 (email 컬럼 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 이미 public.users에 레코드가 있는지 확인 (중복 방지)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- public.users 테이블에 프로필 정보 삽입 (email 포함)
  INSERT INTO public.users (id, name, email, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    NEW.email,  -- email 추가
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 함수 설명 업데이트
COMMENT ON FUNCTION public.handle_new_user()
IS '이메일 인증 완료 시 public.users에 프로필 생성 (email 포함, 중복 방지 로직 포함)';

-- 7. 마이그레이션 완료 확인을 위한 검증 쿼리 (선택적)
-- SELECT
--   COUNT(*) as total_users,
--   COUNT(email) as users_with_email,
--   COUNT(*) - COUNT(email) as users_without_email
-- FROM public.users;
