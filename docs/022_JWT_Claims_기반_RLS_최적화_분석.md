# 022. JWT Claims 기반 RLS 최적화 분석 및 마이그레이션 계획

## 📋 개요

현재 구현된 Supabase 함수 및 RLS 정책을 분석하고, JWT Claims 기반으로 최적화하여 성능을 개선하는 방안을 제시합니다.

## 🔍 현재 상황 분석

### 1. 현재 구현된 Helper 함수

`supabase/migrations/20251024000000_initial_schema.sql`에 정의됨:

```sql
-- 현재 사용자가 승인된 관리자인지 확인
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_approved = TRUE
  );
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 현재 사용자가 승인된 사용자인지 확인
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_approved = TRUE
  );
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;
```

### 2. RLS 정책에서 Helper 함수 사용 현황

#### 📊 총 15개 RLS 정책이 database 함수 호출

| 테이블 | 정책 이름 | 사용 함수 | 줄 번호 |
|--------|-----------|-----------|---------|
| **users** (3개) | | | |
| | Admins can view all users | `is_admin()` | 230 |
| | Admins can update all users | `is_admin()` | 236 |
| | Admins can delete users | `is_admin()` | 244 |
| **collections** (3개) | | | |
| | Approved users can view own collections | `is_approved_user()` | 256 |
| | Approved users can create collections | `is_approved_user()` | 265 |
| | Admins can manage all collections | `is_admin()` | 285 |
| **contents** (3개) | | | |
| | Approved users can view own contents | `is_approved_user()` | 296 |
| | Approved users can upload contents | `is_approved_user()` | 305 |
| | Admins can manage all contents | `is_admin()` | 325 |
| **detected_contents** (4개) | | | |
| | Admins can view all detections | `is_admin()` | 347 |
| | Admins can update detections | `is_admin()` | 353 |
| | Admins can delete detections | `is_admin()` | 359 |
| **storage.objects** (2개) | | | |
| | Users can upload own images | `is_approved_user()` | 407 |
| | Admins can manage all images | `is_admin()` | 437 |

### 3. 애플리케이션 코드에서의 권한 확인

`lib/supabase/auth.ts:180-223`:

```typescript
export async function signInUser(supabase, data) {
  // 1. Supabase Auth 로그인
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password })

  // 2. 사용자 프로필 및 승인 상태 확인 (매 로그인마다 database 쿼리)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  // 3. 승인 상태 확인
  if (profile.is_approved !== true) {
    // 로그아웃 처리
  }

  return {
    user: {
      id: authData.user.id,
      role: profile.role,          // database에서 조회
      isApproved: profile.is_approved  // database에서 조회
    }
  }
}
```

## ⚠️ 문제점 및 성능 영향

### 1. Database 쿼리 오버헤드

**문제**:
- 모든 RLS 정책이 `is_admin()` 또는 `is_approved_user()` 함수 호출
- 각 함수가 `public.users` 테이블 조회 수행
- 인덱스가 있어도 I/O 비용 발생

**영향**:
```sql
-- 사용자가 contents 테이블에서 데이터 10개 조회 시
SELECT * FROM contents LIMIT 10;

-- 내부적으로 발생하는 쿼리:
-- 1. RLS 정책 평가를 위해 is_approved_user() 호출
-- 2. users 테이블 조회: SELECT 1 FROM users WHERE id = auth.uid() AND is_approved = TRUE
-- 3. 실제 contents 조회

-- 총 2번의 database 쿼리 발생
```

**성능 비용**:
- 각 쿼리당 추가 I/O: ~1-5ms
- 대량 쿼리 시 누적 오버헤드: N × (1-5ms)
- Connection pool 부하 증가

### 2. 애플리케이션 레벨 중복 조회

**문제**:
- 로그인할 때마다 `public.users`에서 profile 조회
- JWT에 role, is_approved가 없어서 불가피

