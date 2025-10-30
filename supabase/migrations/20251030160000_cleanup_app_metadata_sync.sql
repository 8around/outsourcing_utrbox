-- =============================================
-- Cleanup app_metadata Synchronization
-- Date: 2025-10-30
-- Description: Remove app_metadata synchronization logic (no longer needed with Custom Access Token Hook)
-- =============================================

-- =============================================
-- 1. UPDATE handle_new_user Function (Remove app_metadata update)
-- =============================================

-- handle_new_user: public.users 테이블에만 데이터 삽입
-- Custom Access Token Hook이 users 테이블을 직접 조회하므로 app_metadata 동기화 불필요
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- public.users 테이블에 레코드 생성만 수행
  INSERT INTO public.users (id, name, email, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );

  -- app_metadata 업데이트 제거: Custom Access Token Hook이 users 테이블을 직접 조회

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================
-- 2. DROP Synchronization Triggers
-- =============================================

-- approval 동기화 트리거 제거
DROP TRIGGER IF EXISTS on_user_approval_changed ON public.users;

-- role 동기화 트리거 제거
DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;

-- name 동기화 트리거 제거
DROP TRIGGER IF EXISTS on_user_name_changed ON public.users;

-- organization 동기화 트리거 제거
DROP TRIGGER IF EXISTS on_user_organization_changed ON public.users;

-- =============================================
-- 3. DROP Synchronization Functions
-- =============================================

-- approval 동기화 함수 제거
DROP FUNCTION IF EXISTS public.sync_user_approval_to_jwt();

-- role 동기화 함수 제거
DROP FUNCTION IF EXISTS public.sync_user_role_to_jwt();

-- name 동기화 함수 제거
DROP FUNCTION IF EXISTS public.sync_user_name_to_jwt();

-- organization 동기화 함수 제거
DROP FUNCTION IF EXISTS public.sync_user_organization_to_jwt();

-- =============================================
-- SUMMARY
-- =============================================
--
-- 이 마이그레이션은 app_metadata 동기화 로직을 제거합니다.
--
-- 제거 이유:
-- - Custom Access Token Hook이 users 테이블을 직접 조회
-- - app_metadata 동기화는 불필요하고 복잡도만 증가
-- - users 테이블이 "single source of truth"
--
-- 제거된 함수:
-- - sync_user_approval_to_jwt()
-- - sync_user_role_to_jwt()
-- - sync_user_name_to_jwt()
-- - sync_user_organization_to_jwt()
--
-- 제거된 트리거:
-- - on_user_approval_changed
-- - on_user_role_changed
-- - on_user_name_changed
-- - on_user_organization_changed
--
-- 수정된 함수:
-- - handle_new_user: public.users 테이블에만 데이터 삽입
--
-- Custom Access Token Hook 동작:
-- 1. 로그인 시 Hook 실행
-- 2. users 테이블에서 최신 데이터 조회
-- 3. JWT claims에 직접 추가
-- 4. 동기화 불필요!
-- =============================================
