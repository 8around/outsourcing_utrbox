// API response type definitions

import { Session } from '@supabase/supabase-js'
import { User } from './user'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
  message?: string
}

export interface AuthResponse<T = any> {
  success: boolean
  data: T | null
  error: string | null
  message?: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  organization: string
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  session: Session
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined
}
