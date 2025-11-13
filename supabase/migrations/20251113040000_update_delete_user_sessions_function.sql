-- delete_user_sessions 함수 업데이트
-- JWT 검증 제거하고 Service Role로만 실행 권한 제한

-- 기존 함수 재생성 (JWT 검증 제거)
CREATE OR REPLACE FUNCTION public.delete_user_sessions(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.sessions 테이블에서 해당 사용자의 모든 세션 삭제
  DELETE FROM auth.sessions
  WHERE user_id = target_user_id;
END;
$$;

-- 함수 설명 업데이트
COMMENT ON FUNCTION public.delete_user_sessions(UUID) IS
'Service Role 전용: 특정 사용자의 모든 세션을 auth.sessions 테이블에서 삭제합니다. 원격 로그아웃에 사용됩니다.';

-- 모든 사용자의 실행 권한 제거
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM authenticated;

-- Service Role에만 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.delete_user_sessions(UUID) TO service_role;
