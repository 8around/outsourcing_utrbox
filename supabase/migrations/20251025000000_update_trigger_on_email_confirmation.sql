-- 이메일 인증 완료 시에만 public.users 레코드 생성하도록 트리거 변경
-- 기존 INSERT 트리거를 삭제하고 UPDATE 트리거로 교체

-- 1. 기존 INSERT 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. handle_new_user 함수 수정 (중복 체크 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 이미 public.users에 레코드가 있는지 확인 (중복 방지)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- public.users 테이블에 프로필 정보 삽입
  INSERT INTO public.users (id, name, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 이메일 인증 완료 시 실행될 UPDATE 트리거 생성
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    -- 이메일 인증이 완료되는 순간만 감지 (NULL → NOT NULL)
    OLD.email_confirmed_at IS NULL
    AND NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 함수 설명 추가
COMMENT ON FUNCTION public.handle_new_user()
IS '이메일 인증 완료 시 public.users에 프로필 생성 (중복 방지 로직 포함)';
