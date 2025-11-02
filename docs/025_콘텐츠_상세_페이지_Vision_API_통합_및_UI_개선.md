# 025. 콘텐츠 상세 페이지 Vision API 통합 및 UI 개선

**작성일**: 2025-10-31
**관련 파일**:
- `app/admin/contents/[id]/page.tsx` (콘텐츠 상세 페이지)
- `app/admin/review/[detectionId]/page.tsx` (비교 검토 페이지 - 디자인 참조)
- `VisionAPIExample.md` (Vision API 응답 예제)
- `claudedocs/google_vision_api_research_20251031.md` (Vision API 사용 가이드)

---

## 📋 목차

1. [개요 및 목표](#1-개요-및-목표)
2. [데이터베이스 스키마 검토](#2-데이터베이스-스키마-검토)
3. [Vision API 통합 계획](#3-vision-api-통합-계획)
4. [API Route 설계](#4-api-route-설계)
5. [모달 컴포넌트 설계](#5-모달-컴포넌트-설계)
6. [UI 재구성 계획](#6-ui-재구성-계획)
7. [실제 데이터 조회 구현](#7-실제-데이터-조회-구현)
8. [순차적 작업 플로우](#8-순차적-작업-플로우)
9. [테스트 계획](#9-테스트-계획)

---

## 1. 개요 및 목표

### 1.1 작업 목표

콘텐츠 상세 페이지를 Google Vision API와 통합하고, 비교 검토 페이지의 디자인을 기반으로 UI를 개선합니다.

**핵심 기능:**
- Mock 데이터 → 실제 Supabase 데이터 전환
- Google Vision API 통합 (LABEL_DETECTION, TEXT_DETECTION, WEB_DETECTION)
- 분석 상태 및 메시지 관리
- 발견 이미지 클릭 시 표시 기능
- 판정 기능 (pending, match, no_match, cannot_compare)
- AI 재분석 기능 (전체/개별)

### 1.2 주요 변경사항

**UI 개선:**
- 파일정보란 재구성 (업로더명, 파일명, 분석상태, 메시지)
- 원본/발견 이미지 좌우 배치
- 줌 컨트롤 완전 제거
- 발견된 유사 콘텐츠 → 이미지 검출 결과 (워딩 변경 + 위치 이동)
- 텍스트 검출 결과 단어별 출력

**기능 추가:**
- 분석 상태/메시지 설정 모달
- 판정 버튼/모달
- AI 분석 요청 모달 (첫 요청/재요청 구분)
- 라벨/텍스트 재검출 버튼

---

## 2. 데이터베이스 스키마 검토

### 2.1 contents 테이블

```sql
CREATE TABLE public.contents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  collection_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,  -- Supabase Storage 경로
  is_analyzed BOOLEAN,              -- NULL: 대기, FALSE: 분석중, TRUE: 완료
  message TEXT,                     -- 사용자 전달 메시지 또는 에러 메시지
  label_data JSONB,                 -- LABEL_DETECTION 원본 응답
  text_data JSONB,                  -- TEXT_DETECTION 원본 응답
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**상태 관리:**
- `NULL + NULL` = 분석 대기
- `FALSE + NULL` = 분석 중
- `TRUE + NULL` = 분석 완료 (메시지 없음)
- `TRUE + "메시지"` = 분석 완료 + 사용자 전달 메시지
- `FALSE + "메시지"` = 분석 실패 + 에러 메시지

### 2.2 detected_contents 테이블

```sql
CREATE TABLE public.detected_contents (
  id UUID PRIMARY KEY,
  content_id UUID NOT NULL,
  source_url TEXT,                  -- 발견된 페이지 URL (없을 수 있음)
  image_url TEXT NOT NULL,          -- 발견된 이미지 URL (필수)
  page_title TEXT,
  detection_type TEXT CHECK (detection_type IN ('full', 'partial', 'similar')),
  admin_review_status TEXT DEFAULT 'pending',  -- pending, match, no_match, cannot_compare
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
);
```

---

## 3. Vision API 통합 계획

### 3.1 Vision API 기능 사용

**첫 요청 시:**
- `LABEL_DETECTION` (기본)
- `TEXT_DETECTION` (선택)
- `WEB_DETECTION` (기본)

**재요청 시:**
- `WEB_DETECTION`만 사용
- 기존 source_url과 중복되지 않는 결과만 저장

**개별 재검출:**
- `LABEL_DETECTION` 또는 `TEXT_DETECTION` 단독 요청
- 기존 데이터 덮어쓰기

### 3.2 Vision API 요청 형식

```typescript
const requestBody = {
  requests: [
    {
      image: {
        source: {
          imageUri: publicUrl  // Supabase Storage publicUrl
        }
      },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION' },
        { type: 'WEB_DETECTION', maxResults: 50 }
      ]
    }
  ]
};
```

### 3.3 Vision API 응답 처리

**LABEL_DETECTION → label_data:**
```typescript
{
  labels: [
    { description: "Fashion", score: 0.9442974 },
    { description: "Long hair", score: 0.78623897 }
  ]
}
```

**TEXT_DETECTION → text_data:**
```typescript
{
  text: "PRIX\nSPOTV news\news.co.kr",
  words: ["PRIX", "SPOTV", "news", "ews.co.kr"]
}
```

**WEB_DETECTION → detected_contents:**
```typescript
webDetection.pagesWithMatchingImages.forEach(page => {
  // source_url 존재 체크
  if (!page.url) return;

  // fullMatchingImages 처리
  page.fullMatchingImages?.forEach(img => {
    if (isWebImageUrl(img.url)) {
      saveDetectedContent({
        source_url: page.url,
        image_url: img.url,
        page_title: page.pageTitle,
        detection_type: 'full'
      });
    }
  });

  // partialMatchingImages 처리
  page.partialMatchingImages?.forEach(img => {
    if (isWebImageUrl(img.url)) {
      saveDetectedContent({
        source_url: page.url,
        image_url: img.url,
        page_title: page.pageTitle,
        detection_type: 'partial'
      });
    }
  });
});
```

**웹 이미지 URL 검증:**
```typescript
function isWebImageUrl(url: string): boolean {
  return url.startsWith('http') &&
         /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}
```

---

## 4. API Route 설계

### 4.1 /api/vision/analyze (첫 요청 + 재요청)

**Request:**
```typescript
POST /api/vision/analyze
{
  contentId: string;
  features: ('label' | 'text' | 'web')[];  // 요청할 기능 선택
  isReanalysis: boolean;  // 재요청 여부
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    labelCount?: number;
    textDetected?: boolean;
    detectedContentsCount?: number;
  }
}
```

**처리 로직:**

1. **contents 조회**
   ```typescript
   const { data: content } = await supabase
     .from('contents')
     .select('id, file_path, is_analyzed')
     .eq('id', contentId)
     .single();
   ```

2. **publicUrl 생성**
   ```typescript
   const { data: { publicUrl } } = supabase.storage
     .from('contents')
     .getPublicUrl(content.file_path);
   ```

3. **Vision API 호출**
   ```typescript
   const visionFeatures = [];
   if (features.includes('label')) visionFeatures.push({ type: 'LABEL_DETECTION', maxResults: 10 });
   if (features.includes('text')) visionFeatures.push({ type: 'TEXT_DETECTION' });
   if (features.includes('web')) visionFeatures.push({ type: 'WEB_DETECTION', maxResults: 50 });

   const response = await fetch(
     `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
     {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ requests: [{ image: { source: { imageUri: publicUrl } }, features: visionFeatures }] })
     }
   );
   ```

4. **is_analyzed 상태 업데이트 (분석 중)**
   ```typescript
   await supabase
     .from('contents')
     .update({ is_analyzed: false })
     .eq('id', contentId);
   ```

5. **응답 데이터 저장**
   ```typescript
   const result = data.responses[0];

   const updates: any = {};
   if (result.labelAnnotations) {
     updates.label_data = { labels: result.labelAnnotations };
   }
   if (result.textAnnotations) {
     updates.text_data = {
       text: result.fullTextAnnotation?.text,
       words: result.textAnnotations.map(t => t.description)
     };
   }

   await supabase
     .from('contents')
     .update(updates)
     .eq('id', contentId);
   ```

6. **WEB_DETECTION 결과 저장**
   ```typescript
   if (result.webDetection?.pagesWithMatchingImages) {
     // 재요청 시 기존 source_url 조회
     let existingUrls: string[] = [];
     if (isReanalysis) {
       const { data: existing } = await supabase
         .from('detected_contents')
         .select('source_url')
         .eq('content_id', contentId);
       existingUrls = existing?.map(d => d.source_url) || [];
     }

     const newDetections = [];

     for (const page of result.webDetection.pagesWithMatchingImages) {
       if (!page.url || (isReanalysis && existingUrls.includes(page.url))) continue;

       // fullMatchingImages 처리
       const fullImage = page.fullMatchingImages?.find(img =>
         img.url?.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(img.url)
       );

       if (fullImage) {
         newDetections.push({
           content_id: contentId,
           source_url: page.url,
           image_url: fullImage.url,
           page_title: page.pageTitle,
           detection_type: 'full',
           admin_review_status: 'pending'
         });
         continue;
       }

       // partialMatchingImages 처리
       const partialImage = page.partialMatchingImages?.find(img =>
         img.url?.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(img.url)
       );

       if (partialImage) {
         newDetections.push({
           content_id: contentId,
           source_url: page.url,
           image_url: partialImage.url,
           page_title: page.pageTitle,
           detection_type: 'partial',
           admin_review_status: 'pending'
         });
       }
     }

     if (newDetections.length > 0) {
       await supabase.from('detected_contents').insert(newDetections);
     }
   }
   ```

7. **is_analyzed 상태 업데이트 (완료)**
   ```typescript
   await supabase
     .from('contents')
     .update({ is_analyzed: true })
     .eq('id', contentId);
   ```

### 4.2 /api/vision/redetect (라벨/텍스트 재검출)

**Request:**
```typescript
POST /api/vision/redetect
{
  contentId: string;
  featureType: 'label' | 'text';
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    labels?: Array<{ description: string; score: number }>;
    text?: string;
    words?: string[];
  }
}
```

**처리 로직:**

1. **contents 조회 및 Vision API 호출** (위와 동일)

2. **결과 덮어쓰기**
   ```typescript
   if (featureType === 'label') {
     await supabase
       .from('contents')
       .update({ label_data: { labels: result.labelAnnotations } })
       .eq('id', contentId);
   } else if (featureType === 'text') {
     await supabase
       .from('contents')
       .update({
         text_data: {
           text: result.fullTextAnnotation?.text,
           words: result.textAnnotations.map(t => t.description)
         }
       })
       .eq('id', contentId);
   }
   ```

### 4.3 /api/contents/[id]/status (분석 상태/메시지 업데이트)

**Request:**
```typescript
PATCH /api/contents/[id]/status
{
  is_analyzed: boolean | null;
  message?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 4.4 /api/detected-contents/[id]/review (판정 업데이트)

**Request:**
```typescript
PATCH /api/detected-contents/[id]/review
{
  admin_review_status: 'pending' | 'match' | 'no_match' | 'cannot_compare';
  reviewed_by: string;  // UUID
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 5. 모달 컴포넌트 설계

### 5.1 AnalysisStatusModal (분석 상태/메시지 설정)

**위치**: `components/admin/contents/AnalysisStatusModal.tsx`

**Props:**
```typescript
interface AnalysisStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  currentStatus: boolean | null;
  currentMessage: string | null;
  onUpdate: () => void;
}
```

**UI 구성:**
- 분석 상태 선택: NULL (대기), FALSE (분석중), TRUE (완료)
- 메시지 입력 (textarea)
- 저장/취소 버튼

**상태 표시:**
- 대기 (NULL): 노란색 Badge
- 분석중 (FALSE): 파란색 Badge
- 완료 (TRUE): 초록색 Badge

### 5.2 ReviewStatusModal (판정 선택)

**위치**: `components/admin/contents/ReviewStatusModal.tsx`

**Props:**
```typescript
interface ReviewStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionId: string;
  currentStatus: string;
  onUpdate: () => void;
}
```

**UI 구성:**
- 현재 상태 제외한 선택지 표시
- pending (대기): 노란색
- match (일치): 빨간색
- no_match (불일치): 초록색
- cannot_compare (판정불가): 회색

### 5.3 AIAnalysisRequestModal (AI 분석 요청)

**위치**: `components/admin/contents/AIAnalysisRequestModal.tsx`

**Props:**
```typescript
interface AIAnalysisRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  isFirstRequest: boolean;  // is_analyzed === null
  onSuccess: () => void;
}
```

**UI 구성 (첫 요청):**
- 체크박스: 라벨 검출 (선택)
- 체크박스: 텍스트 검출 (선택)
- 안내: 이미지 검출 (WEB_DETECTION)은 기본 포함
- 요청 버튼

**UI 구성 (재요청):**
- 안내: 이미지 검출 (WEB_DETECTION)만 재요청됩니다.
- 기존 결과와 중복되지 않는 새로운 결과만 추가됩니다.
- 요청 버튼

### 5.4 RedetectionModal (라벨/텍스트 재검출)

**위치**: `components/admin/contents/RedetectionModal.tsx`

**Props:**
```typescript
interface RedetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  featureType: 'label' | 'text';
  onSuccess: () => void;
}
```

**UI 구성:**
- 타이틀: "라벨 재검출" 또는 "텍스트 재검출"
- 안내: 현재 데이터를 덮어씁니다.
- 재검출 버튼

---

## 6. UI 재구성 계획

### 6.1 파일정보란 재구성

**현재 구조 (비교 검토 페이지 참조):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>발견 정보</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 정보 표시 */}
    </div>
  </CardContent>
</Card>
```

**새로운 구조 (콘텐츠 상세):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>파일 정보</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-sm font-medium text-gray-500">업로더명</p>
        <p className="text-base text-gray-900">{content.user_name || '-'}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">파일명</p>
        <p className="text-base font-semibold text-gray-900">{content.file_name}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">분석 상태</p>
        <div className="mt-1 flex items-center gap-2">
          {getAnalysisStatusBadge(content.is_analyzed, content.message)}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAnalysisStatusModalOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">추가 메시지</p>
        <p className="text-base text-gray-900">{content.message || '-'}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 6.2 원본/발견 이미지 좌우 배치

**레이아웃:**
```tsx
<div className="grid gap-6 lg:grid-cols-2">
  {/* 원본 이미지 */}
  <Card>
    <CardHeader>
      <CardTitle>원본 이미지</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
        <Image
          src={getPublicUrl(content.file_path)}
          alt={content.file_name}
          fill
          className="object-contain"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          다운로드
        </Button>
      </div>
    </CardContent>
  </Card>

  {/* 발견 이미지 */}
  {selectedDetection && (
    <Card>
      <CardHeader>
        <CardTitle>발견 이미지</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
          <Image
            src={selectedDetection.image_url}
            alt="발견된 이미지"
            fill
            className="object-contain"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewStatusModalOpen(true)}
          >
            {selectedDetection.admin_review_status === 'pending' ? '판정' : '판정 수정'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )}
</div>
```

### 6.3 이미지 검출 결과 (발견된 유사 콘텐츠)

**위치 이동**: 레이블/텍스트 검출 결과 상단

**UI 구성:**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>이미지 검출 결과 ({detections.length}건)</CardTitle>
    <Button
      onClick={() => setAIAnalysisModalOpen(true)}
      variant="outline"
      size="sm"
    >
      {content.is_analyzed === null ? 'AI 분석 요청' : 'AI 분석 추가요청'}
    </Button>
  </CardHeader>
  <CardContent>
    {detections.length === 0 ? (
      <p className="py-8 text-center text-sm text-gray-500">
        발견된 이미지가 없습니다.
      </p>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {detections.map((detection) => (
          <div
            key={detection.id}
            onClick={() => setSelectedDetection(detection)}
            className={`cursor-pointer rounded-lg border p-3 transition ${
              selectedDetection?.id === detection.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-400'
            }`}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded border">
              <Image
                src={detection.image_url}
                alt="발견된 이미지"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-2">
              <p className="font-medium text-sm">{detection.page_title || '(제목 없음)'}</p>
              <div className="mt-1 flex items-center gap-2">
                {getDetectionTypeBadge(detection.detection_type)}
                {getReviewStatusBadge(detection.admin_review_status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

### 6.4 레이블/텍스트 검출 결과

**레이블 검출 결과:**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>레이블 검출 결과</CardTitle>
    {content.label_data && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setRedetectType('label');
          setRedetectionModalOpen(true);
        }}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    )}
  </CardHeader>
  <CardContent>
    {content.label_data ? (
      <div className="space-y-2">
        {content.label_data.labels?.map((label, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">{label.description}</span>
            <Badge variant="outline">{(label.score * 100).toFixed(0)}%</Badge>
          </div>
        ))}
      </div>
    ) : (
      <p className="py-8 text-center text-sm text-gray-500">라벨 검출 결과가 없습니다.</p>
    )}
  </CardContent>
</Card>
```

**텍스트 검출 결과 (단어별 출력):**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>텍스트 검출 결과</CardTitle>
    {content.text_data && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setRedetectType('text');
          setRedetectionModalOpen(true);
        }}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    )}
  </CardHeader>
  <CardContent>
    {content.text_data ? (
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="flex flex-wrap gap-2">
          {content.text_data.words?.map((word, idx) => (
            <span
              key={idx}
              className="inline-block rounded bg-white px-2 py-1 text-sm text-gray-900 border"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    ) : (
      <p className="py-8 text-center text-sm text-gray-500">텍스트 검출 결과가 없습니다.</p>
    )}
  </CardContent>
</Card>
```

---

## 7. 실제 데이터 조회 구현

### 7.1 Supabase 클라이언트 설정

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.type'

const supabase = createClientComponentClient<Database>()
```

### 7.2 contents 조회

```typescript
const { data: content, error } = await supabase
  .from('contents')
  .select(`
    id,
    file_name,
    file_path,
    is_analyzed,
    message,
    label_data,
    text_data,
    created_at,
    user:users(name),
    collection:collections(name)
  `)
  .eq('id', contentId)
  .single()

if (error || !content) {
  // 에러 처리
}

// user_name, collection_name 추출
const user_name = content.user?.name
const collection_name = content.collection?.name
```

### 7.3 detected_contents 조회

```typescript
const { data: detections, error: detectionsError } = await supabase
  .from('detected_contents')
  .select('*')
  .eq('content_id', contentId)
  .order('created_at', { ascending: false })

if (detectionsError) {
  // 에러 처리
}
```

### 7.4 Supabase Storage publicUrl 생성

```typescript
function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('contents')
    .getPublicUrl(filePath)

  return data.publicUrl
}
```

### 7.5 실시간 업데이트 (선택)

```typescript
useEffect(() => {
  const channel = supabase
    .channel('content-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'contents',
        filter: `id=eq.${contentId}`
      },
      (payload) => {
        // 상태 업데이트
        setContent(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [contentId])
```

---

## 8. 순차적 작업 플로우

### Phase 1: API Route 구현 (우선순위 최상)

**Task 1.1: Vision API 통합 유틸리티 함수 작성**
- 위치: `lib/google-vision/client.ts`
- 내용: Vision API 호출 함수, 웹 이미지 URL 검증 함수

**Task 1.2: /api/vision/analyze 구현**
- 위치: `app/api/vision/analyze/route.ts`
- 내용: 첫 요청 + 재요청 처리

**Task 1.3: /api/vision/redetect 구현**
- 위치: `app/api/vision/redetect/route.ts`
- 내용: 라벨/텍스트 재검출

**Task 1.4: /api/contents/[id]/status 구현**
- 위치: `app/api/contents/[id]/status/route.ts`
- 내용: 분석 상태/메시지 업데이트

**Task 1.5: /api/detected-contents/[id]/review 구현**
- 위치: `app/api/detected-contents/[id]/review/route.ts`
- 내용: 판정 업데이트

### Phase 2: 모달 컴포넌트 구현

**Task 2.1: AnalysisStatusModal 구현**
- 위치: `components/admin/contents/AnalysisStatusModal.tsx`

**Task 2.2: ReviewStatusModal 구현**
- 위치: `components/admin/contents/ReviewStatusModal.tsx`

**Task 2.3: AIAnalysisRequestModal 구현**
- 위치: `components/admin/contents/AIAnalysisRequestModal.tsx`

**Task 2.4: RedetectionModal 구현**
- 위치: `components/admin/contents/RedetectionModal.tsx`

### Phase 3: 콘텐츠 상세 페이지 UI 재구성

**Task 3.1: Mock 데이터 제거 및 실제 데이터 조회**
- Supabase 클라이언트 설정
- contents 조회
- detected_contents 조회
- publicUrl 생성

**Task 3.2: 파일정보란 재구성**
- 업로더명, 파일명, 분석상태, 메시지 표시
- 분석 상태 설정 버튼 추가

**Task 3.3: 원본/발견 이미지 좌우 배치**
- 줌 컨트롤 제거
- 레이아웃 변경

**Task 3.4: 이미지 검출 결과 섹션 구현**
- 워딩 변경 및 위치 이동
- 클릭 시 발견 이미지 표시
- AI 분석 요청 버튼 추가

**Task 3.5: 레이블/텍스트 검출 결과 섹션 구현**
- 새로고침 버튼 추가
- 텍스트 단어별 출력

**Task 3.6: 발견 이미지 판정 버튼 추가**

### Phase 4: 상태 관리 및 인터랙션

**Task 4.1: 모달 상태 관리**
- useState 훅으로 모달 열기/닫기 상태 관리

**Task 4.2: 선택된 발견 이미지 상태 관리**
- selectedDetection state

**Task 4.3: API 호출 및 에러 처리**
- 로딩 상태
- 성공/실패 토스트

**Task 4.4: 데이터 새로고침**
- API 호출 후 데이터 다시 조회

### Phase 5: 테스트 및 검증

**Task 5.1: API Route 테스트**
- Postman 또는 Thunder Client로 API 테스트

**Task 5.2: UI 테스트**
- 모든 모달 동작 확인
- 버튼 클릭 시 올바른 동작 확인

**Task 5.3: 데이터 플로우 검증**
- Vision API → DB 저장 → UI 표시 전체 플로우 확인

**Task 5.4: 에러 핸들링 테스트**
- Vision API 실패 시나리오
- 네트워크 에러 시나리오

---

## 9. 테스트 계획

### 9.1 API Route 테스트

**Test Case 1: 첫 AI 분석 요청**
```
POST /api/vision/analyze
{
  "contentId": "xxx",
  "features": ["label", "text", "web"],
  "isReanalysis": false
}

Expected:
- is_analyzed: false → true
- label_data 저장
- text_data 저장
- detected_contents 생성
```

**Test Case 2: AI 재요청 (WEB_DETECTION만)**
```
POST /api/vision/analyze
{
  "contentId": "xxx",
  "features": ["web"],
  "isReanalysis": true
}

Expected:
- 기존 source_url과 중복되지 않는 새로운 detected_contents만 추가
```

**Test Case 3: 라벨 재검출**
```
POST /api/vision/redetect
{
  "contentId": "xxx",
  "featureType": "label"
}

Expected:
- label_data 덮어쓰기
```

**Test Case 4: 분석 상태 업데이트**
```
PATCH /api/contents/[id]/status
{
  "is_analyzed": true,
  "message": "분석 완료"
}

Expected:
- is_analyzed, message 업데이트
```

**Test Case 5: 판정 업데이트**
```
PATCH /api/detected-contents/[id]/review
{
  "admin_review_status": "match",
  "reviewed_by": "admin-uuid"
}

Expected:
- admin_review_status, reviewed_by, reviewed_at 업데이트
```

### 9.2 UI 테스트

**Test Case 1: 파일정보란 표시**
- 업로더명, 파일명, 분석상태, 메시지 정확히 표시되는지 확인

**Test Case 2: 분석 상태 설정 모달**
- 모달 열기/닫기
- 상태 선택 및 메시지 입력
- 저장 시 API 호출 및 데이터 업데이트

**Test Case 3: 이미지 검출 결과 클릭**
- 클릭 시 발견 이미지 표시
- 선택된 아이템 하이라이트

**Test Case 4: AI 분석 요청 모달**
- 첫 요청 시 기능 선택 표시
- 재요청 시 안내 메시지 표시
- 요청 후 로딩 및 성공 토스트

**Test Case 5: 판정 모달**
- 현재 상태 제외한 선택지 표시
- 저장 시 API 호출 및 Badge 업데이트

**Test Case 6: 라벨/텍스트 재검출**
- 새로고침 버튼 클릭 시 모달 표시
- 재검출 후 데이터 덮어쓰기 확인

**Test Case 7: 텍스트 단어별 출력**
- words 배열이 개별 Badge로 표시되는지 확인

### 9.3 데이터 플로우 테스트

**Scenario 1: 새 콘텐츠 업로드 후 첫 분석**
1. 콘텐츠 업로드 (is_analyzed: null)
2. 콘텐츠 상세 페이지 진입
3. "AI 분석 요청" 버튼 클릭
4. 라벨, 텍스트 선택 후 요청
5. is_analyzed: false (분석 중)
6. Vision API 호출 완료
7. label_data, text_data 저장
8. detected_contents 생성
9. is_analyzed: true (완료)
10. UI 업데이트 확인

**Scenario 2: 추가 이미지 발견을 위한 재요청**
1. 이미 분석된 콘텐츠 (is_analyzed: true)
2. "AI 분석 추가요청" 버튼 클릭
3. 안내 메시지 확인
4. 요청
5. 기존 source_url 조회
6. 새로운 detected_contents만 추가
7. UI 업데이트 확인

**Scenario 3: 발견 이미지 판정**
1. 이미지 검출 결과에서 아이템 클릭
2. 발견 이미지 표시
3. "판정" 버튼 클릭
4. 판정 선택 (match)
5. admin_review_status 업데이트
6. Badge 색상 변경 확인

### 9.4 에러 핸들링 테스트

**Error Case 1: Vision API 키 없음**
- 환경 변수 미설정 시 에러 메시지 표시

**Error Case 2: Vision API 호출 실패**
- 네트워크 에러 시 에러 메시지 표시
- is_analyzed: false + message: "에러 메시지"

**Error Case 3: 존재하지 않는 contentId**
- 404 에러 처리

**Error Case 4: Supabase 권한 에러**
- RLS 정책 위반 시 에러 메시지 표시

---

## 10. 환경 변수 설정

**.env.local:**
```bash
# Google Vision API
GOOGLE_VISION_API_KEY=your_vision_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 11. 참고 문서

- `VisionAPIExample.md`: Vision API 응답 예제
- `claudedocs/google_vision_api_research_20251031.md`: Vision API 사용 가이드
- `DATABASE_SCHEMA.md`: 데이터베이스 스키마
- `app/admin/review/[detectionId]/page.tsx`: 비교 검토 페이지 (디자인 참조)

---

_이 문서는 콘텐츠 상세 페이지의 Vision API 통합 및 UI 개선 작업을 위한 순차적 계획을 정의합니다._

**작성일**: 2025-10-31
**작성자**: Claude (Sonnet 4.5)
