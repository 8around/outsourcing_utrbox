-- =============================================
-- Custom Access Token Hook Migration
-- Date: 2025-10-30
-- Description: Add Custom Access Token Hook to include user info in JWT claims
-- Reference: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
-- =============================================

-- =============================================
-- 1. CREATE Custom Access Token Hook Function
-- =============================================

-- Custom Access Token Hook: JWT claims에 사용자 정보 추가
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
    -- 이렇게 하면 RLS에서 auth.jwt() ->> 'role' 로 직접 접근 가능

    if user_info.role is not null then
      claims := jsonb_set(claims, '{role}', to_jsonb(user_info.role));
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
-- 2. GRANT Permissions
-- =============================================

-- supabase_auth_admin이 public schema 사용 가능하도록 권한 부여
grant usage on schema public to supabase_auth_admin;

-- supabase_auth_admin이 hook 함수 실행 가능하도록 권한 부여
grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

-- authenticated, anon, public 역할에서 함수 실행 권한 제거 (보안)
revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

-- supabase_auth_admin이 users 테이블 읽기 가능하도록 권한 부여
grant select
  on table public.users
  to supabase_auth_admin;

-- =============================================
-- 3. RLS Policy for Auth Admin
-- =============================================

-- supabase_auth_admin이 users 테이블을 읽을 수 있도록 RLS 정책 추가
create policy "Allow auth admin to read user data for JWT"
  on public.users
  for select
  to supabase_auth_admin
  using (true);

-- =============================================
-- SUMMARY
-- =============================================
--
-- 이 마이그레이션은 Custom Access Token Hook을 추가합니다.
--
-- Hook 동작 방식:
-- 1. 사용자 로그인 시 Supabase Auth가 이 함수를 호출
-- 2. 함수가 users 테이블에서 사용자 정보 조회 (1회 쿼리)
-- 3. JWT claims 최상위 레벨에 role, is_approved, name, organization 추가
-- 4. 이후 모든 요청에서 JWT claims를 통해 직접 접근 가능
--
-- 결과 JWT 구조:
-- {
--   "sub": "user-uuid",
--   "email": "user@example.com",
--   "role": "member",            // 최상위 레벨!
--   "is_approved": true,         // 최상위 레벨!
--   "name": "사용자",             // 최상위 레벨!
--   "organization": "회사",       // 최상위 레벨!
--   "aud": "authenticated",
--   "exp": 1234567890
-- }
--
-- RLS 정책에서 사용:
-- (auth.jwt() ->> 'role')::text = 'admin'
-- (auth.jwt() ->> 'is_approved')::boolean = true
--
-- 성능 향상:
-- - 로그인 시: users 테이블 조회 1회
-- - RLS 체크 시: JWT 메모리 읽기 (database 쿼리 없음)
-- - 예상 성능 향상: 50-90%
--
-- Dashboard 설정:
-- 1. Authentication > Hooks (Beta)
-- 2. Custom Access Token 선택
-- 3. public.custom_access_token_hook 선택
-- 4. 저장
-- =============================================
