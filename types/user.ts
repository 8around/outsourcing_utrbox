// User type definitions

export type UserRole = 'Admin' | 'Member'
export type UserStatus = 'pending' | 'approved' | 'blocked'

export interface User {
  id: string
  email: string
  name: string
  organization: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}
