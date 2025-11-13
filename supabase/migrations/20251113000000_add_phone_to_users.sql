-- users 테이블에 phone 컬럼 추가
ALTER TABLE public.users
ADD COLUMN phone TEXT;

-- 전화번호 형식 검증 제약조건 추가 (xxx-xxxx-xxxx 형식)
ALTER TABLE public.users
ADD CONSTRAINT check_phone_format
CHECK (phone IS NULL OR phone ~ '^\d{3}-\d{4}-\d{4}$');

-- 컬럼 주석 추가
COMMENT ON COLUMN public.users.phone IS '전화번호 (형식: xxx-xxxx-xxxx)';
