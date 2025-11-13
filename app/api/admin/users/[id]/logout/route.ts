import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApiResponse } from '@/types/api'

/**
 * 사용자 원격 로그아웃 API
 * POST /api/admin/users/[id]/logout
 *
 * Database Function(delete_user_sessions)을 호출하여
 * 특정 사용자의 모든 세션을 auth.sessions 테이블에서 삭제합니다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const targetUserId = params.id

    // JWT claims에서 role 확인 (관리자 권한 검증)
    const supabase = createServerSupabase()
    const { data } = await supabase.auth.getClaims()
    const claims = data?.claims

    if (!claims || claims.user_role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      )
    }

    // Admin 클라이언트로 Database Function 호출
    const adminClient = createAdminClient()

    // delete_user_sessions 함수 호출하여 세션 삭제
    const { error } = await adminClient.rpc('delete_user_sessions', {
      target_user_id: targetUserId,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: '세션 삭제에 실패했습니다.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: '세션 삭제 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
