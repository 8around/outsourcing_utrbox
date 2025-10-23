import { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@utrbox.com',
    name: '관리자',
    organization: 'UTRBOX',
    role: 'Admin',
    status: 'approved',
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'user-2',
    email: 'pulwind00@gmail.com',
    name: '테스트 사용자',
    organization: '8around',
    role: 'Member',
    status: 'approved',
    created_at: '2025-01-16T10:30:00Z',
    updated_at: '2025-01-16T10:30:00Z',
  },
  {
    id: 'user-3',
    email: 'john.kim@example.com',
    name: '김철수',
    organization: '디자인스튜디오',
    role: 'Member',
    status: 'approved',
    created_at: '2025-02-01T14:20:00Z',
    updated_at: '2025-02-01T14:20:00Z',
  },
  {
    id: 'user-4',
    email: 'sarah.lee@example.com',
    name: '이영희',
    organization: '포토그래퍼스',
    role: 'Member',
    status: 'approved',
    created_at: '2025-02-10T11:15:00Z',
    updated_at: '2025-02-10T11:15:00Z',
  },
  {
    id: 'user-5',
    email: 'mike.park@example.com',
    name: '박민수',
    organization: '크리에이티브랩',
    role: 'Member',
    status: 'pending',
    created_at: '2025-10-20T16:45:00Z',
    updated_at: '2025-10-20T16:45:00Z',
  },
  {
    id: 'user-6',
    email: 'admin2@utrbox.com',
    name: '부관리자',
    organization: 'UTRBOX',
    role: 'Admin',
    status: 'approved',
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T09:30:00Z',
  },
  {
    id: 'user-7',
    email: 'anna.choi@example.com',
    name: '최지은',
    organization: '아트컬렉션',
    role: 'Member',
    status: 'approved',
    created_at: '2025-03-05T13:00:00Z',
    updated_at: '2025-03-05T13:00:00Z',
  },
  {
    id: 'user-8',
    email: 'david.jung@example.com',
    name: '정대위',
    organization: '브랜딩에이전시',
    role: 'Member',
    status: 'approved',
    created_at: '2025-04-12T10:00:00Z',
    updated_at: '2025-04-12T10:00:00Z',
  },
  {
    id: 'user-9',
    email: 'blocked@example.com',
    name: '차단된사용자',
    organization: '테스트',
    role: 'Member',
    status: 'blocked',
    created_at: '2025-05-01T09:00:00Z',
    updated_at: '2025-10-15T14:30:00Z',
  },
  {
    id: 'user-10',
    email: 'pending@example.com',
    name: '대기중사용자',
    organization: '신규업체',
    role: 'Member',
    status: 'pending',
    created_at: '2025-10-22T08:00:00Z',
    updated_at: '2025-10-22T08:00:00Z',
  },
]

// Helper function to find user by email (for mock login)
export const findUserByEmail = (email: string): User | undefined => {
  return mockUsers.find((user) => user.email === email)
}

// Helper function to get approved users only
export const getApprovedUsers = (): User[] => {
  return mockUsers.filter((user) => user.status === 'approved')
}
