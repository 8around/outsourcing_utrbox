// Collection type definitions
// DB 스키마와 일치하는 타입 정의

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  item_count?: number
  created_at: string
  updated_at: string
}