**영향**:
```typescript
// 로그인 시 발생하는 쿼리:
// 1. Supabase Auth: signInWithPassword()
// 2. public.users 조회: SELECT * FROM users WHERE id = auth_user_id
// 3. is_approved 확인
// 4. role 확인

// 총 2번의 database 쿼리 (Auth + users)
```

### 3. JWT 갱신 시 정보 불일치

**문제**:
- 관리자가 사용자 승인 또는 role 변경
- 사용자가 재로그인하기 전까지 JWT에 반영 안 됨
- 애플리케이션과 RLS 정책의 동작 불일치 가능

## ✅ JWT Claims 기반 최적화 방안

### 1. app_metadata 구조 설정

```json
{
  "role": "member",
  "is_approved": true,
  "organization": "회사명"
}
```

### 2. Trigger 함수 수정

#### 2.1 handle_new_user 수정 (회원가입 시)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. public.users 테이블에 레코드 생성
  INSERT INTO public.users (id, name, organization, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User_' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    'member',
    NULL
  );

  -- 2. auth.users의 raw_app_meta_data 업데이트 (NEW!)
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', 'member',
      'is_approved', NULL,
      'organization', COALESCE(NEW.raw_user_meta_data->>'organization', NULL)
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;
```

#### 2.2 승인 상태 동기화 트리거 (NEW!)

```sql
-- 승인 처리 시 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_approval_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- is_approved가 변경되었을 때만 실행
  IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('is_approved', NEW.is_approved)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_approval_changed ON public.users;
CREATE TRIGGER on_user_approval_changed
  AFTER UPDATE OF is_approved ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_approval_to_jwt();
```

#### 2.3 role 변경 동기화 트리거 (NEW!)

```sql
-- role 변경 시 app_metadata 동기화
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- role이 변경되었을 때만 실행
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
CREATE TRIGGER on_user_role_changed
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_jwt();
```

### 3. RLS 정책 최적화

#### 3.1 users 테이블 (3개 정책)

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (public.is_admin());  -- database 쿼리 발생

-- AFTER
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );  -- JWT에서 직접 확인
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin());

-- AFTER
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() != id
    AND public.is_admin()
  );

-- AFTER
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() != id
    AND (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

#### 3.2 collections 테이블 (3개 정책)

```sql
-- BEFORE
DROP POLICY IF EXISTS "Approved users can view own collections" ON public.collections;
CREATE POLICY "Approved users can view own collections"
  ON public.collections
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- AFTER
DROP POLICY IF EXISTS "Approved users can view own collections" ON public.collections;
CREATE POLICY "Approved users can view own collections"
  ON public.collections
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Approved users can create collections" ON public.collections;
CREATE POLICY "Approved users can create collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- AFTER
DROP POLICY IF EXISTS "Approved users can create collections" ON public.collections;
CREATE POLICY "Approved users can create collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can manage all collections" ON public.collections;
CREATE POLICY "Admins can manage all collections"
  ON public.collections
  FOR ALL
  USING (public.is_admin());

-- AFTER
DROP POLICY IF EXISTS "Admins can manage all collections" ON public.collections;
CREATE POLICY "Admins can manage all collections"
  ON public.collections
  FOR ALL
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

#### 3.3 contents 테이블 (3개 정책)

