// API response type definitions

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
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
