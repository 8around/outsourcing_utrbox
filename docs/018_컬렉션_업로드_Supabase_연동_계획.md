# 컬렉션 및 업로드 기능 Supabase 연동 계획

**작성일**: 2025-10-28
**상태**: 구현 예정
**우선순위**: 높음

## 📋 1. 배경 및 목적

### 1.1 배경
- 현재 Mock API를 사용하여 업로드 기능 구현됨
- 실제 데이터베이스 연동 필요
- 컬렉션 생성 기능 미구현

### 1.2 목적
- **실제 Supabase 데이터베이스** 연동
- **컬렉션 생성 기능** 추가
- **파일 업로드**를 Supabase Storage와 연동
- 사용자가 콘텐츠를 효율적으로 관리할 수 있는 환경 제공

## 📊 2. 현재 상태 분석

### 2.1 구현 완료 사항
✅ **UploadModal 컴포넌트**
- 모달 형식으로 파일 업로드 UI 구현
- 드래그 앤 드롭 지원
- 여러 파일 batch 업로드
- Mock API 사용 중

✅ **ExplorerToolbar 컴포넌트**
- 파일 탐색기 툴바
- 업로드 버튼 존재
- 현재 컬렉션 정보 props로 전달

✅ **Supabase 인프라**
- Supabase 클라이언트 설정 완료 (lib/supabase/client.ts)
- Storage bucket 'contents' 생성 완료
- 데이터베이스 스키마 정의 완료

### 2.2 미구현 사항
❌ **컬렉션 생성 기능**
- UI 없음
- API 없음

❌ **실제 Supabase 연동**
- 현재 Mock API 사용
- Storage 업로드 미구현
- Database 삽입 미구현

## 🎯 3. 요구사항 정의

### 3.1 기능 요구사항

#### FR-1: 컬렉션 생성
- **설명**: 사용자가 새 컬렉션을 생성할 수 있어야 함
- **조건**:
  - 루트 경로에서만 컬렉션 생성 버튼 표시
  - 컬렉션 이름 입력 필수
  - 사용자별 컬렉션 이름 중복 불가
- **결과**: Supabase collections 테이블에 삽입

#### FR-2: 파일 업로드 (Supabase 연동)
- **설명**: 실제 Supabase Storage에 파일 업로드
- **조건**:
  - 업로드 버튼은 항상 표시
  - 컬렉션 지정은 선택사항 (nullable)
  - 10MB 이하, PNG/JPEG 형식만 허용
- **결과**:
  - Storage에 파일 저장
  - contents 테이블에 메타데이터 저장

#### FR-3: 조건부 버튼 렌더링
- **컬렉션 추가 버튼**: 루트 경로에서만 표시
- **업로드 버튼**: 항상 표시

### 3.2 비기능 요구사항

#### NFR-1: 성능
- 파일 업로드 진행률 표시
- 비동기 처리로 UI 블로킹 방지

#### NFR-2: 사용자 경험
- 명확한 에러 메시지
- 업로드 성공 시 토스트 알림
- 컬렉션 자동 선택 (컬렉션 내부에서 업로드 시)

#### NFR-3: 데이터 무결성
- 파일 경로 중복 방지 (타임스탬프 사용)
- 트랜잭션 처리 (Storage 실패 시 DB 롤백)

## 🎨 4. UI/UX 설계

### 4.1 버튼 렌더링 전략

```typescript
// ExplorerToolbar.tsx
const isRootPath = currentCollection === null

// 렌더링 조건
{isRootPath && <CreateCollectionButton />}  // 루트에서만
<UploadButton />                             // 항상 표시
```

**근거**:
- **컬렉션 추가**: 루트에서만 표시하여 계층 구조 명확화
- **업로드**: 항상 표시하여 유연성 제공
  - 컬렉션 내부: 해당 컬렉션에 자동 할당
  - 루트: 사용자가 컬렉션 선택 (선택 안 함도 가능)

### 4.2 사용자 흐름도

