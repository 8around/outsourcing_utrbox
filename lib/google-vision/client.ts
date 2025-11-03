/**
 * Google Vision API 클라이언트 유틸리티 함수
 */

const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate'

/**
 * Vision API 요청을 위한 Feature 타입
 */
export type VisionFeatureType = 'label' | 'text' | 'web'

/**
 * Vision API 에러 객체 타입
 */
export interface VisionApiError {
  code: number
  message: string
  details?: Array<unknown>
}

/**
 * Vision API 응답 타입
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
  error?: VisionApiError
}

/**
 * Vision API 분석 결과 타입
 */
export interface VisionAnalysisResult {
  success: boolean
  response?: VisionApiResponse
  error?: {
    code: number
    message: string
  }
}

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
    13: 'Google Vision API 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
    14: 'Google Vision API 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
    15: '요청 중 오류가 발생했습니다. 다시 시도해주세요.',
    16: 'Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다.',
  }

  return errorMessages[errorCode] || `알 수 없는 오류가 발생했습니다. (코드: ${errorCode})`
}

/**
 * 웹 이미지 URL인지 검증하는 함수 (HEAD 요청 + 매직 넘버 스니핑)
 * @param url - 검증할 URL
 * @returns 웹 이미지 URL 여부
 */
export async function isWebImageUrl(url: string | undefined): Promise<boolean> {
  if (!url || !url.startsWith('http')) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    // HEAD 요청으로 Content-Type 확인
    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'User-Agent': 'utrbox-image-check/1.0' },
      })

      if (headRes.ok) {
        const ct = headRes.headers.get('content-type')?.toLowerCase() || ''
        if (ct.startsWith('image/')) {
          return true
        }
      }
    } catch {
      /* 폴백으로 진행 */
    }

    // Range GET 폴백 + 매직 넘버 스니핑
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-96', 'User-Agent': 'utrbox-image-check/1.0' },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!getRes.ok) return false

    const ct2 = getRes.headers.get('content-type')?.toLowerCase() || ''
    if (ct2.startsWith('image/')) {
      return true
    }

    const buf = new Uint8Array(await getRes.arrayBuffer())
    return !!sniffImageMime(buf)
  } catch (error) {
    console.error('이미지 URL 검증 에러:', url, error)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * 바이트 배열에서 이미지 MIME 타입을 스니핑
 */
function sniffImageMime(b: Uint8Array): string | undefined {
  // JPEG
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  // PNG
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'image/png'
  // GIF
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return 'image/gif'
  // WebP
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp'
  // AVIF
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const v8 = b[8],
      v9 = b[9],
      v10 = b[10],
      v11 = b[11]
    const brand = String.fromCharCode(v8, v9, v10, v11)
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  // BMP
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp'
  // TIFF
  if (
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a))
  )
    return 'image/tiff'
  return undefined
}

/**
 * Vision API를 호출하는 함수
 * @param imageUrl - 분석할 이미지의 Public URL
 * @param features - 요청할 Vision API 기능 목록
 * @returns Vision API 분석 결과
 */
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
      const { code } = annotateResponse.error
      const message = getVisionErrorMessage(code)

      return {
        success: false,
        error: {
          code,
          message,
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

/**
 * Label Detection 데이터를 정제하는 함수
 * @param response - Vision API 응답
 * @returns label_data 형식
 */
export function extractLabelData(response: VisionApiResponse) {
  if (!response.labelAnnotations || response.labelAnnotations.length === 0) {
    return null
  }

  return {
    labels: response.labelAnnotations.map((label) => ({
      description: label.description,
      score: label.score,
    })),
  }
}

/**
 * Text Detection 데이터를 정제하는 함수
 * @param response - Vision API 응답 (textAnnotations 첫 번째 요소는 모든 단어를 '\n'로 합친 문자열이므로 제외)
 * @returns text_data 형식
 */
export function extractTextData(response: VisionApiResponse) {
  if (!response.textAnnotations || response.textAnnotations.length === 0) {
    return null
  }

  return {
    text: response.fullTextAnnotation?.text || '',
    words: response.textAnnotations.slice(1).map((t) => t.description),
  }
}

/**
 * Web Detection 데이터에서 detected_contents 생성을 위한 데이터 추출
 * @param response - Vision API 응답
 * @param contentId - 콘텐츠 ID
 * @param existingUrls - 기존 source_url 목록 (재요청 시 중복 제거용)
 * @returns detected_contents 삽입용 데이터 배열
 */
export async function extractDetectedContents(
  response: VisionApiResponse,
  contentId: string,
  existingUrls: string[] = []
): Promise<
  Array<{
    content_id: string
    source_url: string
    image_url: string
    page_title: string | null
    detection_type: 'full' | 'partial'
    admin_review_status: 'pending'
  }>
> {
  if (!response.webDetection?.pagesWithMatchingImages) {
    return []
  }

  const newDetections: Array<{
    content_id: string
    source_url: string
    image_url: string
    page_title: string | null
    detection_type: 'full' | 'partial'
    admin_review_status: 'pending'
  }> = []

  for (const page of response.webDetection.pagesWithMatchingImages) {
    // source_url 없으면 스킵
    if (!page.url) continue

    // 재요청 시 중복 체크
    if (existingUrls.includes(page.url)) continue

    // fullMatchingImages 처리
    if (page.fullMatchingImages && page.fullMatchingImages.length > 0) {
      for (const img of page.fullMatchingImages) {
        const isValid = await isWebImageUrl(img.url)

        if (isValid && img.url) {
          newDetections.push({
            content_id: contentId,
            source_url: page.url,
            image_url: img.url,
            page_title: page.pageTitle || null,
            detection_type: 'full',
            admin_review_status: 'pending',
          })

          break // 하나의 페이지당 하나의 이미지만 저장
        }
      }
    }

    // partialMatchingImages 처리 (fullMatchingImages가 없을 때만)
    if (page.partialMatchingImages && page.partialMatchingImages.length > 0) {
      for (const img of page.partialMatchingImages) {
        const isValid = await isWebImageUrl(img.url)
        if (isValid && img.url) {
          newDetections.push({
            content_id: contentId,
            source_url: page.url,
            image_url: img.url,
            page_title: page.pageTitle || null,
            detection_type: 'partial',
            admin_review_status: 'pending',
          })
          break // 하나의 페이지당 하나의 이미지만 저장
        }
      }
    }
  }

  return newDetections
}
