-- auth.sessions에서 특정 사용자의 모든 세션을 삭제하는 함수
-- 관리자가 특정 사용자를 원격으로 로그아웃시킬 때 사용

CREATE OR REPLACE FUNCTION public.delete_user_sessions(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 보안 검증: JWT claims에서 호출자의 역할 확인
  caller_role := auth.jwt() ->> 'user_role';

  -- 관리자가 아니면 실행 거부
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required'
      USING HINT = 'Only administrators can delete user sessions';
  END IF;

  -- auth.sessions 테이블에서 해당 사용자의 모든 세션 삭제
  DELETE FROM auth.sessions
  WHERE user_id = target_user_id;
END;
$$;

-- 함수 설명 추가
COMMENT ON FUNCTION public.delete_user_sessions(UUID) IS
'관리자용: 특정 사용자의 모든 세션을 auth.sessions 테이블에서 삭제합니다. 원격 로그아웃에 사용됩니다.';
