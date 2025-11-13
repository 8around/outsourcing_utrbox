-- phone 컬럼을 필수 필드로 변경

-- 1. 기존 NULL 값이 있는 경우를 대비한 안전장치
-- (선택사항: 필요시 기본값으로 업데이트)
UPDATE public.users SET phone = '010-0000-0000' WHERE phone IS NULL;

-- 2. 기존 check_phone_format 제약조건 삭제
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS check_phone_format;

-- 3. NULL을 허용하지 않는 새로운 check_phone_format 제약조건 추가
ALTER TABLE public.users
ADD CONSTRAINT check_phone_format
CHECK (phone ~ '^\d{3}-\d{4}-\d{4}$');

-- 4. phone 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE public.users
ALTER COLUMN phone SET NOT NULL;

-- 5. 컬럼 주석 업데이트
COMMENT ON COLUMN public.users.phone IS '전화번호 (형식: xxx-xxxx-xxxx, 필수)';