#### 4.2.1 컬렉션 생성 흐름
```
1. 사용자가 루트 경로에 있음
2. "컬렉션 추가" 버튼 클릭
3. CreateCollectionModal 열림
4. 컬렉션 이름 입력
5. "생성" 버튼 클릭
6. Supabase API 호출
7. 성공 시:
   - 모달 닫힘
   - 토스트 알림 표시
   - 컬렉션 목록 갱신
8. 실패 시:
   - 에러 메시지 표시
   - 모달 유지 (재시도 가능)
```

#### 4.2.2 파일 업로드 흐름 (컬렉션 지정)
```
1. 사용자가 컬렉션 내부에 있음
2. "업로드" 버튼 클릭
3. UploadModal 열림 (현재 컬렉션 자동 선택)
4. 파일 선택 (드래그 앤 드롭 또는 클릭)
5. 제목 입력, 컬렉션 확인/변경
6. "전체 업로드" 클릭
7. Supabase API 호출:
   a. Storage에 파일 업로드
   b. contents 테이블에 메타데이터 삽입
8. 성공 시:
   - 모달 닫힘
   - 토스트 알림
   - 콘텐츠 목록 갱신
```

#### 4.2.3 파일 업로드 흐름 (컬렉션 미지정)
```
1. 사용자가 루트 또는 컬렉션 선택 "안 함" 선택
2. "업로드" 버튼 클릭
3. UploadModal 열림
4. 파일 선택
5. 컬렉션 "선택 안함" 상태
6. "전체 업로드" 클릭
7. Supabase API 호출:
   a. Storage에 파일 업로드 (uncategorized 폴더)
   b. contents 테이블에 collection_id = NULL로 삽입
8. 성공 시:
   - 모달 닫힘
   - 토스트 알림
```

## 🗄️ 5. 데이터베이스 설계

### 5.1 Collections 테이블

```sql
CREATE TABLE public.collections (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Collection Info
  name TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraints
ALTER TABLE public.collections
  ADD CONSTRAINT unique_user_collection_name
  UNIQUE (user_id, name);
```

**필드 설명**:
- `id`: 컬렉션 고유 ID (UUID, 자동 생성)
- `user_id`: 소유자 (users 테이블 FK)
- `name`: 컬렉션 이름
- `unique_user_collection_name`: 사용자별 컬렉션명 중복 방지

### 5.2 Contents 테이블

```sql
CREATE TABLE public.contents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,  -- NULL 허용

  -- 파일 정보
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,  -- Supabase Storage 경로

  -- 분석 상태
  is_analyzed BOOLEAN,  -- NULL: 대기, FALSE: 분석중, TRUE: 완료
  message TEXT,         -- 사용자 전달 메시지 또는 에러 메시지

  -- AI 분석 결과
  label_data JSONB,     -- LABEL_DETECTION 결과
  text_data JSONB,      -- TEXT_DETECTION 결과

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**필드 설명**:
- `collection_id`: **NULL 허용** → 컬렉션 없이도 업로드 가능
- `file_name`: 원본 파일명
- `file_path`: Storage 경로 (중복 불가)
- `is_analyzed`: 분석 상태 (NULL/FALSE/TRUE)

### 5.3 Storage Bucket 설정

**Bucket 이름**: `contents`

**설정**:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contents',
  'contents',
  false,                                          -- Private (RLS 제어)
  10485760,                                       -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']  -- PNG, JPEG만
);
```

**파일 경로 구조**:
```
contents/
  {userId}/
    {collectionId}/
      {timestamp}_{filename}
    uncategorized/        # collectionId가 null인 경우
      {timestamp}_{filename}
```

## 🔌 6. API 설계

### 6.1 컬렉션 생성 API

**파일**: `lib/api/collections.ts` (신규 생성)

```typescript
import { supabase } from '@/lib/supabase/client'
import { Collection } from '@/types'

interface CreateCollectionParams {
  name: string
  userId: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export async function createCollection(
  params: CreateCollectionParams
): Promise<ApiResponse<Collection>> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: params.name,
        user_id: params.userId,
      })
      .select()
      .single()

    if (error) {
      // 중복 이름 처리
      if (error.code === '23505') {
        return {
          data: null,
          error: '이미 존재하는 컬렉션 이름입니다.',
          success: false,
        }
      }

      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Collection,
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: '컬렉션 생성 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
```

### 6.2 파일 업로드 API

