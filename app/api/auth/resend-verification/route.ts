import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatAuthError } from '@/lib/utils/errors'
import { AuthResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse<null>>> {
  try {
    const body = await request.json()
    const { email } = body

    const supabase = createServerSupabase()

    // auth.resend()를 사용하여 signup confirmation email 재전송
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      // emailRedirectTo 불필요 - 이메일 템플릿에서 이미 설정
    })

    if (error) {
      console.error('Resend verification error:', error)

      // formatApiError로 통합된 에러 메시지 사용
      const errorMessage = formatAuthError(error)

      // Rate limit 에러는 429 상태 코드
      const statusCode =
        error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit'
          ? 429
          : 400

      return NextResponse.json(
        {
          success: false,
          error: { errorMessage: errorMessage },
          data: null,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    })
  } catch (error) {
    console.error('Resend email unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: { errorMessage: '이메일 재전송 중 오류가 발생했습니다.' },
        data: null,
      },
      { status: 500 }
    )
  }
}
