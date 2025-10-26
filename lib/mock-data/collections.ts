import { Collection } from '@/types'

// DB 스키마와 일치하는 Mock Collections 데이터
export const mockCollections: Collection[] = [
  {
    id: 'collection-1',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8', // pulwind00@gmail.com
    name: '프로젝트 A',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'collection-2',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    name: '마케팅 자료',
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-02-10T14:30:00Z',
  },
  {
    id: 'collection-3',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    name: '제품 사진',
    created_at: '2024-03-05T11:20:00Z',
    updated_at: '2024-03-05T11:20:00Z',
  },
  {
    id: 'collection-4',
    user_id: 'user-3', // john.kim@example.com
    name: '디자인 포트폴리오',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'collection-5',
    user_id: 'user-4', // sarah.lee@example.com
    name: '촬영본',
    created_at: '2024-02-01T08:30:00Z',
    updated_at: '2024-02-01T08:30:00Z',
  },
  {
    id: 'collection-6',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    name: '기타',
    created_at: '2024-08-01T15:00:00Z',
    updated_at: '2024-10-22T10:20:00Z',
  },
]

// Helper function to get collections by user
export const getCollectionsByUser = (userId: string): Collection[] => {
  return mockCollections.filter((collection) => collection.user_id === userId)
}

// Helper function to get collection by id
export const getCollectionById = (id: string): Collection | undefined => {
  return mockCollections.find((collection) => collection.id === id)
}
