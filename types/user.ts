// User type definitions

export type UserRole = 'admin' | 'member'

export interface User {
  id: string
  email: string
  name: string
  organization: string
  role: UserRole
  isApproved: boolean | null
}
