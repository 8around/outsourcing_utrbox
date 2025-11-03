# Vision API 에러 처리 및 성공 알림 개선 계획

## 목적

Google Vision API의 에러 응답을 정확히 처리하고, 관리자에게 유용한 피드백을 toast로 제공하여 사용자 경험을 개선합니다.

## 문제 상황

### 현재 문제점

1. **에러 응답 처리 미흡**
   - Vision API는 HTTP 200 상태 코드를 반환하면서 `response.error` 객체에 실제 에러를 포함
   - 현재 코드는 `response.ok` 체크만으로는 Vision API의 실제 에러를 감지할 수 없음
   - `lib/google-vision/client.ts:219-220`에서 response를 두 번 json 파싱하는 버그 존재

2. **사용자 피드백 부족**
   - 분석 성공 시 어떤 결과가 얼마나 검출되었는지 알 수 없음
   - 에러 발생 시 구체적인 원인과 대응 방법을 알 수 없음
   - 진행 상황에 대한 실시간 피드백이 없음

## Vision API 응답 구조

### AnnotateImageResponse 타입

```typescript
interface AnnotateImageResponse {
  labelAnnotations?: Array<EntityAnnotation>
  textAnnotations?: Array<EntityAnnotation>
  fullTextAnnotation?: TextAnnotation
  webDetection?: WebDetection
  // ... 기타 필드
  error?: {
    code: number
    message: string
    details?: Array<any>
  }
}

interface BatchAnnotateImagesResponse {
  responses: Array<AnnotateImageResponse>
}
```

### 주요 에러 코드

| Code | Status | 사용자 메시지 |
|------|--------|--------------|
| 2, 8, 10, 15 | UNKNOWN, RESOURCE_EXHAUSTED, ABORTED, DATA_LOSS | 요청 중 오류가 발생했습니다. 다시 시도해주세요. |
| 3 | INVALID_ARGUMENT | 손상되었거나 지원되지 않는 포맷의 이미지입니다. |
| 4 | DEADLINE_EXCEEDED | 요청 시간이 초과되었습니다. 다시 시도해주세요. |
| 7, 16 | PERMISSION_DENIED, UNAUTHENTICATED | Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다. |
| 12 | UNIMPLEMENTED | 지원되지 않는 API를 사용하고 있습니다. 관리자에게 문의해주세요. |
| 14 | UNAVAILABLE | Google Vision API 서버에 문제가 있어 요청을 처리할 수 없습니다. |

## 개선 계획

### 1. 타입 정의 업데이트

**파일**: `lib/google-vision/client.ts`

```typescript
/**
 * Vision API 에러 객체 타입
 */
export interface VisionApiError {
  code: number
  message: string
  details?: Array<any>
}

/**
 * Vision API 응답 타입 (에러 필드 추가)
 */
export interface VisionApiResponse {
  labelAnnotations?: Array<{
    description: string
    score: number
  }>
  textAnnotations?: Array<{
    description: string
  }>
  fullTextAnnotation?: {
    text: string
  }
  webDetection?: {
    pagesWithMatchingImages?: Array<{
      url?: string
      pageTitle?: string
      fullMatchingImages?: Array<{
        url?: string
      }>
      partialMatchingImages?: Array<{
        url?: string
      }>
    }>
  }
  error?: VisionApiError  // 추가
}

/**
 * Vision API 분석 결과 타입
 */
export interface VisionAnalysisResult {
  success: boolean
  response?: VisionApiResponse
  error?: {
    code: number
    userMessage: string
    originalMessage: string
  }
}
```

### 2. 에러 메시지 매핑 함수

**파일**: `lib/google-vision/client.ts`

