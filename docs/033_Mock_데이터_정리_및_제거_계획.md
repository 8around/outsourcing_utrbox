# Mock 데이터 정리 및 제거 계획

## 목적
초기 퍼블리싱 작업을 위해 정의된 Mock 데이터들을 정리하고, 실제 Supabase 데이터로 완전히 전환하기 위한 계획

## 현재 Mock 데이터 파일 목록

### lib/mock-data/ 디렉터리
- `index.ts` - 중앙 export 파일
- `users.ts` - 사용자 Mock 데이터
- `contents.ts` - 콘텐츠 Mock 데이터
- `collections.ts` - 컬렉션 Mock 데이터
- `analysisResults.ts` - 분석 결과 Mock 데이터
- `detected-contents.ts` - 발견 콘텐츠 Mock 데이터
- `detectedContents.ts` - 발견 콘텐츠 Mock 데이터 (중복?)

### lib/api/mock/ 디렉터리
- `index.ts` - 중앙 export 파일
- `auth.ts` - 인증 Mock API
- `contents.ts` - 콘텐츠 Mock API
- `collections.ts` - 컬렉션 Mock API

### lib/admin/ 디렉터리
- `mock-data.ts` - 관리자 페이지용 Mock 데이터

## 사용 현황 분석

### ✅ 현재 사용 중인 Mock 데이터

#### 1. lib/mock-data/contents.ts
**사용처:** `components/explorer/ContentExplorerView.tsx:15`
```typescript
import { getDetectionCount } from '@/lib/mock-data/contents'
```
**사용 함수:** `getDetectionCount(contentId: string): number`
- Line 168, 172, 241, 244에서 호출
- 콘텐츠별 탐지 건수를 하드코딩된 맵에서 반환

**마이그레이션 경로:**
- 실제 API 이미 존재: `lib/api/detections.ts:27`의 `getDetectionCount()`
- 단순 import 경로 변경으로 해결 가능

#### 2. lib/api/mock/auth.ts
**사용처:** `components/auth/ResetPasswordForm.tsx:18`
```typescript
import { mockAuthApi } from '@/lib/api/mock'
```
**사용 메서드:** `mockAuthApi.resetPassword(email: string)`
- Line 45에서 호출
- 이메일 존재 여부만 확인하고 성공 반환

**마이그레이션 경로:**
- Supabase Auth의 `auth.resetPasswordForEmail()` 사용 필요
- 실제 이메일 발송 기능 구현 필요

#### 3. lib/mock-data/users.ts (간접 사용)
**사용처:** `lib/api/mock/auth.ts:2`에서 import
```typescript
import { mockUsers, findUserByEmail } from '@/lib/mock-data'
```
- mockAuthApi가 사용하므로 간접적으로 의존

### ❌ 사용되지 않는 Mock 데이터

#### 완전 미사용 파일들
1. **lib/admin/mock-data.ts**
   - 어디에서도 import되지 않음
   - 관리자 페이지가 이미 실제 Supabase 데이터 사용 중
   - 즉시 제거 가능

2. **lib/api/mock/contents.ts**
   - mockContentsApi 정의만 있고 실제 사용처 없음
   - 문서(docs/)에서만 참조
   - 즉시 제거 가능

3. **lib/api/mock/collections.ts**
   - mockCollectionsApi 정의만 있고 실제 사용처 없음
   - 문서(docs/)에서만 참조
   - 즉시 제거 가능

4. **lib/mock-data/analysisResults.ts**
   - lib/api/mock/contents.ts에서만 import
   - 실제 사용처 없음
   - 즉시 제거 가능

5. **lib/mock-data/collections.ts**
   - lib/api/mock/collections.ts에서만 import
   - 실제 사용처 없음
   - 즉시 제거 가능

6. **lib/mock-data/detectedContents.ts 또는 detected-contents.ts**
   - 중복 파일 의심
   - lib/api/mock/contents.ts에서만 import
   - 실제 사용처 없음
   - 확인 후 제거 가능

## 제거 계획

### Phase 1: 완전 미사용 파일 즉시 제거 (우선순위: 높음)

**제거 대상:**
```
lib/admin/mock-data.ts
lib/api/mock/contents.ts
lib/api/mock/collections.ts
lib/mock-data/analysisResults.ts
lib/mock-data/collections.ts
lib/mock-data/detectedContents.ts (또는 detected-contents.ts 중 하나)
```

**작업 순서:**
1. 각 파일의 import 재확인 (혹시 놓친 사용처가 있는지)
2. Git에서 완전 삭제
3. FOLDER_STRUCTURE.md 업데이트

**예상 소요 시간:** 30분

**리스크:** 낮음 (사용처 없음 확인 완료)

### Phase 2: ContentExplorerView UI 재배치 및 실제 API 마이그레이션 (우선순위: 높음)