**파일**: `lib/api/contents.ts` (신규 생성)

```typescript
import { supabase } from '@/lib/supabase/client'
import { Content } from '@/types'

interface UploadContentParams {
  file: File
  title: string
  userId: string
  collectionId: string | null  // NULL 허용
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export async function uploadContent(
  params: UploadContentParams,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<Content>> {
  try {
    // 1. Storage 경로 생성
    const timestamp = Date.now()
    const sanitizedFileName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const collectionFolder = params.collectionId || 'uncategorized'
    const filePath = `${params.userId}/${collectionFolder}/${timestamp}_${sanitizedFileName}`

    // 2. Storage에 파일 업로드
    const { data: storageData, error: storageError } = await supabase.storage
      .from('contents')
      .upload(filePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (storageError) {
      return {
        data: null,
        error: `파일 업로드 실패: ${storageError.message}`,
        success: false,
      }
    }

    // 3. Contents 테이블에 메타데이터 저장
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: params.userId,
        collection_id: params.collectionId,  // NULL 가능
        file_name: params.file.name,
        file_path: filePath,
        is_analyzed: null,  // 분석 대기
        message: null,
      })
      .select()
      .single()

    if (contentError) {
      // DB 삽입 실패 시 Storage 파일 삭제 (rollback)
      await supabase.storage.from('contents').remove([filePath])

      return {
        data: null,
        error: `메타데이터 저장 실패: ${contentError.message}`,
        success: false,
      }
    }

    return {
      data: contentData as Content,
      error: null,
      success: true,
    }
  } catch (error) {
    return {
      data: null,
      error: '업로드 중 오류가 발생했습니다.',
      success: false,
    }
  }
}
```

**특징**:
- `collectionId`가 null이면 'uncategorized' 폴더 사용
- Storage 업로드 후 DB 삽입 실패 시 Storage 파일 삭제 (rollback)
- 파일명 sanitization (특수문자 제거)
- 타임스탬프로 파일명 중복 방지

## 🧩 7. 컴포넌트 설계

### 7.1 CreateCollectionModal (신규)

**파일**: `components/explorer/CreateCollectionModal.tsx`

**Props**:
```typescript
interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCollectionCreated?: (collection: Collection) => void
}
```

**기능**:
- Dialog 컴포넌트 기반 모달
- 컬렉션 이름 입력 필드
- 생성 버튼 (로딩 상태 표시)
- 에러 메시지 표시
- 성공 시 콜백 호출

**UI 구조**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>새 컬렉션 만들기</DialogTitle>
    <DialogDescription>
      콘텐츠를 그룹화할 컬렉션을 생성하세요
    </DialogDescription>
  </DialogHeader>

  <Input
    placeholder="컬렉션 이름"
    value={name}
    onChange={...}
  />

  {error && <ErrorMessage />}

  <DialogFooter>
    <Button variant="outline" onClick={close}>취소</Button>
    <Button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? <LoadingSpinner /> : '생성'}
    </Button>
  </DialogFooter>
</Dialog>
```

### 7.2 UploadModal 개선

**파일**: `components/explorer/UploadModal.tsx`

**주요 변경사항**:
1. Mock API 제거
2. `uploadContent()` API 연동
3. 업로드 진행률 콜백 처리
4. 에러 핸들링 개선
5. collectionId nullable 처리

**수정 부분**:
```typescript
// Before (Mock API)
const response = await mockContentsApi.uploadContent({
  userId: user!.id,
  collectionId: item.collectionId,
  title: item.title,
  file: item.file,
})

// After (Supabase API)
const response = await uploadContent(
  {
    file: item.file,
    title: item.title,
    userId: user!.id,
    collectionId: item.collectionId,  // NULL 가능
  },
  (progress) => {
    updateItem(index, { progress })
  }
)
```

### 7.3 ExplorerToolbar 수정

**파일**: `components/explorer/ExplorerToolbar.tsx`

**추가 사항**:
```typescript
// State
const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false)
const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

// 렌더링
{currentCollection === null && (
  <Button onClick={() => setIsCreateCollectionModalOpen(true)}>
    <FolderPlus className="h-4 w-4" />
    <span className="hidden sm:inline">컬렉션 추가</span>
  </Button>
)}

