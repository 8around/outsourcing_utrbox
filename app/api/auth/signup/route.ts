import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signUpUser } from '@/lib/supabase/auth'
import { AuthResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse<null>>> {
  try {
    const body = await request.json()
    const { email, password, name, organization } = body

    // 입력 데이터 검증
    if (!email || !password || !name || !organization) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { errorMessage: '모든 필드를 입력해주세요.' },
        },
        { status: 400 }
      )
    }

    /* 이메일, 비밀번호는 supabase auth 자체 검증이 이루어지므로 검증하지 않음 */
    // 이름 검증
    const nameRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/
    if (!nameRegex.test(name) || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            errorMessage:
              '이름은 영어와 한글만 입력 가능하며, 연속된 공백은 허용되지 않습니다. (최소 2자)',
          },
        },
        { status: 400 }
      )
    }

    // 소속 검증
    const organizationRegex = /^[a-zA-Z가-힣0-9]+(\s[a-zA-Z가-힣0-9]+)*$/
    if (!organizationRegex.test(organization) || organization.length < 2) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            errorMessage:
              '소속은 영어, 한글, 숫자만 입력 가능하며, 연속된 공백은 허용되지 않습니다. (최소 2자)',
          },
        },
        { status: 400 }
      )
    }

    // 요청/응답 기반 서버 클라이언트 생성
    const supabase = createServerSupabase()

    // 회원가입 처리 (헬퍼 함수 사용)
    const result = await signUpUser(supabase, {
      email,
      password,
      name,
      organization,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // 성공 응답 생성 (쿠키가 포함된 headers 전달)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, data: null, error: { errorMessage: '회원가입 중 오류가 발생했습니다.' } },
      { status: 500 }
    )
  }
}
