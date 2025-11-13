CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- public.users 테이블에 레코드 생성
  INSERT INTO public.users (id, name, email, organization, phone, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'member',
    NULL  -- 승인 대기 상태
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user()
IS '이메일 인증 완료 시 public.users에 프로필 생성';
