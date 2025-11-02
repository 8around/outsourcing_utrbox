import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Database } from '@/types/database.type'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/contents/[id]/status
 *
 * 콘텐츠의 분석 상태 및 메시지를 업데이트합니다.
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
    const { is_analyzed, message } = body as {
      is_analyzed: boolean | null
      message?: string
    }

    if (is_analyzed === undefined) {
      return NextResponse.json({ error: 'is_analyzed가 필요합니다.' }, { status: 400 })
    }

    // contents 존재 확인
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id')
      .eq('id', id)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 상태 및 메시지 업데이트
    const updates: Database['public']['Tables']['contents']['Update'] = {
      is_analyzed
    }

    if (message !== undefined) {
      updates.message = message
    }

    const { error: updateError } = await supabase.from('contents').update(updates).eq('id', id)

    if (updateError) {
      console.error('contents 상태 업데이트 에러:', updateError)
      return NextResponse.json({ error: '상태 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '상태가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('contents status 업데이트 에러:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
