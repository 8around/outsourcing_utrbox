// Content type definitions
// DB 스키마와 일치하는 타입 정의

// Google Vision API LABEL_DETECTION 결과 타입
export interface LabelData {
  labels?: Array<{
    description: string
    score: number
  }>
}

// Google Vision API TEXT_DETECTION 결과 타입
export interface TextData {
  text?: string
  words?: string[]
}

export interface Content {
  id: string
  user_id: string
  collection_id: string | null
  file_name: string
  file_path: string // Supabase Storage 경로
  is_analyzed: boolean | null // null: 대기, false: 분석중, true: 완료
  message: string | null // 사용자 전달 메시지 또는 에러 메시지
  label_data: Record<string, unknown> | null // Google Vision LABEL_DETECTION 결과
  text_data: Record<string, unknown> | null // Google Vision TEXT_DETECTION 결과
  created_at: string
  updated_at: string
}

// 관리자 상세 페이지용 확장 타입 (users, collections JOIN 포함)
export interface ContentDetail extends Omit<Content, 'label_data' | 'text_data'> {
  label_data: LabelData | null
  text_data: TextData | null
  user_name?: string | null
  collection_name?: string | null
  detected_count?: number
}

// UI에서 사용할 헬퍼 타입
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed'

// Content 타입에서 분석 상태 추출 헬퍼 함수
export function getAnalysisStatus(content: Content): AnalysisStatus {
  if (content.is_analyzed === null) return 'pending'
  if (content.is_analyzed === false) {
    return content.message ? 'failed' : 'analyzing'
  }
  return 'completed'
}
