import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// EmailOtpType 타입 정의
type EmailOtpType = 'email' | 'recovery' | 'invite' | 'email_change'

// AuthError 코드별 메시지 매핑
function getErrorMessage(code: string): string {
  const errorMap: Record<string, string> = {
    // 이메일 인증 관련
    otp_expired: '인증 링크가 만료되었습니다.',
    invalid_credentials: '잘못된 인증 링크입니다.',
    email_exists: '이미 등록된 이메일입니다.',
    email_not_confirmed: '이메일 인증이 완료되지 않았습니다.',

    // Rate Limit 관련
    over_email_send_rate_limit:
      '이메일 전송 제한. 고객센터(support@example.com)로 문의해주세요.',
    over_request_rate_limit: '요청 횟수 제한 초과. 잠시 후 다시 시도해주세요.',

    // 시스템/검증 에러
    validation_failed: '잘못된 요청입니다.',
    unexpected_failure: '일시적인 오류가 발생했습니다.',
    bad_code_verifier: '인증 코드 검증 오류입니다.',
    flow_state_expired: '인증 요청이 만료되었습니다.',
    flow_state_not_found: '인증 요청을 찾을 수 없습니다.',
  }

  // 매핑된 메시지가 없으면 에러 코드 포함 메시지 반환
  return errorMap[code] || `인증을 다시 시도해주세요. (코드: ${code})`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    // 파라미터 검증
    if (!token_hash || !type) {
      const errorMessage = '잘못된 인증 링크입니다.'
      return NextResponse.redirect(
        new URL(
          `/login?verified=error&message=${encodeURIComponent(errorMessage)}`,
          request.url
        )
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabase()

    // verifyOtp로 토큰 검증 (세션이 자동 생성됨)
    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      console.error('Email verification error:', error)

      const errorCode = error.code || 'unknown'
      const errorMessage = getErrorMessage(errorCode)

      // 실패 시 에러 코드와 메시지와 함께 리다이렉트
      return NextResponse.redirect(
        new URL(
          `/login?verified=error&message=${encodeURIComponent(errorMessage)}`,
          request.url
        )
      )
    }

    // 성공 시: 세션이 생성되었으므로 즉시 제거
    // (관리자 승인이 필요하므로 이메일 인증만 완료)
    if (session) {
      await supabase.auth.signOut()
      console.log('Email verified successfully, session removed for admin approval')
    }

    // 성공 메시지와 함께 리다이렉트
    const successMessage = '이메일 인증이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.'
    return NextResponse.redirect(
      new URL(
        `/login?verified=success&message=${encodeURIComponent(successMessage)}`,
        request.url
      )
    )
  } catch (error) {
    console.error('Email verification unexpected error:', error)

    const errorMessage =
      error instanceof Error
        ? `인증을 다시 시도해주세요. (코드: ${error.message})`
        : '인증 중 오류가 발생했습니다.'

    return NextResponse.redirect(
      new URL(
        `/login?verified=error&message=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    )
  }
}
