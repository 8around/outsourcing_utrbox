import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Json } from '@/types/database.type'
import {
  analyzeImage,
  extractLabelData,
  extractTextData,
  extractDetectedContents,
  type VisionFeatureType,
  type VisionAnalysisResult,
} from '@/lib/google-vision/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vision/analyze
 *
 * Vision API를 사용하여 이미지 분석을 수행합니다.
 * - 첫 요청: LABEL, TEXT, WEB_DETECTION
 * - 재요청: WEB_DETECTION만 (중복 제거)
 */
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
      return NextResponse.json(
        {
          message: '이미지 분석 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }

    // 5. Vision API 에러 응답 처리
    if (!analysisResult.success || !analysisResult.response) {
      const errorInfo = analysisResult.error!

      return NextResponse.json(
        {
          message: errorInfo.message,
          errorCode: errorInfo.code,
        },
        { status: 400 }
      )
    }

    const visionResponse = analysisResult.response

    // 6. 응답 데이터 처리 및 저장
    const updates: { label_data?: Json; text_data?: Json } = {}

    // LABEL_DETECTION 처리 (0개여도 저장)
    if (features.includes('label')) {
      const labelData = extractLabelData(visionResponse)
      updates.label_data = labelData || { labels: [] }
    }

    // TEXT_DETECTION 처리 (0개여도 저장)
    if (features.includes('text')) {
      const textData = extractTextData(visionResponse)
      updates.text_data = textData || { text: '', words: [] }
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

    // 9. 결과 개수 메시지 생성 (요청한 기능에 대한 검출 결과, 0개도 포함)
    const resultMessages: string[] = []

    if (features.includes('web')) {
      resultMessages.push(`이미지 ${detectedContentsCount}개`)
    }

    if (features.includes('label')) {
      resultMessages.push(`라벨 ${labelCount}개`)
    }

    if (features.includes('text')) {
      resultMessages.push(`텍스트 ${textWordCount}개 단어`)
    }

    const successMessage =
      resultMessages.length > 0
        ? `[이미지 분석 완료]\n${resultMessages.join(', ')}`
        : '이미지 분석이 완료되었습니다.'

    return NextResponse.json({
      success: true,
      message: successMessage,
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
        message: '서버 오류가 발생했습니다. 관리자에게 문의해주세요.',
      },
      { status: 500 }
    )
  }
}
