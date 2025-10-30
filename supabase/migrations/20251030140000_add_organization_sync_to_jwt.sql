-- =============================================
-- Add Organization Sync to JWT Claims Migration
-- Date: 2025-10-30
-- Description: Add organization field synchronization to app_metadata
-- =============================================

-- =============================================
-- CREATE sync_user_organization_to_jwt FUNCTION
-- =============================================

-- organization 변경 시 auth.users의 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_organization_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- organization이 변경되었을 때만 실행
  IF OLD.organization IS DISTINCT FROM NEW.organization THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('organization', NEW.organization)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_organization_changed ON public.users;
CREATE TRIGGER on_user_organization_changed
  AFTER UPDATE OF organization ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_organization_to_jwt();

-- =============================================
-- SUMMARY
-- =============================================
-- Added: sync_user_organization_to_jwt function and trigger
-- Purpose: Keep JWT claims in sync when organization is updated in public.users table
-- =============================================