<Button onClick={() => setIsUploadModalOpen(true)}>
  <Upload className="h-4 w-4" />
  <span className="hidden sm:inline">업로드</span>
</Button>

{/* Modals */}
<CreateCollectionModal
  open={isCreateCollectionModalOpen}
  onOpenChange={setIsCreateCollectionModalOpen}
  onCollectionCreated={onRefresh}
/>

<UploadModal
  open={isUploadModalOpen}
  onOpenChange={setIsUploadModalOpen}
  defaultCollectionId={currentCollection?.id || null}
  onUploadComplete={onRefresh}
/>
```

## 🛠️ 8. 구현 단계

### Phase 1: API 레이어 구축 (1시간)
1. ✅ `lib/api/collections.ts` 생성
   - `createCollection()` 함수 구현
   - 에러 핸들링 (중복 이름 등)
2. ✅ `lib/api/contents.ts` 생성
   - `uploadContent()` 함수 구현
   - Storage 업로드 + DB 삽입
   - Rollback 로직

### Phase 2: 컬렉션 생성 기능 (1시간)
1. ✅ `CreateCollectionModal.tsx` 컴포넌트 생성
   - Dialog 기반 UI
   - 입력 검증
   - API 호출 및 에러 처리
2. ✅ ExplorerToolbar에 "컬렉션 추가" 버튼 추가
   - 조건부 렌더링 (`currentCollection === null`)
   - 모달 트리거

### Phase 3: 업로드 기능 Supabase 연동 (2시간)
1. ✅ UploadModal Mock API 제거
2. ✅ `uploadContent()` API 연동
3. ✅ 업로드 진행률 콜백 처리
4. ✅ collectionId nullable 처리
5. ✅ 에러 핸들링 개선

### Phase 4: ExplorerToolbar 버튼 배치 (30분)
1. ✅ 컬렉션 추가 버튼 조건부 렌더링
2. ✅ 업로드 버튼 항상 표시
3. ✅ 버튼 스타일 및 아이콘

### Phase 5: 테스트 및 검증 (1시간)
1. ✅ Playwright E2E 테스트
2. ✅ Supabase DB/Storage 확인
3. ✅ 에러 시나리오 검증

## 🧪 9. 테스트 시나리오

### 9.1 컬렉션 생성 테스트

#### TC-01: 루트에서 컬렉션 생성
- **Given**: 사용자가 루트 경로에 있음
- **When**: "컬렉션 추가" 버튼 클릭 → 이름 입력 → 생성
- **Then**:
  - Supabase collections 테이블에 삽입됨
  - 컬렉션 목록에 새 컬렉션 표시
  - 토스트 알림 표시

#### TC-02: 중복 컬렉션 이름
- **Given**: "프로젝트 A" 컬렉션 존재
- **When**: "프로젝트 A" 이름으로 생성 시도
- **Then**: "이미 존재하는 컬렉션 이름입니다" 에러 표시

#### TC-03: 컬렉션 내부에서 버튼 숨김
- **Given**: 사용자가 컬렉션 내부에 있음
- **When**: 페이지 렌더링
- **Then**: "컬렉션 추가" 버튼이 표시되지 않음

### 9.2 파일 업로드 테스트 (컬렉션 지정)

#### TC-04: 컬렉션 내부에서 업로드
- **Given**: 사용자가 "프로젝트 A" 컬렉션 내부에 있음
- **When**: 업로드 버튼 클릭 → 파일 선택 → 업로드
- **Then**:
  - "프로젝트 A" 컬렉션 자동 선택됨
  - Storage에 파일 업로드: `{userId}/{collectionId}/{timestamp}_{filename}`
  - contents 테이블에 collection_id 포함하여 삽입
  - 업로드 진행률 표시

#### TC-05: 여러 파일 batch 업로드
- **Given**: 사용자가 여러 파일 선택
- **When**: "전체 업로드" 클릭
- **Then**:
  - 모든 파일이 순차적으로 업로드됨
  - 각 파일의 진행 상태 표시
  - 성공 개수 토스트 알림

### 9.3 파일 업로드 테스트 (컬렉션 미지정)

#### TC-06: 루트에서 컬렉션 없이 업로드
- **Given**: 사용자가 루트 경로에 있음
- **When**: 업로드 → 컬렉션 "선택 안함" → 업로드
- **Then**:
  - Storage 경로: `{userId}/uncategorized/{timestamp}_{filename}`
  - contents 테이블에 collection_id = NULL로 삽입

### 9.4 에러 시나리오 테스트

#### TC-07: Storage 업로드 실패
- **Given**: Storage에 문제 발생 (네트워크 등)
- **When**: 파일 업로드 시도
- **Then**:
  - 에러 메시지 표시
  - DB에 레코드 생성되지 않음
  - 재시도 가능

#### TC-08: DB 삽입 실패
- **Given**: DB에 문제 발생
- **When**: Storage 업로드 후 DB 삽입 시도
- **Then**:
  - Storage에 업로드된 파일 자동 삭제 (rollback)
  - 에러 메시지 표시

#### TC-09: 파일 크기 초과
- **Given**: 10MB를 초과하는 파일
- **When**: 업로드 시도
- **Then**:
  - 클라이언트에서 미리 검증하여 거부
  - "파일 크기는 10MB 이하여야 합니다" 메시지

## ⚠️ 10. 예상 문제 및 해결 방안

### 10.1 RLS 정책 문제

**문제**: Supabase RLS 정책이 올바르게 설정되지 않으면 접근 거부

**해결 방안**:
```sql
-- Collections RLS 정책
CREATE POLICY "Users can CRUD their own collections"
ON public.collections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Contents RLS 정책
CREATE POLICY "Users can CRUD their own contents"
ON public.contents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Storage RLS 정책
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 10.2 파일 경로 중복