#### 변경 요구사항

**1. 발견 건수 뱃지 위치 및 스타일 변경**
- **현재 위치:** Grid View - 썸네일 우측 상단 (Line 168-175), List View - status 뱃지 옆 (Line 241-246)
- **변경 위치:** Info 섹션의 status 뱃지 바로 옆
- **스타일 참고:** `components/admin/contents/ContentTableClient.tsx:141-143`
- **0건 처리:** outline variant 뱃지로 표시 (기존에는 0건일 때 렌더링 안 함)

**2. 컬렉션 명 뱃지 추가**
- **위치:** 기존 발견 건수 뱃지가 있던 위치 (Grid: 썸네일 우측 상단, List: status 뱃지 옆)
- **스타일:** outline variant 뱃지
- **조건:** collection_id가 null이 아닐 때만 렌더링

**3. Mock 데이터에서 실제 API로 전환**
- Mock `getDetectionCount` 제거
- 실제 `lib/api/detections.ts`의 API 사용

#### 현재 상태 분석

```typescript
// components/explorer/ContentExplorerView.tsx:15
import { getDetectionCount } from '@/lib/mock-data/contents'

// Grid View - 썸네일 우측 상단 (Line 168-175)
{getDetectionCount(content.id) > 0 && (
  <div className="absolute right-2 top-2">
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      {getDetectionCount(content.id)}
    </Badge>
  </div>
)}

// Grid View - Info 섹션 (Line 184-191) - 현재 status만 있음
<div className="mt-2 flex items-center justify-between">
  <Badge variant="secondary" className={getStatusColor(content)}>
    {getStatusText(content)}
  </Badge>
  <span className="text-secondary-400 text-xs">
    {format(new Date(content.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
  </span>
</div>

// List View - status 뱃지 옆 (Line 237-246)
<div className="mt-1 flex items-center gap-2">
  <Badge variant="secondary" className={getStatusColor(content)}>
    {getStatusText(content)}
  </Badge>
  {getDetectionCount(content.id) > 0 && (
    <span className="text-error flex items-center gap-1 text-xs">
      <AlertCircle className="h-3 w-3" />
      {getDetectionCount(content.id)}건
    </span>
  )}
</div>
```

#### 마이그레이션 후 코드

```typescript
// components/explorer/ContentExplorerView.tsx
import { getDetectionCount } from '@/lib/api/detections'
import { useState, useEffect } from 'react'

// 컴포넌트 내부
const [detectionCounts, setDetectionCounts] = useState<Record<string, number>>({})

useEffect(() => {
  // 콘텐츠 목록 로드 시 탐지 건수도 함께 조회
  const loadDetectionCounts = async () => {
    const counts: Record<string, number> = {}
    for (const content of contents) {
      const result = await getDetectionCount(content.id)
      if (result.success && result.data !== null) {
        counts[content.id] = result.data
      }
    }
    setDetectionCounts(counts)
  }
  loadDetectionCounts()
}, [contents])

// 컬렉션 이름 조회 함수
const getCollectionName = (collectionId: string | null): string | null => {
  if (!collectionId) return null
  const collection = collections.find(c => c.id === collectionId)
  return collection?.name || null
}

// Grid View - 썸네일 우측 상단 (컬렉션 명 뱃지)
{getCollectionName(content.collection_id) && (
  <div className="absolute right-2 top-2">
    <Badge variant="outline" className="text-xs">
      {getCollectionName(content.collection_id)}
    </Badge>
  </div>
)}

// Grid View - Info 섹션 (status + 발견 건수)
<div className="mt-2 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Badge variant="secondary" className={getStatusColor(content)}>
      {getStatusText(content)}
    </Badge>
    {/* 발견 건수 뱃지 - ContentTableClient 스타일 참고 */}
    {(detectionCounts[content.id] || 0) > 0 ? (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
        {detectionCounts[content.id]}건
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-400">
        0건
      </Badge>
    )}
  </div>
  <span className="text-secondary-400 text-xs">
    {format(new Date(content.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
  </span>
</div>

// List View - status 뱃지 옆 (컬렉션 명 + 발견 건수)
<div className="mt-1 flex items-center gap-2">
  <Badge variant="secondary" className={getStatusColor(content)}>
    {getStatusText(content)}
  </Badge>
  {/* 발견 건수 뱃지 - ContentTableClient 스타일 */}
  {(detectionCounts[content.id] || 0) > 0 ? (
    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
      {detectionCounts[content.id]}건
    </Badge>
  ) : (
    <Badge variant="outline" className="text-gray-400">
      0건
    </Badge>
  )}
  {/* 컬렉션 명 뱃지 */}
  {getCollectionName(content.collection_id) && (
    <Badge variant="outline" className="text-xs">
      {getCollectionName(content.collection_id)}
    </Badge>
  )}
</div>
```

