import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.type'

/**
 * Supabase Admin API 클라이언트 생성
 *
 * ⚠️ 경고: 이 함수는 서버 사이드에서만 사용해야 합니다.
 * SERVICE_ROLE_KEY는 모든 Row Level Security(RLS) 정책을 우회할 수 있으므로
 * 절대 클라이언트 코드에서 사용하거나 노출해서는 안 됩니다.
 *
 * 사용 용도:
 * - auth.sessions 테이블 직접 접근하여 세션 삭제
 * - RLS 우회가 필요한 관리자 작업
 *
 * @returns Supabase Admin 클라이언트
 * @throws {Error} 환경변수가 설정되지 않은 경우
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
