import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatAuthError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/reset-password', request.url)

  try {
    const { searchParams } = new URL(request.url)

    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    // 파라미터 검증
    if (!token_hash || type !== 'recovery') {
      const errorMessage = '잘못된 비밀번호 재설정 링크입니다.'

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
      type: 'recovery',
    })

    if (error) {
      console.error('Password reset verification error:', error)

      // formatAuthError를 사용하여 통합된 에러 처리
      const errorMessage = formatAuthError(error)

      redirectUrl.searchParams.set('verified', 'false')
      redirectUrl.searchParams.set('message', errorMessage)

      return NextResponse.redirect(redirectUrl)
    }

    // 성공 시: 세션 유지 (비밀번호 변경을 위해 필요)
    if (session) {
      console.log('Password reset token verified successfully, session created for password update')
    }

    // 성공 리다이렉트
    redirectUrl.searchParams.set('verified', 'true')

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Password reset verification unexpected error:', error)

    // formatAuthError를 사용하여 통합된 에러 처리
    const errorMessage = formatAuthError(error)

    redirectUrl.searchParams.set('verified', 'false')
    redirectUrl.searchParams.set('message', errorMessage)

    return NextResponse.redirect(redirectUrl)
  }
}
