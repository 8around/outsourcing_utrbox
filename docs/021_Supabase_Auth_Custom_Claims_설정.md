# 021. Supabase Auth Custom Claims 설정

## 📋 개요

RLS 정책에서 사용자의 role을 확인하기 위해 JWT 토큰에 custom claims를 추가합니다. 현재 회원가입 시 `raw_app_metadata`에 role 정보를 저장하지 않아 RLS 정책이 작동하지 않는 문제를 해결합니다.

## 🔍 문제 상황

### 현재 구현 (lib/supabase/auth.ts:85-94)

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    data: {
      name: data.name,
      organization: data.organization,
    },
  },
})
```

**문제점**:
- `options.data`는 `user_metadata`에 저장됨
- `user_metadata`는 사용자가 수정 가능
- JWT 토큰에는 `app_metadata`만 포함됨
- RLS 정책에서 `auth.jwt() ->> 'role'` 사용 불가

### RLS 정책 예시 (현재 작동 안 함)

```sql
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'  -- JWT에 role이 없어서 항상 false
);
```

## 🏗️ Supabase Metadata 구조

### 1. user_metadata
- 사용자가 수정 가능한 메타데이터
- 프로필 정보 저장 (이름, 프로필 사진 등)
- JWT 토큰에 포함되지 않음 (보안상 이유)
- `auth.users.raw_user_meta_data` 컬럼에 저장

### 2. app_metadata
- **앱에서만 수정 가능** (사용자는 수정 불가)
- 권한 정보 저장 (role, permissions 등)
- **JWT 토큰에 포함됨** ⭐
- `auth.users.raw_app_meta_data` 컬럼에 저장
- RLS 정책에서 `auth.jwt()` 함수로 접근 가능

## ✅ 솔루션: Database Function으로 app_metadata 업데이트

### 1. handle_new_user Function 수정

기존 `handle_new_user` 트리거 함수를 수정하여 회원가입 시 `app_metadata`를 자동으로 설정합니다.

```sql
-- handle_new_user 함수 수정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. public.users 테이블에 레코드 생성
  INSERT INTO public.users (id, email, name, organization, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'organization',
    'member',  -- 기본 role
    NULL       -- 승인 대기
  );

  -- 2. auth.users의 raw_app_meta_data 업데이트
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', 'member',
      'is_approved', NULL,
      'organization', NEW.raw_user_meta_data->>'organization'
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (이미 존재하면 스킵)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. 승인 처리 시 app_metadata 동기화

사용자를 승인/거부할 때 `app_metadata`도 함께 업데이트해야 JWT 토큰이 갱신됩니다.

```sql
-- 승인 처리 시 app_metadata 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_user_approval_to_jwt()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_approval_changed ON public.users;
CREATE TRIGGER on_user_approval_changed
  AFTER UPDATE OF is_approved ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_approval_to_jwt();
```

### 3. role 변경 시 app_metadata 동기화

관리자가 사용자의 role을 변경할 때도 동기화가 필요합니다.

```sql
-- role 변경 시 app_metadata 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_user_role_changed ON public.users;
CREATE TRIGGER on_user_role_changed
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_jwt();
```

## 📊 app_metadata 구조

### 추천 구조

```json
{
  "role": "member",           // 필수: 사용자 권한
  "is_approved": null,        // 필수: 승인 상태 (null/true/false)
  "organization": "회사명"     // 권장: 조직별 데이터 필터링
}
```

### 추가 가능한 값 (선택)

```json
{
  "role": "member",
  "is_approved": true,
  "organization": "회사명",
  "approved_at": "2025-10-30T12:00:00Z",    // 승인 시간
  "approved_by": "admin-user-id",           // 승인자 ID
  "permissions": ["read", "write"],         // 세부 권한
  "department": "마케팅팀"                   // 부서 정보
}
```

### 주의사항

⚠️ **JWT 토큰 크기 제한**:
- JWT 토큰은 일반적으로 8KB 제한
- `app_metadata`가 클수록 토큰 크기 증가
- **필수 정보만 포함하는 것을 권장**

✅ **권장 사항**:
- `role`, `is_approved`, `organization`만 포함
- 나머지 정보는 `public.users` 테이블에서 조회
- 토큰 크기 최소화로 성능 최적화

## 🔒 RLS 정책 수정

### 기존 정책 (작동 안 함)

```sql
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'  -- app_metadata에 role이 없어서 실패
);
```

### 수정된 정책 (작동함)

