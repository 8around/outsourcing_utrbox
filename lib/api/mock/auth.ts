import { ApiResponse, User } from '@/types'
import { mockUsers, findUserByEmail } from '@/lib/mock-data'

// Simulate API delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockAuthApi = {
  // Mock login
  login: async (email: string, password: string): Promise<ApiResponse<User>> => {
    await delay()

    const user = findUserByEmail(email)

    if (!user) {
      return {
        data: null,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        success: false,
      }
    }

    // Mock password check (in real app, this would be verified on backend)
    if (password.length < 8) {
      return {
        data: null,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        success: false,
      }
    }

    if (user.status === 'blocked') {
      return {
        data: null,
        error: '차단된 계정입니다. 관리자에게 문의하세요.',
        success: false,
      }
    }

    if (user.status === 'pending') {
      return {
        data: null,
        error: '승인 대기 중인 계정입니다.',
        success: false,
      }
    }

    return {
      data: user,
      error: null,
      success: true,
    }
  },

  // Mock signup
  signup: async (userData: {
    email: string
    password: string
    name: string
    organization: string
  }): Promise<ApiResponse<User>> => {
    await delay()

    // Check if email already exists
    const existingUser = findUserByEmail(userData.email)
    if (existingUser) {
      return {
        data: null,
        error: '이미 등록된 이메일입니다.',
        success: false,
      }
    }

    // Create new user (pending status)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      organization: userData.organization,
      role: 'Member',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return {
      data: newUser,
      error: null,
      success: true,
    }
  },

  // Mock password reset
  resetPassword: async (email: string): Promise<ApiResponse<null>> => {
    await delay()

    const user = findUserByEmail(email)
    if (!user) {
      return {
        data: null,
        error: '등록되지 않은 이메일입니다.',
        success: false,
      }
    }

    // In real app, this would send email
    return {
      data: null,
      error: null,
      success: true,
    }
  },

  // Mock logout
  logout: async (): Promise<ApiResponse<null>> => {
    await delay(200)
    return {
      data: null,
      error: null,
      success: true,
    }
  },
}
