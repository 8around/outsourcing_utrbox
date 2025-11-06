import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { resetUserPassword } from '@/lib/supabase/auth'
import { AuthResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse<null>>> {
  try {
    const body = await request.json()
    const { email } = body

    const supabase = createServerSupabase()

    // 비밀번호 재설정 처리 (헬퍼 함수 사용)
    const result = await resetUserPassword(supabase, email)

    if (!result.success) {
      // Rate limit 에러는 429 상태 코드 사용
      const statusCode =
        result.error?.errorCode === 'over_email_send_rate_limit' ||
        result.error?.errorCode === 'over_request_rate_limit'
          ? 429
          : 400

      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Reset password unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { errorMessage: '비밀번호 재설정 중 오류가 발생했습니다.' },
      },
      { status: 500 }
    )
  }
}
