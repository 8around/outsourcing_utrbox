// Analysis result type definitions

export interface Label {
  description: string
  score: number
}

export interface AnalysisResult {
  id: string
  content_id: string
  labels: Label[]
  texts: string[]
  full_matching_images: string[]
  partial_matching_images: string[]
  similar_images: string[]
  analyzed_at: string
}