```sql
-- BEFORE
DROP POLICY IF EXISTS "Approved users can view own contents" ON public.contents;
CREATE POLICY "Approved users can view own contents"
  ON public.contents
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- AFTER
DROP POLICY IF EXISTS "Approved users can view own contents" ON public.contents;
CREATE POLICY "Approved users can view own contents"
  ON public.contents
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Approved users can upload contents" ON public.contents;
CREATE POLICY "Approved users can upload contents"
  ON public.contents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

-- AFTER
DROP POLICY IF EXISTS "Approved users can upload contents" ON public.contents;
CREATE POLICY "Approved users can upload contents"
  ON public.contents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can manage all contents" ON public.contents;
CREATE POLICY "Admins can manage all contents"
  ON public.contents
  FOR ALL
  USING (public.is_admin());

-- AFTER
DROP POLICY IF EXISTS "Admins can manage all contents" ON public.contents;
CREATE POLICY "Admins can manage all contents"
  ON public.contents
  FOR ALL
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

#### 3.4 detected_contents 테이블 (4개 정책)

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can view all detections" ON public.detected_contents;
CREATE POLICY "Admins can view all detections"
  ON public.detected_contents
  FOR SELECT
  USING (public.is_admin());

-- AFTER
DROP POLICY IF EXISTS "Admins can view all detections" ON public.detected_contents;
CREATE POLICY "Admins can view all detections"
  ON public.detected_contents
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE (update, delete 정책도 동일한 패턴)
DROP POLICY IF EXISTS "Admins can update detections" ON public.detected_contents;
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (public.is_admin());

-- AFTER
DROP POLICY IF EXISTS "Admins can update detections" ON public.detected_contents;
CREATE POLICY "Admins can update detections"
  ON public.detected_contents
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

#### 3.5 storage.objects (2개 정책)

```sql
-- BEFORE
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.is_approved_user()
  );

-- AFTER
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

```sql
-- BEFORE
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
CREATE POLICY "Admins can manage all images"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contents'
    AND public.is_admin()
  );

-- AFTER
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;
CREATE POLICY "Admins can manage all images"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'contents'
    AND (auth.jwt() ->> 'role')::text = 'admin'
    AND (auth.jwt() ->> 'is_approved')::boolean = true
  );
```

### 4. Helper 함수 처리

#### Option 1: 제거 (권장)

```sql
-- 더 이상 사용되지 않으므로 제거
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_approved_user();
```

#### Option 2: Deprecated 처리 (하위 호환성)

```sql
-- 레거시 지원을 위해 유지하되 경고 추가
COMMENT ON FUNCTION public.is_admin() IS
  'DEPRECATED: Use JWT claims instead. Will be removed in future version.';

COMMENT ON FUNCTION public.is_approved_user() IS
  'DEPRECATED: Use JWT claims instead. Will be removed in future version.';
```

### 5. 애플리케이션 코드 최적화

#### lib/supabase/auth.ts 간소화

```typescript
// BEFORE
export async function signInUser(supabase, data) {
  const { data: authData } = await supabase.auth.signInWithPassword(...)

  // profile 조회 필요 (database 쿼리)
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profile.is_approved !== true) {
    await supabase.auth.signOut()
    return { error: '승인 대기 중' }
  }

  return {
    user: {
      id: authData.user.id,
      role: profile.role,
      isApproved: profile.is_approved
    }
  }
}

// AFTER
export async function signInUser(supabase, data) {
  const { data: authData } = await supabase.auth.signInWithPassword(...)

  // JWT에서 직접 확인 (database 쿼리 불필요)
  const appMetadata = authData.user.app_metadata

  if (appMetadata.is_approved !== true) {
    await supabase.auth.signOut()
    return { error: '승인 대기 중' }
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role: appMetadata.role,
      isApproved: appMetadata.is_approved,
      organization: appMetadata.organization
    }
  }
}
```

## 📈 성능 개선 예상치

### 1. RLS 정책 성능

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| Database 쿼리 | 2회 (RLS 함수 + 실제 쿼리) | 1회 (실제 쿼리만) | **50% 감소** |
| 응답 시간 | ~15-25ms | ~5-10ms | **~10-15ms 단축** |
| Database I/O | users 테이블 조회 발생 | JWT 메모리 조회만 | **I/O 제거** |

### 2. 로그인 성능

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| Database 쿼리 | 2회 (Auth + users) | 1회 (Auth만) | **50% 감소** |
| 응답 시간 | ~100-150ms | ~50-80ms | **~50-70ms 단축** |

### 3. 대량 쿼리 시 개선

사용자가 contents 100개를 조회하는 경우:

