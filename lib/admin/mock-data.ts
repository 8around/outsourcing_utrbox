// lib/admin/mock-data.ts
// 관리자 페이지용 Mock 데이터

import {
  User,
  Content,
  DetectedContent,
  DashboardStats,
  PendingContent,
  PendingUser,
} from './types'

// 샘플 사용자 (PRD 임시 계정 포함)
export const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: '관리자',
    email: 'pulwind00@gmail.com',
    organization: 'UTRBOX',
    role: 'admin',
    is_approved: true,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-24T00:00:00Z',
    contents_count: 0,
    last_login: '2025-10-24T10:00:00Z',
  },
  {
    id: 'user-001',
    name: '김철수',
    email: 'kim@example.com',
    organization: '에이전시A',
    role: 'member',
    is_approved: true,
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-24T00:00:00Z',
    contents_count: 15,
    last_login: '2025-10-23T14:00:00Z',
  },
  {
    id: 'user-002',
    name: '이영희',
    email: 'lee@example.com',
    organization: '스튜디오B',
    role: 'member',
    is_approved: null, // 승인 대기
    created_at: '2025-10-23T00:00:00Z',
    updated_at: '2025-10-23T00:00:00Z',
    contents_count: 0,
  },
  {
    id: 'user-003',
    name: '박민수',
    email: 'park@example.com',
    organization: '크리에이티브C',
    role: 'member',
    is_approved: true,
    created_at: '2025-10-15T00:00:00Z',
    updated_at: '2025-10-22T00:00:00Z',
    contents_count: 8,
    last_login: '2025-10-22T16:30:00Z',
  },
  {
    id: 'user-004',
    name: '최지훈',
    email: 'choi@example.com',
    organization: null,
    role: 'member',
    is_approved: false, // 거부됨
    created_at: '2025-10-20T00:00:00Z',
    updated_at: '2025-10-21T00:00:00Z',
    contents_count: 0,
  },
]

// 샘플 콘텐츠
export const mockContents: Content[] = [
  {
    id: 'content-001',
    user_id: 'user-001',
    collection_id: 'collection-001',
    file_name: 'image01.jpg',
    file_path: 'user-001/1729680000_image01.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      labels: [
        { description: 'Nature', score: 0.95 },
        { description: 'Landscape', score: 0.89 },
      ],
    },
    text_data: {
      text: 'Sample detected text',
    },
    created_at: '2025-10-20T10:00:00Z',
    user_name: '김철수',
    collection_name: '풍경 사진',
    detected_count: 3,
  },
  {
    id: 'content-002',
    user_id: 'user-001',
    collection_id: null,
    file_name: 'logo.png',
    file_path: 'user-001/1729680100_logo.png',
    is_analyzed: null, // 분석 대기
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2025-10-24T09:00:00Z',
    user_name: '김철수',
    detected_count: 0,
  },
  {
    id: 'content-003',
    user_id: 'user-003',
    collection_id: 'collection-002',
    file_name: 'poster.jpg',
    file_path: 'user-003/1729680200_poster.jpg',
    is_analyzed: false, // 분석 중
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2025-10-23T14:30:00Z',
    user_name: '박민수',
    collection_name: '광고 포스터',
    detected_count: 0,
  },
  {
    id: 'content-004',
    user_id: 'user-001',
    collection_id: 'collection-001',
    file_name: 'artwork.png',
    file_path: 'user-001/1729680300_artwork.png',
    is_analyzed: true,
    message: null,
    label_data: {
      labels: [
        { description: 'Art', score: 0.92 },
        { description: 'Painting', score: 0.88 },
      ],
    },
    text_data: null,
    created_at: '2025-10-19T11:20:00Z',
    user_name: '김철수',
    collection_name: '풍경 사진',
    detected_count: 1,
  },
]

// 샘플 발견 콘텐츠
export const mockDetectedContents: DetectedContent[] = [
  {
    id: 'detection-001',
    content_id: 'content-001',
    source_url: 'https://example.com/page1',
    image_url: 'https://example.com/images/similar1.jpg',
    page_title: 'Example Page 1',
    detection_type: 'full',
    admin_review_status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-10-20T12:00:00Z',
    original_image_path: 'user-001/1729680000_image01.jpg',
    original_file_name: 'image01.jpg',
  },
  {
    id: 'detection-002',
    content_id: 'content-001',
    source_url: null,
    image_url: 'https://example.com/images/similar2.jpg',
    page_title: null,
    detection_type: 'partial',
    admin_review_status: 'match',
    reviewed_by: 'admin-001',
    reviewed_at: '2025-10-21T10:00:00Z',
    created_at: '2025-10-20T12:00:00Z',
    original_image_path: 'user-001/1729680000_image01.jpg',
    original_file_name: 'image01.jpg',
    reviewer_name: '관리자',
  },
  {
    id: 'detection-003',
    content_id: 'content-001',
    source_url: 'https://example.com/page3',
    image_url: 'https://example.com/images/similar3.jpg',
    page_title: 'Example Page 3',
    detection_type: 'similar',
    admin_review_status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-10-20T12:30:00Z',
    original_image_path: 'user-001/1729680000_image01.jpg',
    original_file_name: 'image01.jpg',
  },
]

// 대시보드 통계
export const mockDashboardStats: DashboardStats = {
  total_contents: 42, // 총 콘텐츠
  pending_contents: 8, // 대기중 (is_analyzed = NULL)
  analyzing_contents: 5, // 분석중 (is_analyzed = FALSE)
  completed_contents: 29, // 분석완료 (is_analyzed = TRUE)
  total_users: 18, // 총 회원수
}

// 대기중인 콘텐츠 (최근 10개)
export const mockPendingContents: PendingContent[] = [
  {
    id: 'content-002',
    file_name: 'logo.png',
    user_name: '김철수',
    created_at: '2025-10-24T09:00:00Z',
  },
  {
    id: 'content-010',
    file_name: 'banner.jpg',
    user_name: '이영희',
    created_at: '2025-10-24T08:45:00Z',
  },
  {
    id: 'content-011',
    file_name: 'thumbnail.png',
    user_name: '박민수',
    created_at: '2025-10-24T08:30:00Z',
  },
  {
    id: 'content-012',
    file_name: 'cover.jpg',
    user_name: '김철수',
    created_at: '2025-10-24T08:15:00Z',
  },
  {
    id: 'content-013',
    file_name: 'illustration.png',
    user_name: '이영희',
    created_at: '2025-10-24T08:00:00Z',
  },
]

// 가입 요청 (최근 10개)
export const mockPendingUsers: PendingUser[] = [
  {
    id: 'user-002',
    name: '이영희',
    email: 'lee@example.com',
    created_at: '2025-10-23T00:00:00Z',
  },
  {
    id: 'user-015',
    name: '박민수',
    email: 'park@example.com',
    created_at: '2025-10-22T14:30:00Z',
  },
  {
    id: 'user-016',
    name: '정수진',
    email: 'jung@example.com',
    created_at: '2025-10-22T10:20:00Z',
  },
  {
    id: 'user-017',
    name: '강동원',
    email: 'kang@example.com',
    created_at: '2025-10-21T16:45:00Z',
  },
]

// Placeholder 이미지 URL (실제 Supabase Storage 대신)
export const getPlaceholderImageUrl = (
  width: number = 400,
  height: number = 300,
  seed?: string
): string => {
  return `https://picsum.photos/seed/${seed || 'random'}/${width}/${height}`
}
