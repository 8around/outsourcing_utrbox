import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.type'
import { signInUser } from '@/lib/supabase/auth'
import { AuthResponse } from '@/types/api'
import { User } from '@/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<{ user: User } | null>>> {
  try {
    const body = await request.json()
    const { email, password } = body

    // 초기 response 생성 (쿠키 수집용, 내용은 나중에 덮어씀)
    const response = NextResponse.json({})

    // 요청/응답 기반 서버 클라이언트 생성
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // 로그인 처리 (헬퍼 함수 사용)
    const result = await signInUser(supabase, { email, password })

    if (!result.success) {
      // 실패 응답 생성 (쿠키가 포함된 headers 전달)
      return NextResponse.json(result, { status: 401 })
    }

    // 성공 응답 생성 (쿠키가 포함된 headers 전달)
    return NextResponse.json(result, {
      status: 200,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { errorMessage: '로그인 중 오류가 발생했습니다.' },
      },
      { status: 500 }
    )
  }
}
