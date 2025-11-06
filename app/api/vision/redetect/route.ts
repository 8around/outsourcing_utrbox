import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  analyzeImage,
  extractLabelData,
  extractTextData,
  type VisionAnalysisResult,
} from '@/lib/google-vision/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vision/redetect
 *
 * 라벨 또는 텍스트만 재검출합니다.
 * 기존 데이터를 덮어씁니다.
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
    const { contentId, featureType } = body as {
      contentId: string
      featureType: 'label' | 'text'
    }

    if (!contentId) {
      return NextResponse.json({ error: 'contentId가 필요합니다.' }, { status: 400 })
    }

    if (!featureType || !['label', 'text'].includes(featureType)) {
      return NextResponse.json(
        { error: "featureType은 'label' 또는 'text'여야 합니다." },
        { status: 400 }
      )
    }

    // 1. contents 조회
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, file_path')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 2. file_path는 이미 public URL이므로 그대로 사용
    const publicUrl = content.file_path

    // 3. Vision API 호출 (해당 feature만)
    let analysisResult: VisionAnalysisResult
    try {
      analysisResult = await analyzeImage(publicUrl, [featureType])
    } catch {
      // 네트워크 에러 등 예외 처리
      return NextResponse.json(
        {
          message: '이미지 재검출 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      )
    }

    // 4. Vision API 에러 응답 처리
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

    // 5. 결과 덮어쓰기 (0개여도 성공 처리)
    if (featureType === 'label') {
      const labelData = extractLabelData(visionResponse)

      if (labelData) {
        await supabase.from('contents').update({ label_data: labelData }).eq('id', contentId)
      }

      const labelCount = labelData?.labels.length || 0
      const successMessage = `라벨 재검출 완료: ${labelCount}개`

      return NextResponse.json({
        success: true,
        message: successMessage,
      })
    } else if (featureType === 'text') {
      const textData = extractTextData(visionResponse)

      if (textData) {
        await supabase.from('contents').update({ text_data: textData }).eq('id', contentId)
      }

      const textWordCount = textData?.words.length || 0
      const successMessage = `텍스트 재검출 완료: ${textWordCount}개 단어`

      return NextResponse.json({
        success: true,
        message: successMessage,
      })
    }

    return NextResponse.json(
      {
        message: '서버 오류가 발생했습니다. 관리자에게 문의해주세요.',
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Vision API redetect 에러:', error)
    return NextResponse.json(
      {
        message: '서버 오류가 발생했습니다. 관리자에게 문의해주세요.',
      },
      { status: 500 }
    )
  }
}
