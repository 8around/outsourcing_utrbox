import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signOutUser } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // 로그아웃 처리 (헬퍼 함수 사용)
    const result = await signOutUser(supabase)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        error: null,
        message: '로그아웃되었습니다.',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '로그아웃 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
