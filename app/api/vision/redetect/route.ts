import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { analyzeImage, extractLabelData, extractTextData } from '@/lib/google-vision/client'

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
      data: { session }
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
    let visionResponse
    try {
      visionResponse = await analyzeImage(publicUrl, [featureType])
    } catch (visionError) {
      return NextResponse.json(
        {
          error: visionError instanceof Error ? visionError.message : 'Vision API 호출 실패'
        },
        { status: 500 }
      )
    }

    // 4. 결과 덮어쓰기
    if (featureType === 'label') {
      const labelData = extractLabelData(visionResponse)

      if (!labelData) {
        return NextResponse.json(
          { error: '라벨 검출 결과가 없습니다.' },
          { status: 404 }
        )
      }

      await supabase.from('contents').update({ label_data: labelData }).eq('id', contentId)

      return NextResponse.json({
        success: true,
        message: '라벨 재검출이 완료되었습니다.',
        data: {
          labels: labelData.labels
        }
      })
    } else if (featureType === 'text') {
      const textData = extractTextData(visionResponse)

      if (!textData) {
        return NextResponse.json(
          { error: '텍스트 검출 결과가 없습니다.' },
          { status: 404 }
        )
      }

      await supabase.from('contents').update({ text_data: textData }).eq('id', contentId)

      return NextResponse.json({
        success: true,
        message: '텍스트 재검출이 완료되었습니다.',
        data: {
          text: textData.text,
          words: textData.words
        }
      })
    }

    return NextResponse.json({ error: '알 수 없는 에러가 발생했습니다.' }, { status: 500 })
  } catch (error) {
    console.error('Vision API redetect 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
