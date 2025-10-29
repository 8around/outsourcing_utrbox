# 019. Supabase 데이터 조회 연동 계획

**작성일**: 2025-10-28
**목적**: Mock 데이터에서 Supabase 실제 데이터 조회로 완전 전환

---

## 1. 개요

### 1.1 작업 목적
- **현재 상황**: 컬렉션 생성/파일 업로드는 Supabase 연동 완료, 데이터 조회는 Mock 데이터 사용
- **목표**: 사용자의 실제 컬렉션과 콘텐츠를 Supabase에서 조회하도록 완전히 연동

### 1.2 현재 상태
- ✅ `lib/api/collections.ts`: `createCollection()` 함수만 존재
- ✅ `lib/api/contents.ts`: `uploadContent()` 함수만 존재
- ❌ `app/(user)/page.tsx`: Mock 데이터 사용 (`mockContents`, `mockCollections`)
- ❌ `app/(user)/collections/[id]/page.tsx`: Mock 데이터 사용
- ❌ 탐지 건수 및 분석 상태: Mock 함수 (`getDetectionCount`, `getAnalysisStatus`)

---

## 2. API 레이어 확장

### 2.1 `lib/api/collections.ts` 추가 함수

**추가할 함수:**

```typescript
// 사용자의 모든 컬렉션 조회
export async function getCollections(userId: string): Promise<ApiResponse<Collection[]>>

// 특정 컬렉션 상세 조회
export async function getCollection(id: string): Promise<ApiResponse<Collection>>
```

**구현 포인트:**
- RLS 정책에 따라 `auth.uid() = user_id` 자동 필터링
- `created_at DESC` 정렬
- 에러 처리 및 `ApiResponse<T>` 형식 반환

---

### 2.2 `lib/api/contents.ts` 추가 함수

**추가할 함수:**

```typescript
// 사용자의 모든 콘텐츠 조회
export async function getContents(userId: string): Promise<ApiResponse<Content[]>>

// 특정 컬렉션(또는 미분류)의 콘텐츠 조회
export async function getContentsByCollection(
  userId: string,
  collectionId: string | null
): Promise<ApiResponse<Content[]>>

// 특정 콘텐츠 상세 조회
export async function getContent(id: string): Promise<ApiResponse<Content>>
```

**구현 포인트:**
- `collectionId === null`인 경우 미분류 콘텐츠 조회
- RLS 정책에 따라 자동 필터링
- `created_at DESC` 정렬

---

### 2.3 `lib/api/detections.ts` 신규 생성

**추가할 함수:**

```typescript
// 특정 콘텐츠의 탐지 건수 조회
export async function getDetectionCount(contentId: string): Promise<ApiResponse<number>>

// 특정 콘텐츠의 탐지 결과 조회 (옵션)
export async function getDetections(contentId: string): Promise<ApiResponse<DetectedContent[]>>
```

**구현 포인트:**
- `detected_contents` 테이블에서 COUNT 쿼리
- RLS 정책: 사용자는 'match' 상태만 조회 가능
- 에러 처리 및 기본값 0 반환

**데이터베이스 스키마 참고:**
```sql
-- detected_contents 테이블
CREATE TABLE public.detected_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  source_url TEXT,
  image_url TEXT NOT NULL,
  page_title TEXT,
  detection_type TEXT CHECK (detection_type IN ('full', 'partial', 'similar')) NOT NULL,
  admin_review_status TEXT CHECK (admin_review_status IN ('pending', 'match', 'no_match', 'cannot_compare')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 2.4 유틸리티 함수 이동

**기존 위치:** `lib/mock-data/contents.ts`의 `getDetectionCount()`
**새 위치:** `lib/api/detections.ts`로 실제 API 구현

**기존 위치:** `types/content.ts`의 `getAnalysisStatus()`
**유지:** 이 함수는 클라이언트 헬퍼이므로 그대로 유지

```typescript
// types/content.ts (유지)
export function getAnalysisStatus(content: Content): AnalysisStatus {
  if (content.is_analyzed === null) return 'pending'
  if (content.is_analyzed === false) {
    return content.message ? 'failed' : 'analyzing'
  }
  return 'completed'
}
```

---

## 3. 페이지 컴포넌트 수정

### 3.1 `app/(user)/page.tsx` 변경 사항

**Before (Mock 사용):**
```typescript
import { mockContents, mockCollections, getDetectionCount } from '@/lib/mock-data'

