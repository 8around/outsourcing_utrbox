import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabase } from '@/lib/supabase/middleware'

// 보호된 경로 목록
const protectedPaths = ['/', '/collections', '/contents']

// 관리자 전용 경로
const adminPaths = ['/admin']

// 인증이 필요 없는 공개 경로
const publicPaths = ['/login', '/signup', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase 미들웨어 클라이언트 생성
  const { supabase, response } = createMiddlewareSupabase(request)

  try {
    // Session만 확인 (가장 빠른 인증 체크)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // 루트 경로 리디렉션
    if (pathname === '/') {
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      // 로그인한 사용자는 /collections로 리디렉션
      return NextResponse.redirect(new URL('/collections', request.url))
    }

    // 로그인한 사용자가 인증 페이지에 접근하는 경우
    if (session && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/collections', request.url))
    }

    // 공개 경로는 통과
    if (publicPaths.some((path) => pathname === path)) {
      return response
    }

    if (sessionError || !session) {
      // 세션이 없으면 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 관리자 경로 접근 시에만 프로필 체크
    if (adminPaths.some((path) => pathname.startsWith(path))) {
      // 관리자 페이지 접근 시에만 user와 profile 조회
      const [userRes, profileRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('users').select('role').eq('id', session.user.id).single(),
      ])

      const user = userRes.data.user
      const profile = profileRes.data

      if (!user || !profile || profile.role !== 'admin') {
        // 관리자가 아니면 /collections로 리디렉트
        return NextResponse.redirect(new URL('/collections', request.url))
      }
    }

    // 일반 경로는 세션만 확인하고 통과
    // 프로필 체크는 클라이언트 레이아웃에서 처리
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