**문제**: 동시에 같은 파일명 업로드 시 경로 중복

**해결 방안**:
- 타임스탬프 + 랜덤 문자열 추가
- `${Date.now()}_${Math.random().toString(36).substring(7)}_${filename}`

### 10.3 트랜잭션 실패 시 정리

**문제**: Storage 업로드 성공 후 DB 삽입 실패 시 Storage에 orphan 파일 남음

**해결 방안**:
- DB 삽입 실패 시 Storage 파일 자동 삭제
- 정기적인 orphan 파일 정리 배치 작업

### 10.4 대용량 파일 업로드 시간

**문제**: 10MB 파일 업로드 시 시간 소요

**해결 방안**:
- 업로드 진행률 표시
- 백그라운드 업로드 지원
- 사용자에게 명확한 피드백 제공

## 📊 11. 예상 소요 시간

| 단계 | 작업 내용 | 예상 시간 |
|------|----------|----------|
| 1 | 계획 문서 작성 | 30분 |
| 2 | API 레이어 구축 (collections.ts, contents.ts) | 1시간 |
| 3 | CreateCollectionModal 생성 | 1시간 |
| 4 | UploadModal Supabase 연동 | 2시간 |
| 5 | ExplorerToolbar 버튼 추가 및 수정 | 30분 |
| 6 | 테스트 및 검증 (Playwright) | 1시간 |
| **총계** | | **6시간** |

## 📝 12. 체크리스트

### 구현
- [ ] `lib/api/collections.ts` 생성
- [ ] `lib/api/contents.ts` 생성
- [ ] `CreateCollectionModal.tsx` 생성
- [ ] `UploadModal.tsx` Supabase 연동
- [ ] `ExplorerToolbar.tsx` 버튼 추가

### 테스트
- [ ] 컬렉션 생성 테스트
- [ ] 컬렉션 없이 업로드 테스트
- [ ] 컬렉션 지정 업로드 테스트
- [ ] 버튼 조건부 렌더링 테스트
- [ ] 에러 시나리오 테스트

### 문서화
- [x] 계획 문서 작성
- [ ] FOLDER_STRUCTURE.md 업데이트
- [ ] 구현 완료 후 문서 상태 업데이트

## 🔗 13. 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Supabase RLS 정책](https://supabase.com/docs/guides/auth/row-level-security)
- [React Dropzone 문서](https://react-dropzone.js.org/)
- DATABASE_SCHEMA.md
- PRD.md
