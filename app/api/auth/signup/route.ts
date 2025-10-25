import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.type'
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
      },
    )

    // 회원가입 처리 (헬퍼 함수 사용)
    const result = await signUpUser(supabase, {
      email,
      password,
      name,
      organization,
    })

    if (!result.success) {
      // 실패 응답 생성 (쿠키가 포함된 headers 전달)
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error,
        },
        {
          status: 400,
          headers: response.headers,
        },
      )
    }

    // 성공 응답 생성 (쿠키가 포함된 headers 전달)
    return NextResponse.json(
      {
        success: true,
        data: result.data,
        error: null,
        message: result.message,
      },
      {
        status: 201,
        headers: response.headers,
      },
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