```typescript
/**
 * Vision API 에러 코드를 사용자 친화적 메시지로 변환
 * @param errorCode - Vision API 에러 코드
 * @returns 사용자에게 표시할 메시지
 */
export function getVisionErrorMessage(errorCode: number): string {
  const errorMessages: Record<number, string> = {
    2: '요청 중 오류가 발생했습니다. 다시 시도해주세요.',
    3: '손상되었거나 지원되지 않는 포맷의 이미지입니다. (지원되지 않는 포맷의 이미지를 파일명의 확장자만 변경하는 경우에도 요청이 불가합니다.)',
    4: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    7: 'Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다.',
    8: '요청 중 오류가 발생했습니다. 다시 시도해주세요.',
    10: '요청 중 오류가 발생했습니다. 다시 시도해주세요.',
    12: '지원되지 않는 API를 사용하고 있습니다. 관리자에게 문의해주세요.',
    14: 'Google Vision API 서버에 문제가 있어 요청을 처리할 수 없습니다.',
    15: '요청 중 오류가 발생했습니다. 다시 시도해주세요.',
    16: 'Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다.',
  }

  return errorMessages[errorCode] || `알 수 없는 오류가 발생했습니다. (코드: ${errorCode})`
}
```

### 3. analyzeImage 함수 수정

**파일**: `lib/google-vision/client.ts`

**기존 코드 문제점**:
```typescript
// Line 219-220: response.json()을 두 번 호출하는 버그
console.log('response', response)
console.log('resData', await response.json())  // 첫 번째 파싱

if (!response.ok) {
  const errorData = await response.json()  // 두 번째 파싱 시도 (에러 발생)
  // ...
}

const data = await response.json()  // 세 번째 파싱 시도 (에러 발생)
```

