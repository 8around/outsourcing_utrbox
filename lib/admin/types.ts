// lib/admin/types.ts
// DATABASE_SCHEMA.md 기반 관리자 페이지 타입 정의

// DATABASE_SCHEMA.md의 users 테이블 기반
export interface User {
  id: string // UUID
  name: string
  email: string // from auth.users
  organization: string | null
  role: 'member' | 'admin'
  is_approved: boolean | null // NULL: 대기, TRUE: 승인, FALSE: 거부
  created_at: string // ISO 8601
  updated_at: string
  // 추가 통계
  contents_count?: number
  last_login?: string
}

// DATABASE_SCHEMA.md의 collections 테이블 기반
export interface Collection {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// DATABASE_SCHEMA.md의 contents 테이블 기반
export interface Content {
  id: string
  user_id: string
  collection_id: string | null
  file_name: string
  file_path: string // Supabase Storage 경로
  is_analyzed: boolean | null // NULL: 대기, FALSE: 진행, TRUE: 완료
  message: string | null
  label_data: Record<string, unknown> | null // JSONB
  text_data: Record<string, unknown> | null // JSONB
  created_at: string
  // JOIN 데이터
  user_name?: string
  collection_name?: string
  detected_count?: number
}

// DATABASE_SCHEMA.md의 detected_contents 테이블 기반
export interface DetectedContent {
  id: string
  content_id: string
  source_url: string | null
  image_url: string
  page_title: string | null
  detection_type: 'full' | 'partial' | 'similar'
  admin_review_status: 'pending' | 'match' | 'no_match' | 'cannot_compare'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // JOIN 데이터
  original_image_path?: string
  original_file_name?: string
  reviewer_name?: string
}

// 대시보드 통계
export interface DashboardStats {
  total_contents: number // 총 콘텐츠 수
  pending_contents: number // 대기중 (is_analyzed = NULL)
  analyzing_contents: number // 분석중 (is_analyzed = FALSE)
  completed_contents: number // 분석완료 (is_analyzed = TRUE)
  total_users: number // 총 회원 수
}

// 대기중인 콘텐츠 (활동 피드용)
export interface PendingContent {
  id: string
  file_name: string
  user_name: string
  created_at: string
}

// 가입 요청 (활동 피드용)
export interface PendingUser {
  id: string
  name: string
  email: string
  created_at: string
}

// 필터 상태
export interface UserFilters {
  search?: string
  is_approved?: boolean | null // undefined: 전체, null: 대기, true: 승인, false: 거부
  role: 'member' | 'admin' // 필수로 변경, 기본값은 스토어에서 설정
  page: number
}

// 페이지네이션 결과 타입
export interface PaginatedUsers {
  users: User[]
  totalCount: number
  pageCount: number
  currentPage: number
}

// Server Action 파라미터 타입
export interface GetUsersParams {
  page: number
  limit: number
  search?: string
  is_approved?: boolean | null
  role: 'member' | 'admin'
}

export interface ContentFilters {
  page: number
  user_id?: string
  is_analyzed?: boolean | null
  collection_id?: string
  search?: string
}

export interface ReviewFilters {
  detection_type?: 'full' | 'partial' | 'similar' | null
  admin_review_status?: 'pending' | 'match' | 'no_match' | 'cannot_compare' | null
}