```
Before:
- RLS 함수 호출: 100회
- users 테이블 조회: 100회
- contents 조회: 1회
- 총 소요 시간: ~100-500ms

After:
- JWT 확인: 100회 (메모리 조회)
- contents 조회: 1회
- 총 소요 시간: ~10-50ms

개선: ~90-450ms 단축 (약 90% 성능 향상)
```

## 🚀 마이그레이션 계획

### Phase 1: 트리거 및 함수 준비 (021 문서 참고)

- [x] `handle_new_user` 함수 수정
- [x] `sync_user_approval_to_jwt` 함수 생성
- [x] `sync_user_role_to_jwt` 함수 생성

### Phase 2: RLS 정책 업데이트

**마이그레이션 파일 생성**:
```bash
supabase migration new update_rls_policies_use_jwt_claims
```

**순서**:
1. users 테이블 정책 업데이트 (3개)
2. collections 테이블 정책 업데이트 (3개)
3. contents 테이블 정책 업데이트 (3개)
4. detected_contents 테이블 정책 업데이트 (4개)
5. storage.objects 정책 업데이트 (2개)

### Phase 3: Helper 함수 제거

```sql
-- 모든 RLS 정책이 JWT 기반으로 변경된 후
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_approved_user();
```

### Phase 4: 애플리케이션 코드 업데이트

1. `lib/supabase/auth.ts` 수정
   - `signInUser` 함수에서 profile 조회 제거
   - JWT app_metadata 사용

2. 관련 타입 업데이트
   - 필요 시 타입 정의 수정

### Phase 5: 테스트 및 검증

- [ ] 로그인 기능 테스트
- [ ] 승인/거부 처리 테스트
- [ ] role 변경 테스트
- [ ] RLS 정책 동작 확인
- [ ] 성능 측정 및 비교

## 📝 체크리스트

### 구현
- [ ] handle_new_user 트리거 수정
- [ ] sync_user_approval_to_jwt 트리거 생성
- [ ] sync_user_role_to_jwt 트리거 생성
- [ ] users 테이블 RLS 정책 업데이트 (3개)
- [ ] collections 테이블 RLS 정책 업데이트 (3개)
- [ ] contents 테이블 RLS 정책 업데이트 (3개)
- [ ] detected_contents 테이블 RLS 정책 업데이트 (4개)
- [ ] storage.objects RLS 정책 업데이트 (2개)
- [ ] Helper 함수 제거
- [ ] lib/supabase/auth.ts 코드 최적화

### 테스트
- [ ] 회원가입 시 app_metadata 설정 확인
- [ ] 승인 처리 시 JWT 갱신 확인
- [ ] role 변경 시 JWT 갱신 확인
- [ ] RLS 정책 동작 확인 (권한별)
- [ ] 로그인 성능 측정
- [ ] 대량 쿼리 성능 측정

### 배포
- [ ] 스테이징 환경 배포 및 테스트
- [ ] 성능 개선 검증
- [ ] 프로덕션 환경 배포

## ⚠️ 주의사항

1. **JWT 갱신 필요**:
   - 기존 사용자는 로그아웃 후 재로그인 필요
   - 또는 강제 로그아웃 후 재인증 유도

2. **롤백 계획**:
   - Helper 함수는 바로 제거하지 말고 deprecated 처리
   - 문제 발생 시 RLS 정책만 롤백 가능

3. **모니터링**:
   - 성능 메트릭 수집
   - 에러 로그 모니터링
   - 사용자 피드백 수집

## 📚 참고 문서

- [021_Supabase_Auth_Custom_Claims_설정.md](./021_Supabase_Auth_Custom_Claims_설정.md)
- [020_회원_관리_페이지_실제_데이터_연동_및_페이지네이션.md](./020_회원_관리_페이지_실제_데이터_연동_및_페이지네이션.md)

---

**작성일**: 2025-10-30
**우선순위**: High
**예상 소요 시간**: 3-4시간
**예상 성능 개선**: 50-90% (쿼리 유형에 따라)