**개선된 코드**:
```typescript
export async function analyzeImage(
  imageUrl: string,
  features: VisionFeatureType[]
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY 환경 변수가 설정되지 않았습니다.')
  }

  // Feature 타입을 Vision API 형식으로 변환
  const visionFeatures = []

  if (features.includes('label')) {
    visionFeatures.push({
      type: 'LABEL_DETECTION',
      maxResults: 10,
    })
  }

  if (features.includes('text')) {
    visionFeatures.push({
      type: 'TEXT_DETECTION',
    })
  }

  if (features.includes('web')) {
    visionFeatures.push({
      type: 'WEB_DETECTION',
      maxResults: 50,
    })
  }

  if (visionFeatures.length === 0) {
    throw new Error('최소 하나의 feature를 선택해야 합니다.')
  }

  const requestBody = {
    requests: [
      {
        image: {
          source: {
            imageUri: imageUrl,
          },
        },
        features: visionFeatures,
      },
    ],
  }

  try {
    const response = await fetch(`${VISION_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // HTTP 레벨 에러 체크
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vision API HTTP 오류: ${response.status} - ${errorText}`)
    }

    // 응답 파싱 (한 번만!)
    const data = await response.json()

    if (!data.responses || !data.responses[0]) {
      throw new Error('Vision API 응답에 결과가 없습니다.')
    }

    const annotateResponse: VisionApiResponse = data.responses[0]

    // Vision API 레벨 에러 체크
    if (annotateResponse.error) {
      const { code, message } = annotateResponse.error
      const userMessage = getVisionErrorMessage(code)

      return {
        success: false,
        error: {
          code,
          userMessage,
          originalMessage: message,
        },
      }
    }

    // 성공 응답
    return {
      success: true,
      response: annotateResponse,
    }
  } catch (error) {
    // 네트워크 에러, 파싱 에러 등
    if (error instanceof Error) {
      throw new Error(`Vision API 호출 중 에러 발생: ${error.message}`)
    }
    throw new Error('Vision API 호출 중 알 수 없는 에러 발생')
  }
}
```

### 4. API Route 수정

**파일**: `app/api/vision/analyze/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase()

    // 인증 확인
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { contentId, features, isReanalysis } = body as {
      contentId: string
      features: VisionFeatureType[]
      isReanalysis: boolean
    }

    if (!contentId) {
      return NextResponse.json({ error: 'contentId가 필요합니다.' }, { status: 400 })
    }

    if (!features || features.length === 0) {
      return NextResponse.json({ error: '최소 하나의 feature를 선택해야 합니다.' }, { status: 400 })
    }

    // 1. contents 조회
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, file_path, is_analyzed')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 2. file_path는 이미 public URL이므로 그대로 사용
    const publicUrl = content.file_path

    // 3. is_analyzed를 false로 업데이트 (분석 중 상태)
    if (!isReanalysis) {
      await supabase.from('contents').update({ is_analyzed: false }).eq('id', contentId)
    }

    // 4. Vision API 호출
    let analysisResult: VisionAnalysisResult
    try {
      analysisResult = await analyzeImage(publicUrl, features)
    } catch (visionError) {
      // 네트워크 에러 등 예외 처리
      const errorMessage = visionError instanceof Error
        ? visionError.message
        : 'Vision API 호출 중 에러 발생'

      await supabase
        .from('contents')
        .update({
          is_analyzed: false,
          message: errorMessage,
        })
        .eq('id', contentId)

      return NextResponse.json(
        {
          error: errorMessage,
          userMessage: '이미지 분석 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }

    // 5. Vision API 에러 응답 처리
    if (!analysisResult.success || !analysisResult.response) {
      const errorInfo = analysisResult.error!

      await supabase
        .from('contents')
        .update({
          is_analyzed: false,
          message: `Vision API 오류 (코드 ${errorInfo.code}): ${errorInfo.originalMessage}`,
        })
        .eq('id', contentId)

      return NextResponse.json(
        {
          error: errorInfo.originalMessage,
          userMessage: errorInfo.userMessage,
          errorCode: errorInfo.code,
        },
        { status: 400 }
      )
    }

    const visionResponse = analysisResult.response

    // 6. 응답 데이터 처리 및 저장
    const updates: { label_data?: Json; text_data?: Json } = {}

    // LABEL_DETECTION 처리
    if (features.includes('label')) {
      const labelData = extractLabelData(visionResponse)
      if (labelData) {
        updates.label_data = labelData
      }
    }

    // TEXT_DETECTION 처리
    if (features.includes('text')) {
      const textData = extractTextData(visionResponse)
      if (textData) {
        updates.text_data = textData
      }
    }

    // contents 테이블 업데이트
    if (Object.keys(updates).length > 0) {
      await supabase.from('contents').update(updates).eq('id', contentId)
    }

    // 7. WEB_DETECTION 처리
    let detectedContentsCount = 0

    if (features.includes('web')) {
      // 재요청 시 기존 source_url 조회
      let existingUrls: string[] = []
      if (isReanalysis) {
        const { data: existingDetections } = await supabase
          .from('detected_contents')
          .select('source_url')
          .eq('content_id', contentId)

        existingUrls = existingDetections?.map((d) => d.source_url).filter(Boolean) as string[]
      }

      // detected_contents 추출
      const newDetections = await extractDetectedContents(visionResponse, contentId, existingUrls)

      // detected_contents 삽입
      if (newDetections.length > 0) {
        const { error: insertError } = await supabase
          .from('detected_contents')
          .insert(newDetections)

        if (insertError) {
          console.error('detected_contents 삽입 에러:', insertError)
        } else {
          detectedContentsCount = newDetections.length
        }
      }
    }

    // 8. 성공 응답 구성
    const labelCount =
      updates.label_data &&
      typeof updates.label_data === 'object' &&
      'labels' in updates.label_data &&
      Array.isArray(updates.label_data.labels)
        ? updates.label_data.labels.length
        : 0

    const textWordCount =
      updates.text_data &&
      typeof updates.text_data === 'object' &&
      'words' in updates.text_data &&
      Array.isArray(updates.text_data.words)
        ? updates.text_data.words.length
        : 0

    // 9. 결과 개수 메시지 생성
    const resultMessages: string[] = []

    if (features.includes('label') && labelCount > 0) {
      resultMessages.push(`라벨 ${labelCount}개`)
    }

    if (features.includes('text') && textWordCount > 0) {
      resultMessages.push(`텍스트 ${textWordCount}개 단어`)
    }

    if (features.includes('web') && detectedContentsCount > 0) {
      resultMessages.push(`웹 검출 ${detectedContentsCount}개`)
    }

    const successMessage = resultMessages.length > 0
      ? `이미지 분석 완료: ${resultMessages.join(', ')}`
      : '이미지 분석이 완료되었습니다.'

    return NextResponse.json({
      success: true,
      message: successMessage,
      userMessage: successMessage,
      data: {
        labelCount,
        textWordCount,
        detectedContentsCount,
      },
    })
  } catch (error) {
    console.error('Vision API analyze 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
        userMessage: '서버 오류가 발생했습니다. 관리자에게 문의해주세요.',
      },
      { status: 500 }
    )
  }
}
```

### 5. 프론트엔드 Toast 알림

**파일**: `app/admin/contents/[id]/page.tsx`

Vision API 호출 부분에서 응답 처리:

```typescript
// Vision API 호출 함수 (기존 handleAnalyze 함수 수정)
const handleAnalyze = async (selectedFeatures: VisionFeatureType[]) => {
  setIsAnalyzing(true)

  try {
    const res = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: content.id,
        features: selectedFeatures,
        isReanalysis: false,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // 에러 응답 처리
      toast.error(data.userMessage || data.error || '이미지 분석 요청에 실패했습니다.')
      return
    }

    // 성공 응답 처리
    toast.success(data.userMessage || data.message || '이미지 분석이 완료되었습니다.')

    // 데이터 새로고침
    await refreshData()
  } catch (error) {
    console.error('Vision API 호출 에러:', error)
    toast.error('이미지 분석 요청 중 오류가 발생했습니다.')
  } finally {
    setIsAnalyzing(false)
  }
}
```

## 구현 순서

1. **타입 정의 및 유틸리티 함수** (`lib/google-vision/client.ts`)
   - `VisionApiError`, `VisionAnalysisResult` 타입 추가
   - `getVisionErrorMessage()` 함수 구현
   - `analyzeImage()` 함수 수정 (응답 파싱 버그 수정 + 에러 처리)

2. **API Route 수정** (`app/api/vision/analyze/route.ts`)
   - `VisionAnalysisResult` 타입 기반 처리
   - 에러 응답 시 `userMessage` 포함
   - 성공 응답 시 요청된 기능별 검출 개수 포함

3. **프론트엔드 Toast 알림** (`app/admin/contents/[id]/page.tsx`)
   - `handleAnalyze()` 함수에서 `userMessage` 기반 toast 표시
   - 성공/실패 시나리오별 적절한 메시지 출력

## 테스트 시나리오

### 성공 케이스

1. **Label Detection만 요청**
   - 예상 toast: "이미지 분석 완료: 라벨 8개"

2. **Text Detection만 요청**
   - 예상 toast: "이미지 분석 완료: 텍스트 25개 단어"

3. **Web Detection만 요청**
   - 예상 toast: "이미지 분석 완료: 웹 검출 12개"

4. **모든 기능 요청**
   - 예상 toast: "이미지 분석 완료: 라벨 8개, 텍스트 25개 단어, 웹 검출 12개"

### 에러 케이스

1. **손상된 이미지 (Code 3)**
   - 예상 toast: "손상되었거나 지원되지 않는 포맷의 이미지입니다."

2. **크레딧 부족 (Code 7)**
   - 예상 toast: "Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다."

3. **타임아웃 (Code 4)**
   - 예상 toast: "요청 시간이 초과되었습니다. 다시 시도해주세요."

4. **서버 장애 (Code 14)**
   - 예상 toast: "Google Vision API 서버에 문제가 있어 요청을 처리할 수 없습니다."

## 기대 효과

1. **정확한 에러 진단**: Vision API 에러 코드 기반으로 구체적인 원인 파악
2. **사용자 친화적 메시지**: 기술적 세부사항 대신 실질적 행동 지침 제공
3. **투명한 진행 상황**: 성공 시 실제 검출 결과 개수를 즉시 확인
4. **디버깅 용이성**: 로그와 메시지를 통한 빠른 문제 해결

## 참고 문서

- [Google Vision API - AnnotateImageResponse](https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageResponse)
- [Google API Design - Errors](https://cloud.google.com/apis/design/errors)
- GOOGLE_VISION_ERROR_CODES.md
