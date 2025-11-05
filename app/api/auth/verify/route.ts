import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatAuthError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/login', request.url)

  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const email = searchParams.get('email') as string

    // 파라미터 검증
    if (!token_hash || !email) {
      const errorMessage = '잘못된 인증 링크입니다.'

      redirectUrl.searchParams.set('verified', 'false')
      redirectUrl.searchParams.set('message', errorMessage)

      return NextResponse.redirect(redirectUrl)
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabase()

    // verifyOtp로 토큰 검증 (세션이 자동 생성됨)
    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })

    if (error) {
      console.error('Email verification error:', error)

      // handleAuthError를 사용하여 통합된 에러 처리
      const errorMessage = formatAuthError(error)

      redirectUrl.searchParams.set('verified', 'false')
      redirectUrl.searchParams.set('message', errorMessage)

      if (error.code === 'otp_expired') {
        redirectUrl.searchParams.set('email', email)
      }

      // 실패 시 에러 메시지와 함께 리다이렉트
      return NextResponse.redirect(redirectUrl)
    }

    // 성공 시: 세션이 생성되었으므로 즉시 제거
    // (관리자 승인이 필요하므로 이메일 인증만 완료)
    if (session) {
      await supabase.auth.signOut()
      console.log('Email verified successfully, session removed for admin approval')
    }

    // 성공 리다이렉트
    redirectUrl.searchParams.set('verified', 'true')

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Email verification unexpected error:', error)

    // handleAuthError를 사용하여 통합된 에러 처리
    const errorMessage = formatAuthError(error)

    redirectUrl.searchParams.set('verified', 'false')
    redirectUrl.searchParams.set('message', errorMessage)

    return NextResponse.redirect(redirectUrl)
  }
}
