import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabase } from '@/lib/supabase/middleware'

// 보호된 경로 목록
const protectedPaths = ['/dashboard', '/contents', '/collections']

// 관리자 전용 경로
const adminPaths = ['/admin']

// 인증이 필요 없는 공개 경로
const publicPaths = ['/login', '/signup', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase 미들웨어 클라이언트 생성
  const { supabase, response } = createMiddlewareSupabase(request)

  try {
    // 1) 세션 먼저 확인 (필요 시 토큰 갱신 트리거)
    await supabase.auth.getSession()

    // 2) 현재 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // 루트('/') 접근 시 리디렉션
    if (pathname === '/') {
      return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
    }

    // 로그인한 사용자가 인증 페이지에 접근하는 경우
    if (user && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 공개 경로는 통과
    if (publicPaths.some((path) => pathname === path)) {
      return response
    }

    if (userError || !user) {
      // 사용자 정보를 가져올 수 없으면 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 사용자 프로필 및 승인 상태 확인
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_approved, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      // 프로필이 없으면 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 관리자 전용 경로 체크
    if (adminPaths.some((path) => pathname.startsWith(path))) {
      if (profile.role !== 'admin') {
        // 관리자가 아니면 대시보드로 리다이렉트
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // 모든 검증 통과
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // 오류 발생 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     * - .*\..* (any file with extension)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|manifest.webmanifest|.*\\..*).*)',
  ],
}
