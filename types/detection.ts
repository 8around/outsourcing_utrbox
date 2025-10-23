// Detected content type definitions

export type ReviewStatus = 'pending' | 'match' | 'no_match' | 'unclear'
export type DetectionType = 'full' | 'partial' | 'similar'

export interface DetectedContent {
  id: string
  original_content_id: string
  detected_url: string
  similarity_score: number
  detection_type: DetectionType
  review_status: ReviewStatus
  reviewed_by?: string
  reviewed_at?: string
  review_note?: string
  detected_at: string
}
