import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const result = await getUserProfile(supabase)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
