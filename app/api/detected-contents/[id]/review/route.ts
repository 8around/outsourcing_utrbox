import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/detected-contents/[id]/review
 *
 * 발견된 콘텐츠의 판정 상태를 업데이트합니다.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabase()

    // 인증 확인
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { admin_review_status } = body as {
      admin_review_status: 'pending' | 'match' | 'no_match' | 'cannot_compare'
    }

    if (!admin_review_status) {
      return NextResponse.json({ error: 'admin_review_status가 필요합니다.' }, { status: 400 })
    }

    if (!['pending', 'match', 'no_match', 'cannot_compare'].includes(admin_review_status)) {
      return NextResponse.json(
        { error: 'admin_review_status 값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // detected_contents 존재 확인
    const { data: detection, error: detectionError } = await supabase
      .from('detected_contents')
      .select('id')
      .eq('id', id)
      .single()

    if (detectionError || !detection) {
      return NextResponse.json({ error: '발견 콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 판정 상태 업데이트 (세션의 사용자 ID 사용)
    const { error: updateError } = await supabase
      .from('detected_contents')
      .update({
        admin_review_status,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('detected_contents 판정 업데이트 에러:', updateError)
      return NextResponse.json({ error: '판정 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '판정이 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('detected_contents review 업데이트 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
