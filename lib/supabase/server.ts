import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.type'

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
        // 라우트 핸들러/미들웨어에서만 성공적으로 동작(서버 컴포넌트에선 set 불가)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // 서버 컴포넌트 등 set 불가 환경 대비
          }
        },
      },
    },
  )
}
