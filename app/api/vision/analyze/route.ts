import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Json } from '@/types/database.type'
import {
  analyzeImage,
  extractLabelData,
  extractTextData,
  extractDetectedContents,
  type VisionFeatureType,
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
    let visionResponse
    try {
      visionResponse = await analyzeImage(publicUrl, features)
    } catch (visionError) {
      // Vision API 호출 실패 시 에러 메시지 저장
      await supabase
        .from('contents')
        .update({
          is_analyzed: false,
          message:
            visionError instanceof Error ? visionError.message : 'Vision API 호출 중 에러 발생',
        })
        .eq('id', contentId)

      return NextResponse.json(
        {
          error: visionError instanceof Error ? visionError.message : 'Vision API 호출 실패',
        },
        { status: 500 }
      )
    }

    // 5. 응답 데이터 처리 및 저장
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

    // 6. WEB_DETECTION 처리
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

    // 7. 성공 응답 (is_analyzed는 관리자가 수동으로 완료 상태로 변경)
    const labelCount =
      updates.label_data &&
      typeof updates.label_data === 'object' &&
      'labels' in updates.label_data &&
      Array.isArray(updates.label_data.labels)
        ? updates.label_data.labels.length
        : 0

    return NextResponse.json({
      success: true,
      message: '이미지 분석이 완료되었습니다.',
      data: {
        labelCount,
        textDetected: !!updates.text_data,
        detectedContentsCount,
      },
    })
  } catch (error) {
    console.error('Vision API analyze 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
