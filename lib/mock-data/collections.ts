import { Collection } from '@/types'

export const mockCollections: Collection[] = [
  {
    id: 'col-1',
    user_id: 'user-2',
    name: '여행 사진',
    description: '국내외 여행 중 촬영한 풍경 사진 모음',
    item_count: 12,
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2025-10-20T14:30:00Z',
  },
  {
    id: 'col-2',
    user_id: 'user-2',
    name: '제품 촬영',
    description: '상품 상세 페이지용 제품 사진',
    item_count: 8,
    created_at: '2025-05-15T11:20:00Z',
    updated_at: '2025-10-18T09:15:00Z',
  },
  {
    id: 'col-3',
    user_id: 'user-3',
    name: '포트폴리오',
    description: '디자인 작업물 포트폴리오',
    item_count: 5,
    created_at: '2025-02-10T14:00:00Z',
    updated_at: '2025-09-30T16:45:00Z',
  },
  {
    id: 'col-4',
    user_id: 'user-4',
    name: '이벤트 사진',
    description: '회사 행사 및 이벤트 사진',
    item_count: 3,
    created_at: '2025-06-20T09:30:00Z',
    updated_at: '2025-10-10T11:00:00Z',
  },
  {
    id: 'col-5',
    user_id: 'user-2',
    name: '기타',
    description: '분류되지 않은 이미지',
    item_count: 2,
    created_at: '2025-08-01T15:00:00Z',
    updated_at: '2025-10-22T10:20:00Z',
  },
]
