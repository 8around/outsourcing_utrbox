import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabase } from '@/lib/supabase/middleware'

// 보호된 경로 목록
const protectedPaths = ['/', '/collections', '/contents']

// 관리자 전용 경로
const adminPaths = ['/admin']

// 인증이 필요 없는 공개 경로
const authPaths = ['/login', '/signup', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase 미들웨어 클라이언트 생성
  const { supabase, response } = createMiddlewareSupabase(request)

  try {
    // Session만 확인 (가장 빠른 인증 체크)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      if (authPaths.some((path) => pathname.startsWith(path))) {
        return response
      }

      // 세션이 없으면 로그인 페이지로 리다이렉트 (lib/supabase/auth.ts의 signInUser에서 is_approved falsy한 경우 세션 삭제)
      return NextResponse.redirect(new URL('/login', request.url))
    } else if (authPaths.some((path) => pathname.startsWith(path))) {
      // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 리다이렉트
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 관리자 경로 접근 시에만 Role 체크
    if (adminPaths.some((path) => pathname.startsWith(path))) {
      const { data } = await supabase.auth.getClaims()
      const claims = data?.claims

      if (claims?.user_role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return response
  } catch (error) {
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
