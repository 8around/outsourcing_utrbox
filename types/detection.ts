// Detected content type definitions
// DB 스키마와 일치하는 타입 정의

export type AdminReviewStatus = 'pending' | 'match' | 'no_match' | 'cannot_compare'
export type DetectionType = 'full' | 'partial' | 'similar'

export interface DetectedContent {
  id: string
  content_id: string // 원본 콘텐츠 ID
  source_url: string | null // 발견된 페이지 URL
  image_url: string // 발견된 이미지 URL (필수)
  page_title: string | null // 페이지 제목
  detection_type: DetectionType // full: 완전일치, partial: 부분일치, similar: 시각적유사
  admin_review_status: AdminReviewStatus // 관리자 검토 상태
  reviewed_by: string | null // 검토한 관리자 ID
  reviewed_at: string | null // 검토 시간
  created_at: string // 발견 시간
}
