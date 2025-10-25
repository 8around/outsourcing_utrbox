import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signUpUser } from '@/lib/supabase/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, organization } = body

    // 입력 데이터 검증
    if (!email || !password || !name || !organization) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: '모든 필드를 입력해주세요.',
        },
        { status: 400 },
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: '올바른 이메일 형식이 아닙니다.',
        },
        { status: 400 },
      )
    }

    // 비밀번호 정책 검증
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            '비밀번호는 8자 이상, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.',
        },
        { status: 400 },
      )
    }

    // 이름 검증
    const nameRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/
    if (!nameRegex.test(name) || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            '이름은 영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다. (최소 2자)',
        },
        { status: 400 },
      )
    }

    // 소속 검증
    const organizationRegex = /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/
    if (!organizationRegex.test(organization) || organization.length < 2) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            '소속은 영어와 한글만 입력 가능하며, 단어 사이 단일 공백만 허용됩니다. (최소 2자)',
        },
        { status: 400 },
      )
    }

    const supabase = createServerSupabase()

    // 회원가입 처리 (헬퍼 함수 사용)
    const result = await signUpUser(supabase, {
      email,
      password,
      name,
      organization,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        error: null,
        message: result.message,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: '회원가입 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
