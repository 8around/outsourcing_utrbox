-- =============================================
-- JWT Custom Claims Migration
-- Date: 2025-10-30
-- Description: Add JWT custom claims (app_metadata) synchronization
-- =============================================

-- =============================================
-- 1. UPDATE handle_new_user FUNCTION
-- =============================================

-- 신규 사용자 생성 시 public.users 테이블 생성 + auth.users app_metadata 업데이트
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

  -- 2. auth.users의 raw_app_meta_data 업데이트 (JWT Claims)
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', 'member',
      'is_approved', NULL,
      'organization', COALESCE(NEW.raw_user_meta_data->>'organization', NULL)
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================
-- 2. CREATE sync_user_approval_to_jwt FUNCTION
-- =============================================

-- 승인 상태 변경 시 auth.users의 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_approval_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- is_approved가 변경되었을 때만 실행
  IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('is_approved', NEW.is_approved)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_approval_changed ON public.users;
CREATE TRIGGER on_user_approval_changed
  AFTER UPDATE OF is_approved ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_approval_to_jwt();

-- =============================================
-- 3. CREATE sync_user_role_to_jwt FUNCTION
-- =============================================

-- role 변경 시 auth.users의 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- role이 변경되었을 때만 실행
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
CREATE TRIGGER on_user_role_changed
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- =============================================
-- 4. 기존 사용자 app_metadata 업데이트 (데이터 마이그레이션)
-- =============================================

-- 기존 사용자들의 app_metadata 일괄 업데이트
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', (SELECT role FROM public.users WHERE id = auth.users.id),
    'is_approved', (SELECT is_approved FROM public.users WHERE id = auth.users.id),
    'organization', (SELECT organization FROM public.users WHERE id = auth.users.id)
  )
WHERE id IN (SELECT id FROM public.users);
