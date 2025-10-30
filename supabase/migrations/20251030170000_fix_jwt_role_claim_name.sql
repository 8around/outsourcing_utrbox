-- =============================================
-- Fix JWT Role Claim Name
-- Date: 2025-10-30
-- Description: Change 'role' to 'user_role' in JWT claims to avoid PostgreSQL role conflict
-- =============================================

-- =============================================
-- 문제:
-- JWT의 'role' claim은 PostgreSQL role로 인식됨
-- PostgreSQL에는 'member', 'admin' role이 없음 (authenticated, anon, service_role만 존재)
-- → Error: role "member" does not exist
--
-- 해결:
-- JWT claim 이름을 'user_role'로 변경
-- =============================================

-- =============================================
-- 1. UPDATE Custom Access Token Hook (role → user_role)
-- =============================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_info record;
  begin
    -- public.users 테이블에서 사용자 정보 조회
    select role, is_approved, name, organization
    into user_info
    from public.users
    where id = (event->>'user_id')::uuid;

    claims := event->'claims';

    -- JWT claims 최상위 레벨에 사용자 정보 추가
    -- 주의: 'role'은 PostgreSQL role이므로 'user_role'로 저장

    if user_info.role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_info.role));
    end if;

    if user_info.is_approved is not null then
      claims := jsonb_set(claims, '{is_approved}', to_jsonb(user_info.is_approved));
    end if;

    if user_info.name is not null then
      claims := jsonb_set(claims, '{name}', to_jsonb(user_info.name));
    end if;

    if user_info.organization is not null then
      claims := jsonb_set(claims, '{organization}', to_jsonb(user_info.organization));
    end if;

    -- 수정된 claims를 event에 다시 설정
    event := jsonb_set(event, '{claims}', claims);

    return event;
  end;
$$;

-- =============================================
-- 2. UPDATE RLS Policies (role → user_role)
-- =============================================

-- 2.1 USERS TABLE
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() != id
    AND (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

-- 2.2 COLLECTIONS TABLE
DROP POLICY IF EXISTS "Admins can manage all collections" ON public.collections;
CREATE POLICY "Admins can manage all collections"
  ON public.collections
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

-- 2.3 CONTENTS TABLE
DROP POLICY IF EXISTS "Admins can manage all contents" ON public.contents;
CREATE POLICY "Admins can manage all contents"
  ON public.contents
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

-- 2.4 DETECTED_CONTENTS TABLE
DROP POLICY IF EXISTS "Admins can view all detections" ON public.detected_contents;
CREATE POLICY "Admins can view all detections"
  ON public.detected_contents
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

DROP POLICY IF EXISTS "Admins can update detections" ON public.detected_contents;
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

DROP POLICY IF EXISTS "Admins can delete detections" ON public.detected_contents;
CREATE POLICY "Admins can delete detections"
  ON public.detected_contents
  FOR DELETE
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

DROP POLICY IF EXISTS "Admins can insert detections" ON public.detected_contents;
CREATE POLICY "Admins can insert detections"
  ON public.detected_contents
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

-- 2.5 STORAGE.OBJECTS
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
CREATE POLICY "Admins can manage all images"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contents'
    AND (auth.jwt() ->> 'user_role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );

-- =============================================
-- SUMMARY
-- =============================================
--
-- 변경 사항:
-- 1. Custom Access Token Hook: 'role' → 'user_role'
-- 2. 모든 RLS 정책: auth.jwt() ->> 'role' → auth.jwt() ->> 'user_role'
--
-- 최종 JWT 구조:
-- {
--   "sub": "user-uuid",
--   "email": "user@example.com",
--   "role": "authenticated",      // PostgreSQL role (변경 없음)
--   "user_role": "member",         // 사용자 역할 (신규)
--   "is_approved": true,
--   "name": "사용자",
--   "organization": "회사"
-- }
--
-- RLS 정책 사용:
-- (auth.jwt() ->> 'user_role')::text = 'admin'
-- =============================================
