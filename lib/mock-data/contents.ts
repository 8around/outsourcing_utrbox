import { Content } from '@/types'

// DB 스키마와 일치하는 Mock Contents 데이터
// Supabase Storage 경로 형식: {user_id}/{timestamp}_{filename}

export const mockContents: Content[] = [
  // Collection 1 - 프로젝트 A (현재 로그인 사용자)
  {
    id: 'content-1',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '제주도_성산일출봉.jpg',
    file_path: 'user-2/1709632200000_jeju_seongsan.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Mountain', score: 0.97 },
            { description: 'Sky', score: 0.95 },
            { description: 'Landmark', score: 0.92 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-03-05T09:30:00Z',
    updated_at: '2024-03-05T10:15:00Z',
  },
  {
    id: 'content-2',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '부산_해운대.jpg',
    file_path: 'user-2/1709891600000_busan_haeundae.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Beach', score: 0.98 },
            { description: 'Ocean', score: 0.96 },
            { description: 'Summer', score: 0.93 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-03-08T14:20:00Z',
    updated_at: '2024-03-08T15:00:00Z',
  },
  {
    id: 'content-3',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '경주_불국사.jpg',
    file_path: 'user-2/1712920800000_gyeongju_bulguksa.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Temple', score: 0.99 },
            { description: 'Architecture', score: 0.97 },
            { description: 'Historic', score: 0.94 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-04-12T11:00:00Z',
    updated_at: '2024-04-12T11:30:00Z',
  },
  {
    id: 'content-4',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '파리_에펠탑.jpg',
    file_path: 'user-2/1716224700000_paris_eiffel.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Eiffel Tower', score: 0.99 },
            { description: 'Paris', score: 0.98 },
            { description: 'Landmark', score: 0.97 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-05-20T16:45:00Z',
    updated_at: '2024-05-20T17:20:00Z',
  },
  {
    id: 'content-5',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '런던_빅벤.jpg',
    file_path: 'user-2/1716376800000_london_bigben.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Big Ben', score: 0.99 },
            { description: 'London', score: 0.98 },
            { description: 'Clock Tower', score: 0.96 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-05-22T10:00:00Z',
    updated_at: '2024-05-22T10:45:00Z',
  },
  {
    id: 'content-6',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-1',
    file_name: '뉴욕_자유의여신상.jpg',
    file_path: 'user-2/1729426200000_newyork_liberty.jpg',
    is_analyzed: false,
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2024-10-20T13:30:00Z',
    updated_at: '2024-10-20T13:30:00Z',
  },

  // Collection 2 - 마케팅 자료 (user-2)
  {
    id: 'content-7',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-2',
    file_name: '제품_프로모션_배너.png',
    file_path: 'user-2/1709632200001_promo_banner.png',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Advertisement', score: 0.95 },
            { description: 'Product', score: 0.93 },
            { description: 'Marketing', score: 0.91 },
          ],
        },
      ],
    },
    text_data: {
      responses: [
        {
          textAnnotations: [
            { description: 'SALE 50% OFF', locale: 'en' },
            { description: 'Limited Time Offer', locale: 'en' },
          ],
        },
      ],
    },
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-02-15T10:30:00Z',
  },
  {
    id: 'content-8',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-2',
    file_name: '신제품_런칭_포스터.jpg',
    file_path: 'user-2/1709718600000_launch_poster.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Poster', score: 0.97 },
            { description: 'Design', score: 0.94 },
            { description: 'Typography', score: 0.90 },
          ],
        },
      ],
    },
    text_data: {
      responses: [
        {
          textAnnotations: [
            { description: 'NEW ARRIVAL', locale: 'en' },
            { description: '2024 COLLECTION', locale: 'en' },
          ],
        },
      ],
    },
    created_at: '2024-02-18T14:30:00Z',
    updated_at: '2024-02-18T15:00:00Z',
  },
  {
    id: 'content-9',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-2',
    file_name: 'SNS_광고_이미지.jpg',
    file_path: 'user-2/1710152400000_sns_ad.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Social Media', score: 0.96 },
            { description: 'Advertisement', score: 0.94 },
            { description: 'Digital Marketing', score: 0.92 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-02-25T09:20:00Z',
    updated_at: '2024-02-25T09:50:00Z',
  },

  // Collection 3 - 제품 사진 (user-2)
  {
    id: 'content-10',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-3',
    file_name: '노트북_제품샷.jpg',
    file_path: 'user-2/1709891600001_laptop_product.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Laptop', score: 0.99 },
            { description: 'Computer', score: 0.98 },
            { description: 'Technology', score: 0.96 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-03-10T14:00:00Z',
    updated_at: '2024-03-10T14:30:00Z',
  },
  {
    id: 'content-11',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-3',
    file_name: '스마트폰_화이트.jpg',
    file_path: 'user-2/1710325500000_smartphone_white.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Smartphone', score: 0.99 },
            { description: 'Mobile Phone', score: 0.98 },
            { description: 'Electronics', score: 0.97 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-03-15T09:30:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 'content-12',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-3',
    file_name: '무선_이어폰.png',
    file_path: 'user-2/1711624800000_wireless_earbuds.png',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Earbuds', score: 0.98 },
            { description: 'Audio', score: 0.96 },
            { description: 'Wireless', score: 0.95 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-03-20T11:20:00Z',
    updated_at: '2024-03-20T11:50:00Z',
  },
  {
    id: 'content-13',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: 'collection-3',
    file_name: '스마트워치_블랙.jpg',
    file_path: 'user-2/1712920800001_smartwatch_black.jpg',
    is_analyzed: false,
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2024-10-21T15:00:00Z',
    updated_at: '2024-10-21T15:00:00Z',
  },

  // Collection 없음 (user-2)
  {
    id: 'content-14',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: null,
    file_name: '랜덤_테스트_이미지.jpg',
    file_path: 'user-2/1729339200000_random_test.jpg',
    is_analyzed: null,
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2024-10-19T13:00:00Z',
    updated_at: '2024-10-19T13:00:00Z',
  },
  {
    id: 'content-15',
    user_id: '4d1344c2-a09f-47bc-856e-2fd796fb53e8',
    collection_id: null,
    file_name: '오류_테스트.jpg',
    file_path: 'user-2/1729425600000_error_test.jpg',
    is_analyzed: false,
    message: 'Vision API 요청 중 오류가 발생했습니다. 파일 형식을 확인해주세요.',
    label_data: null,
    text_data: null,
    created_at: '2024-10-20T13:00:00Z',
    updated_at: '2024-10-20T13:05:00Z',
  },

  // Collection 4 - 디자인 포트폴리오 (user-3)
  {
    id: 'content-16',
    user_id: 'user-3',
    collection_id: 'collection-4',
    file_name: '브랜딩_디자인_A.jpg',
    file_path: 'user-3/1708077000000_branding_design_a.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Design', score: 0.98 },
            { description: 'Branding', score: 0.96 },
            { description: 'Creative', score: 0.94 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-02-16T10:30:00Z',
    updated_at: '2024-02-16T11:00:00Z',
  },
  {
    id: 'content-17',
    user_id: 'user-3',
    collection_id: 'collection-4',
    file_name: '포스터_디자인.jpg',
    file_path: 'user-3/1713614700000_poster_design.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Poster', score: 0.97 },
            { description: 'Graphic Design', score: 0.95 },
            { description: 'Art', score: 0.93 },
          ],
        },
      ],
    },
    text_data: {
      responses: [
        {
          textAnnotations: [
            { description: 'EXHIBITION 2024', locale: 'en' },
          ],
        },
      ],
    },
    created_at: '2024-04-20T14:15:00Z',
    updated_at: '2024-04-20T14:45:00Z',
  },

  // Collection 5 - 촬영본 (user-4)
  {
    id: 'content-18',
    user_id: 'user-4',
    collection_id: 'collection-5',
    file_name: '창립기념일_행사.jpg',
    file_path: 'user-4/1719334800000_anniversary_event.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Event', score: 0.96 },
            { description: 'Celebration', score: 0.94 },
            { description: 'Party', score: 0.92 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-06-25T16:00:00Z',
    updated_at: '2024-06-25T16:45:00Z',
  },
  {
    id: 'content-19',
    user_id: 'user-4',
    collection_id: 'collection-5',
    file_name: '신제품_런칭행사.jpg',
    file_path: 'user-4/1725008400000_product_launch.jpg',
    is_analyzed: true,
    message: null,
    label_data: {
      responses: [
        {
          labelAnnotations: [
            { description: 'Product Launch', score: 0.97 },
            { description: 'Business Event', score: 0.95 },
            { description: 'Presentation', score: 0.93 },
          ],
        },
      ],
    },
    text_data: null,
    created_at: '2024-08-30T10:20:00Z',
    updated_at: '2024-08-30T11:00:00Z',
  },
  {
    id: 'content-20',
    user_id: 'user-4',
    collection_id: 'collection-5',
    file_name: '워크샵_단체사진.jpg',
    file_path: 'user-4/1728995400000_workshop_group.jpg',
    is_analyzed: false,
    message: null,
    label_data: null,
    text_data: null,
    created_at: '2024-10-15T14:30:00Z',
    updated_at: '2024-10-15T14:30:00Z',
  },
]

// Helper function to get contents by user
export const getContentsByUser = (userId: string): Content[] => {
  return mockContents.filter((content) => content.user_id === userId)
}

// Helper function to get contents by collection
export const getContentsByCollection = (collectionId: string | null): Content[] => {
  return mockContents.filter((content) => content.collection_id === collectionId)
}

// Helper function to get content by id
export const getContentById = (id: string): Content | undefined => {
  return mockContents.find((content) => content.id === id)
}

// Helper function to get detected content count
export const getDetectionCount = (contentId: string): number => {
  // This will be implemented with detected_contents mock data
  // For now, returning mock values based on content
  const detectionMap: Record<string, number> = {
    'content-1': 3,
    'content-2': 5,
    'content-3': 1,
    'content-4': 8,
    'content-5': 2,
    'content-7': 2,
    'content-8': 1,
    'content-16': 0,
    'content-17': 1,
    'content-18': 2,
    'content-19': 1,
  }
  return detectionMap[contentId] || 0
}