```sql
-- 관리자만 전체 사용자 조회 가능
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- 관리자만 사용자 승인 상태 업데이트 가능
CREATE POLICY "Admins can update user approval status"
ON users FOR UPDATE
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- 승인된 사용자만 본인 데이터 조회 가능
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (
  auth.uid() = id AND
  (auth.jwt() ->> 'is_approved')::boolean = true
);

-- 조직별 데이터 필터링 (예시)
CREATE POLICY "Users can view same organization members"
ON users FOR SELECT
USING (
  (auth.jwt() ->> 'organization')::text = organization AND
  (auth.jwt() ->> 'is_approved')::boolean = true
);
```

## 🔧 적용 방법

### 1. Supabase Dashboard에서 적용

1. **Supabase Dashboard** 접속
2. **SQL Editor** 메뉴 선택
3. 위의 SQL 스크립트를 순서대로 실행:
   - `handle_new_user` 함수 수정
   - `sync_user_approval_to_jwt` 함수 생성
   - `sync_user_role_to_jwt` 함수 생성
   - RLS 정책 수정

### 2. 마이그레이션 파일로 적용

```bash
# 마이그레이션 파일 생성
supabase migration new add_custom_claims_to_jwt

# 파일에 SQL 스크립트 작성 후 적용
supabase db push
```

## 🧪 테스트 방법

### 1. 회원가입 후 JWT 확인

```typescript
// 회원가입 후
const { data: { session } } = await supabase.auth.getSession()
console.log(session?.access_token)

// JWT 디코드: https://jwt.io/
// app_metadata 확인:
{
  "role": "member",
  "is_approved": null,
  "organization": "테스트회사"
}
```

### 2. RLS 정책 테스트

```sql
-- 일반 사용자로 테스트
SELECT auth.jwt() ->> 'role' as role;  -- 'member'

-- 관리자로 테스트
SELECT auth.jwt() ->> 'role' as role;  -- 'admin'

-- 승인 상태 확인
SELECT auth.jwt() ->> 'is_approved' as is_approved;  -- 'null' or 'true' or 'false'
```

### 3. 승인 처리 후 JWT 갱신 확인

```typescript
// 1. 관리자가 사용자 승인
await supabase
  .from('users')
  .update({ is_approved: true })
  .eq('id', userId)

// 2. 사용자가 로그아웃 후 재로그인 (JWT 갱신)
await supabase.auth.signOut()
await supabase.auth.signInWithPassword({ email, password })

// 3. 새 JWT 확인
const { data: { session } } = await supabase.auth.getSession()
// app_metadata.is_approved === true 확인
```

## 💡 추가 고려사항

### 1. JWT 갱신 시점

- JWT는 **로그인 시** 생성됨
- `app_metadata` 변경 시 **즉시 반영되지 않음**
- 사용자가 **재로그인해야 JWT 갱신됨**

**해결 방법**:
```typescript
// 승인 처리 후 강제 로그아웃 (재로그인 유도)
await supabase.auth.admin.signOut(userId, 'global')
```

### 2. 기존 사용자 app_metadata 업데이트

```sql
-- 기존 사용자들의 app_metadata 일괄 업데이트
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', (SELECT role FROM public.users WHERE id = auth.users.id),
    'is_approved', (SELECT is_approved FROM public.users WHERE id = auth.users.id),
    'organization', (SELECT organization FROM public.users WHERE id = auth.users.id)
  )
WHERE id IN (SELECT id FROM public.users);
```

### 3. 보안 주의사항

⚠️ **SECURITY DEFINER**:
- 함수가 생성자 권한으로 실행됨
- `auth.users` 테이블 직접 접근 가능
- SQL Injection 방지 필수

✅ **Best Practice**:
- 사용자 입력값 검증
- Prepared Statement 사용
- 최소 권한 원칙

## 📝 체크리스트

### 구현
- [ ] `handle_new_user` 함수 수정
- [ ] `sync_user_approval_to_jwt` 함수 생성
- [ ] `sync_user_role_to_jwt` 함수 생성
- [ ] RLS 정책 수정
- [ ] 기존 사용자 app_metadata 업데이트

### 테스트
- [ ] 신규 회원가입 후 JWT 확인
- [ ] 승인 처리 후 JWT 갱신 확인
- [ ] role 변경 후 JWT 갱신 확인
- [ ] RLS 정책 동작 확인
- [ ] 조직별 필터링 동작 확인

### 배포
- [ ] Supabase Dashboard에서 SQL 실행
- [ ] 또는 마이그레이션 파일로 적용
- [ ] 프로덕션 환경 배포 전 스테이징 테스트

## 📚 참고 자료

- [Supabase Auth Metadata](https://supabase.com/docs/guides/auth/managing-user-data#user-metadata)
- [Supabase Custom Claims](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
- [Supabase RLS with JWT](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

---

**작성일**: 2025-10-30
**우선순위**: High
**예상 소요 시간**: 1-2시간
