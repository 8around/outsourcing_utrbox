import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { resetUserPassword } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // 입력 데이터 검증
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: '이메일을 입력해주세요.',
        },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: '올바른 이메일 형식이 아닙니다.',
        },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // 비밀번호 재설정 처리 (헬퍼 함수 사용)
    const result = await resetUserPassword(supabase, email)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        error: null,
        message: result.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '비밀번호 재설정 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
