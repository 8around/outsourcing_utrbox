import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signInUser } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 입력 데이터 검증
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: '이메일과 비밀번호를 입력해주세요.',
        },
        { status: 400 },
      )
    }

    const supabase = createServerSupabase()

    // 로그인 처리 (헬퍼 함수 사용)
    const result = await signInUser(supabase, { email, password })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error,
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        error: null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: '로그인 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
