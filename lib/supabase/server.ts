import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.type'

/**
 * 서버 컴포넌트 및 서버 액션용 Supabase 클라이언트 생성
 *
 * ⚠️ 중요: 이 함수는 서버 컴포넌트와 서버 액션에서만 사용하세요.
 *
 * 라우트 핸들러 (app/api/(모든 하위 경로)/route.ts)에서는 사용하지 마세요!
 * 라우트 핸들러에서는 요청/응답 기반으로 직접 createServerClient를 생성해야
 * 쿠키가 응답에 올바르게 설정됩니다.
 *
 * @example
 * // ✅ 서버 컴포넌트에서 사용
 * async function ServerComponent() {
 *   const supabase = createServerSupabase()
 *   const { data } = await supabase.from('users').select()
 *   return <div>{data}</div>
 * }
 *
 * @example
 * // ❌ 라우트 핸들러에서는 사용하지 마세요
 * // 대신 요청/응답 기반 createServerClient 사용
 * export async function POST(request: NextRequest) {
 *   let response = NextResponse.json({ success: false })
 *   const supabase = createServerClient<Database>(
 *     process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *     {
 *       cookies: {
 *         getAll() { return request.cookies.getAll() },
 *         setAll(cookiesToSet) {
 *           cookiesToSet.forEach(({ name, value, options }) => {
 *             response.cookies.set(name, value, options)
 *           })
 *         },
 *       },
 *     },
 *   )
 *   // ... 로직 처리
 *   return response
 * }
 */

export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 최신 시그니처: getAll/setAll
        getAll() {
          return cookieStore.getAll()
        },
        // 서버 컴포넌트에서는 쿠키를 설정할 수 없으므로 no-op
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // 서버 컴포넌트에서는 set이 실패하지만 읽기는 가능
          }
        },
      },
    }
  )
}