useEffect(() => {
  const loadData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const userContents = mockContents.filter((c) => c.user_id === user?.id)
    const userCollections = mockCollections.filter((c) => c.user_id === user?.id)
    setContents(userContents)
    setCollections(userCollections)
    setIsLoading(false)
  }
  loadData()
}, [user, setContents, setCollections])

const userContents = mockContents.filter((c) => c.user_id === user?.id)
const userCollections = mockCollections.filter((c) => c.user_id === user?.id)
```

**After (Supabase 연동):**
```typescript
import { getCollections } from '@/lib/api/collections'
import { getContents } from '@/lib/api/contents'
import { getDetectionCount } from '@/lib/api/detections'

const [userContents, setUserContents] = useState<Content[]>([])
const [userCollections, setUserCollections] = useState<Collection[]>([])
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const loadData = async () => {
    if (!user) return

    try {
      const [collectionsRes, contentsRes] = await Promise.all([
        getCollections(user.id),
        getContents(user.id)
      ])

      if (collectionsRes.success && collectionsRes.data) {
        setUserCollections(collectionsRes.data)
      } else {
        setError(collectionsRes.error || '컬렉션을 불러올 수 없습니다.')
      }

      if (contentsRes.success && contentsRes.data) {
        setUserContents(contentsRes.data)
      } else {
        setError(contentsRes.error || '콘텐츠를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }
  loadData()
}, [user])
```

**추가 변경 사항:**
- `useContentStore` 제거 (직접 로컬 상태 사용)
- `getDetectionCount()` Mock 함수 대신 API 호출로 변경
- `totalDetections` 계산 로직 수정 (API에서 가져온 탐지 건수 합산)
- 에러 상태 추가 및 UI 표시

---

### 3.2 `app/(user)/collections/[id]/page.tsx` 변경 사항

**동일한 패턴으로 수정:**
- Mock 데이터 대신 `getCollections()`, `getContents()` API 호출
- `currentCollection` 조회 로직 변경
- `displayData` 계산을 서버 데이터 기반으로 변경
- 에러 처리 추가

---

### 3.3 에러 처리 개선

**추가할 상태:**
```typescript
const [error, setError] = useState<string | null>(null)
```

**에러 UI:**
```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

if (error) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>데이터 로드 실패</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
}
```

---

## 4. 상태 관리 전략

### 4.1 `useContentStore` 제거

**현재 상황:**
- `setContents()`, `setCollections()` 함수만 사용
- 실제로는 로컬 상태와 동일한 역할

**결정: 제거**
- 페이지별로 직접 API 호출하고 로컬 상태 관리
- Zustand 스토어는 불필요 (단순 조회만 하므로)
- 각 페이지에서 독립적으로 데이터 관리

**대안 (향후 고려):**
- 캐싱이 필요하다면 React Query나 SWR 도입 고려
- 현재는 단순 구현 우선

---

## 5. 구현 단계

### Phase 1: API 함수 구현
1. **`lib/api/collections.ts` 확장**
   - `getCollections(userId)` 추가
   - `getCollection(id)` 추가

2. **`lib/api/contents.ts` 확장**
   - `getContents(userId)` 추가
   - `getContentsByCollection(userId, collectionId)` 추가
   - `getContent(id)` 추가

3. **`lib/api/detections.ts` 신규 생성**
   - `getDetectionCount(contentId)` 추가
   - `getDetections(contentId)` 추가 (옵션)

---

### Phase 2: 페이지 컴포넌트 수정
1. **`app/(user)/page.tsx` Supabase 연동**
   - Mock 데이터 import 제거
   - API 호출로 변경
   - 로컬 상태로 변경 (useContentStore 제거)
   - 에러 처리 추가

2. **`app/(user)/collections/[id]/page.tsx` Supabase 연동**
   - Mock 데이터 import 제거
   - API 호출로 변경
   - 로컬 상태로 변경
   - 에러 처리 추가

---

### Phase 3: 탐지 건수 통합
1. **`getDetectionCount()` API 통합**
   - 각 콘텐츠별 탐지 건수 조회
   - `totalDetections` 계산 로직 수정

2. **StatsCards 데이터 정확성 검증**
   - 실제 Supabase 데이터 기반으로 통계 표시
   - 분석 완료 콘텐츠 개수 정확성 확인

---

### Phase 4: 테스트 및 검증
1. 빌드 확인 (`npm run build`)
2. 로컬 개발 서버 테스트
3. 수동 테스트 (아래 체크리스트)

---

## 6. 테스트 계획

### 6.1 수동 테스트 체크리스트

**루트 페이지 (`/`):**
- [ ] 컬렉션 목록 표시
- [ ] 미분류 콘텐츠 표시
- [ ] StatsCards 통계 정확성 (총 콘텐츠, 분석 완료, 총 탐지 건수, 총 컬렉션)
- [ ] 로딩 상태 표시
- [ ] 에러 상태 처리

**컬렉션 페이지 (`/collections/[id]`):**
- [ ] 선택된 컬렉션의 콘텐츠만 표시
- [ ] 컬렉션이 없으면 루트로 리다이렉트
- [ ] Breadcrumb에 컬렉션 이름 표시
- [ ] 로딩/에러 상태 처리

**업로드 후 확인:**
- [ ] 새 컬렉션 생성 → 목록에 즉시 반영
- [ ] 파일 업로드 → 콘텐츠 목록에 즉시 반영
- [ ] 미분류 업로드 → 루트 페이지에 표시

**분석 상태 표시:**
- [ ] `is_analyzed === null`: "분석 대기" 표시
- [ ] `is_analyzed === false` + `message === null`: "분석 중" 표시
- [ ] `is_analyzed === false` + `message !== null`: "분석 실패" + 에러 메시지 표시
- [ ] `is_analyzed === true`: "분석 완료" 표시

---

### 6.2 예상 시나리오

**시나리오 1: 신규 사용자**
- 컬렉션 없음, 콘텐츠 없음
- 빈 상태 UI 표시

**시나리오 2: 기존 사용자**
- 컬렉션 3개, 콘텐츠 10개
- 정상적으로 모든 데이터 표시

**시나리오 3: 네트워크 에러**
- Supabase 연결 실패
- 에러 메시지 표시

**시나리오 4: RLS 정책 확인**
- 다른 사용자의 데이터는 조회되지 않음
- 본인의 데이터만 표시

---

## 7. 주의사항

### 7.1 RLS 정책 의존성
- Supabase RLS 정책이 올바르게 설정되어 있어야 함
- `is_approved_user()` 함수가 정상 동작해야 함
- 승인되지 않은 사용자는 데이터 조회 불가

```sql
-- RLS 정책 예시 (DATABASE_SCHEMA.md 참조)
CREATE POLICY "Approved users can view own collections"
  ON public.collections
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );

CREATE POLICY "Approved users can view own contents"
  ON public.contents
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.is_approved_user()
  );
```

### 7.2 성능 고려
- **현재 구현**: `getDetectionCount()` 호출이 콘텐츠 개수만큼 발생
- **향후 개선 고려**:
  - 한 번에 모든 탐지 건수 조회하는 API 추가
  - `getContentsWithDetectionCounts(userId)` 같은 통합 API
  - PostgreSQL JOIN 쿼리로 최적화

### 7.3 타입 안정성
- `Database` 타입 (`types/database.type.ts`) 활용
- Supabase 응답을 적절한 타입으로 캐스팅
- `as Content`, `as Collection` 타입 단언 사용

---

## 8. 구현 순서

1. ✅ 계획 문서 작성 (`docs/019_Supabase_데이터_조회_연동_계획.md`)
2. ⏳ Phase 1: API 레이어 확장
3. ⏳ Phase 2: 페이지 컴포넌트 수정
4. ⏳ Phase 3: 탐지 건수 통합
5. ⏳ Phase 4: 테스트 및 검증

---

**최종 수정일**: 2025-10-28
**작성자**: Claude Code
**관련 문서**: `018_컬렉션_업로드_Supabase_연동_계획.md`
