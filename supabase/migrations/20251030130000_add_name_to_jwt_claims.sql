-- =============================================
-- Add Name to JWT Claims Migration
-- Date: 2025-10-30
-- Description: Add name field to app_metadata for JWT claims
-- =============================================

-- =============================================
-- 1. UPDATE handle_new_user FUNCTION (name 추가)
-- =============================================

-- 신규 사용자 생성 시 name도 app_metadata에 포함
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. public.users 테이블에 레코드 생성
  INSERT INTO public.users (id, name, email, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );

  -- 2. auth.users의 raw_app_meta_data 업데이트 (JWT Claims - name 추가)
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'name', COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
      'role', 'member',
      'is_approved', NULL,
      'organization', COALESCE(NEW.raw_user_meta_data->>'organization', NULL)
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================
-- 2. CREATE sync_user_name_to_jwt FUNCTION
-- =============================================

-- name 변경 시 auth.users의 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_name_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- name이 변경되었을 때만 실행
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('name', NEW.name)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_name_changed ON public.users;
CREATE TRIGGER on_user_name_changed
  AFTER UPDATE OF name ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_name_to_jwt();

-- =============================================
-- 3. 기존 사용자 app_metadata에 name 추가 (데이터 마이그레이션)
-- =============================================

-- 기존 사용자들의 app_metadata에 name 추가
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'name', (SELECT name FROM public.users WHERE id = auth.users.id)
  )
WHERE id IN (SELECT id FROM public.users);