#### 성능 최적화 고려사항

**문제점:**
- 콘텐츠 개수만큼 API 호출 발생 (N+1 문제)
- 예: 20개 콘텐츠 → 20번 API 호출

**최적화 방안:**
1. **Backend에서 탐지 건수를 JOIN으로 함께 반환 (권장)**
   - Contents 조회 쿼리 수정:
   ```sql
   SELECT
     c.*,
     COUNT(dc.id) as detected_count
   FROM contents c
   LEFT JOIN detected_contents dc ON c.id = dc.content_id
   GROUP BY c.id
   ```
   - API 응답에 `detected_count` 필드 포함
   - Frontend에서 별도 API 호출 불필요

2. **배치 조회 API 추가**
   - `getDetectionCounts(contentIds: string[]): Promise<Record<string, number>>`
   - 한 번의 API 호출로 여러 콘텐츠의 탐지 건수 조회

**작업 순서:**
1. ✅ 요구사항 분석 및 계획 문서 업데이트
2. Backend API 수정 (성능 최적화 방안 적용)
   - Contents 조회 시 detected_count JOIN 추가
   - API 응답 타입에 detected_count 필드 추가
3. ContentExplorerView.tsx 수정
   - Mock getDetectionCount import 제거
   - 컬렉션 명 조회 함수 추가
   - UI 재배치 (발견 건수 → Info 섹션, 컬렉션 명 → 기존 위치)
   - 스타일 변경 (ContentTableClient 참고)
   - 0건일 때 outline variant 표시
4. 타입 정의 업데이트 (`types/content.ts`)
5. 테스트
   - 발견 건수 정상 표시 확인
   - 컬렉션 명 정상 표시 확인
   - 0건일 때 outline variant 확인
   - 성능 테스트 (API 호출 횟수 확인)

**예상 소요 시간:** 3-4시간
- Backend API 수정: 1-2시간
- Frontend 수정: 1.5시간
- 테스트: 0.5시간

**리스크:** 중간
- Backend 수정 필요 (개발자 승인 및 협업 필요)
- 타입 정의 변경으로 인한 영향 범위 확인 필요

### Phase 3: ResetPasswordForm의 인증 API 마이그레이션 (우선순위: 중간)

**현재 상태:**
```typescript
// components/auth/ResetPasswordForm.tsx:18
import { mockAuthApi } from '@/lib/api/mock'

// Line 45
const response = await mockAuthApi.resetPassword(data.email)
```

**마이그레이션 후:**
```typescript
// components/auth/ResetPasswordForm.tsx
import { supabase } from '@/lib/supabase/client'

// Line 45 대체
const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  redirectTo: `${window.location.origin}/reset-password/confirm`,
})

if (error) {
  toast({
    variant: 'destructive',
    title: '오류',
    description: error.message || '비밀번호 재설정에 실패했습니다.',
  })
} else {
  setIsSuccess(true)
}
```

**필요 작업:**
1. Supabase Email Templates 설정 확인
2. Password Reset Redirect URL 설정
3. `/reset-password/confirm` 페이지 구현 (아직 없다면)
4. 이메일 발송 테스트

**작업 순서:**
1. Supabase 프로젝트 설정에서 Email Templates 확인
2. Reset Password 이메일 템플릿 커스터마이징 (필요시)
3. ResetPasswordForm.tsx 수정
4. 실제 이메일 발송 테스트

**예상 소요 시간:** 1-2시간

**리스크:** 낮음 (표준 Supabase Auth 기능)

### Phase 4: Mock 데이터 파일 최종 정리 (우선순위: 낮음)

**Phase 2, 3 완료 후 제거 가능한 파일:**
```
lib/mock-data/contents.ts
lib/mock-data/users.ts
lib/api/mock/auth.ts
lib/api/mock/index.ts
lib/mock-data/index.ts
```

**추가 확인 사항:**
- lib/mock-data/detected-contents.ts와 detectedContents.ts 중복 여부 확인
- 혹시 테스트 파일에서 사용하는지 확인

**작업 순서:**
1. Phase 2, 3 완료 확인
2. 남은 파일 사용처 최종 확인
3. Git에서 삭제
4. `lib/mock-data/`, `lib/api/mock/` 디렉터리 삭제
5. FOLDER_STRUCTURE.md 최종 업데이트

**예상 소요 시간:** 30분

**리스크:** 낮음 (이전 단계에서 마이그레이션 완료)

## 예상 일정

### 즉시 실행 가능 (Phase 1)
- **소요 시간:** 30분
- **담당자:** 개발자 승인 후 Claude Code
- **완료 조건:** 미사용 파일 삭제 완료

