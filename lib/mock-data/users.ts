import { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@utrbox.com',
    name: '관리자',
    organization: 'UTRBOX',
    role: 'admin',
    isApproved: true,
  },
  {
    id: 'user-2',
    email: 'pulwind00@gmail.com',
    name: '테스트 사용자',
    organization: '8around',
    role: 'member',
    isApproved: true,
  },
  {
    id: 'user-3',
    email: 'john.kim@example.com',
    name: '김철수',
    organization: '디자인스튜디오',
    role: 'member',
    isApproved: true,
  },
  {
    id: 'user-4',
    email: 'sarah.lee@example.com',
    name: '이영희',
    organization: '포토그래퍼스',
    role: 'member',
    isApproved: true,
  },
  {
    id: 'user-5',
    email: 'mike.park@example.com',
    name: '박민수',
    organization: '크리에이티브랩',
    role: 'member',
    isApproved: null,
  },
  {
    id: 'user-6',
    email: 'admin2@utrbox.com',
    name: '부관리자',
    organization: 'UTRBOX',
    role: 'admin',
    isApproved: true,
  },
  {
    id: 'user-7',
    email: 'anna.choi@example.com',
    name: '최지은',
    organization: '아트컬렉션',
    role: 'member',
    isApproved: true,
  },
  {
    id: 'user-8',
    email: 'david.jung@example.com',
    name: '정대위',
    organization: '브랜딩에이전시',
    role: 'member',
    isApproved: true,
  },
  {
    id: 'user-9',
    email: 'blocked@example.com',
    name: '차단된사용자',
    organization: '테스트',
    role: 'member',
    isApproved: false,
  },
  {
    id: 'user-10',
    email: 'pending@example.com',
    name: '대기중사용자',
    organization: '신규업체',
    role: 'member',
    isApproved: null,
  },
]

// Helper function to find user by email (for mock login)
export const findUserByEmail = (email: string): User | undefined => {
  return mockUsers.find((user) => user.email === email)
}

// Helper function to get approved users only
export const getApprovedUsers = (): User[] => {
  return mockUsers.filter((user) => user.isApproved === true)
}
