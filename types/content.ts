// Content type definitions

export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed'
export type FileType = 'jpg' | 'png'

export interface Content {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  description: string
  file_url: string
  file_size: number
  file_type: FileType
  analysis_status: AnalysisStatus
  detection_count: number
  upload_date: string
  updated_at: string
}