### 우선 작업 (Phase 2) - UI 재배치 및 API 마이그레이션
- **소요 시간:** 3-4시간
- **우선순위:** 높음
- **담당자:** 개발자와 협업
- **완료 조건:**
  - Backend: Contents 조회 시 detected_count JOIN 추가
  - Frontend: ContentExplorerView UI 재배치 및 실제 API 사용
  - 발견 건수 뱃지 Info 섹션으로 이동
  - 컬렉션 명 뱃지 추가
  - 0건일 때 outline variant 표시
  - 테스트 완료 (기능 및 성능)

### 후속 작업 (Phase 3) - 인증 API 마이그레이션
- **소요 시간:** 1-2시간
- **우선순위:** 중간
- **담당자:** 개발자와 협업
- **완료 조건:**
  - ResetPasswordForm Supabase Auth 사용
  - 이메일 발송 테스트 완료

### 최종 정리 (Phase 4)
- **소요 시간:** 30분
- **담당자:** Claude Code
- **완료 조건:** 모든 Mock 데이터 파일 제거 완료

## 중복 파일 확인 필요

```
lib/mock-data/detectedContents.ts
lib/mock-data/detected-contents.ts
```

두 파일이 모두 존재하는지, 내용이 같은지 확인 필요

## 주의사항

1. **Phase 1 제거 전 최종 확인**
   - 혹시 놓친 import가 있는지 전체 프로젝트 검색
   - 테스트 파일에서 사용하는지 확인

2. **Phase 2 성능 최적화**
   - 콘텐츠 목록이 많을 경우 API 호출 횟수 문제
   - Backend에서 탐지 건수를 함께 반환하는 것이 바람직

3. **Phase 3 이메일 발송 테스트**
   - 실제 이메일이 발송되는지 확인
   - 스팸 폴더에 들어가지 않는지 확인
   - 이메일 템플릿이 적절한지 확인

4. **Git 기록 보존**
   - Mock 데이터 파일들을 완전 삭제하기 전 Git 기록 확인
   - 필요시 별도 브랜치에 백업

## 성공 기준

### Phase 1 (미사용 파일 제거)
- [ ] 6개 미사용 Mock 파일 제거 완료
- [ ] FOLDER_STRUCTURE.md 업데이트

### Phase 2 (ContentExplorerView UI 재배치 및 API 마이그레이션)
- [ ] Backend: Contents 조회 쿼리에 detected_count JOIN 추가
- [ ] Backend: API 응답 타입에 detected_count 필드 포함
- [ ] Frontend: Mock getDetectionCount import 제거
- [ ] Frontend: 발견 건수 뱃지 Info 섹션으로 이동 (status 뱃지 옆)
- [ ] Frontend: ContentTableClient 스타일 적용 (bg-red-100 text-red-700)
- [ ] Frontend: 0건일 때 outline variant 뱃지 표시
- [ ] Frontend: 컬렉션 명 뱃지 추가 (기존 발견 건수 위치)
- [ ] Frontend: 컬렉션 null일 때 렌더링 안 함
- [ ] 타입 정의 업데이트 (types/content.ts)
- [ ] Grid View 정상 작동 확인
- [ ] List View 정상 작동 확인
- [ ] 성능 테스트 (API 호출 1회로 감소 확인)

### Phase 3 (인증 API 마이그레이션)
- [ ] ResetPasswordForm Supabase Auth 사용
- [ ] 이메일 발송 테스트 완료

### Phase 4 (최종 정리)
- [ ] 모든 Mock 데이터 파일 및 디렉터리 제거
- [ ] FOLDER_STRUCTURE.md 최종 업데이트
- [ ] 모든 기능 정상 작동 최종 확인

## 롤백 계획

각 Phase 진행 전 Git 커밋을 생성하여 문제 발생 시 롤백 가능하도록 함

```bash
# Phase 1 전
git commit -m "docs: Mock 데이터 제거 계획 추가"

# Phase 1 후
git commit -m "refactor: 미사용 Mock 데이터 파일 제거 (Phase 1)"

# Phase 2 후
git commit -m "refactor: ContentExplorerView 실제 API로 마이그레이션 (Phase 2)"

# Phase 3 후
git commit -m "refactor: ResetPasswordForm Supabase Auth로 마이그레이션 (Phase 3)"

# Phase 4 후
git commit -m "refactor: 모든 Mock 데이터 파일 제거 완료 (Phase 4)"
```

## 다음 단계

1. **개발자 승인 대기**
   - Phase 1 즉시 실행 가능 여부
   - Phase 2 성능 최적화 방안 결정
   - Phase 3 이메일 설정 확인

2. **Phase 1 실행**
   - 미사용 파일 제거
   - FOLDER_STRUCTURE.md 업데이트

3. **Phase 2, 3 실행 계획 수립**
   - 상세 구현 계획
   - 테스트 계획
