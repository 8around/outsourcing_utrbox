import {
  ApiResponse,
  PaginatedResponse,
  Content,
  AnalysisResult,
  DetectedContent,
  ReviewStatus,
} from '@/types'
import { mockContents, mockAnalysisResults, mockDetectedContents } from '@/lib/mock-data'

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockContentsApi = {
  // Get all contents with pagination and filters
  getContents: async (params: {
    page?: number
    limit?: number
    userId?: string
    collectionId?: string
    status?: string
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<Content>>> => {
    await delay()

    let filteredContents = [...mockContents]

    // Filter by user
    if (params.userId) {
      filteredContents = filteredContents.filter((c) => c.user_id === params.userId)
    }

    // Filter by collection
    if (params.collectionId) {
      filteredContents = filteredContents.filter((c) => c.collection_id === params.collectionId)
    }

    // Filter by status
    if (params.status) {
      filteredContents = filteredContents.filter((c) => c.analysis_status === params.status)
    }

    // Search by title or description
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filteredContents = filteredContents.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const total = filteredContents.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredContents.slice(startIndex, endIndex)

    return {
      data: {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages,
      },
      error: null,
      success: true,
    }
  },

  // Get single content by ID
  getContent: async (id: string): Promise<ApiResponse<Content>> => {
    await delay()

    const content = mockContents.find((c) => c.id === id)

    if (!content) {
      return {
        data: null,
        error: '콘텐츠를 찾을 수 없습니다.',
        success: false,
      }
    }

    return {
      data: content,
      error: null,
      success: true,
    }
  },

  // Upload content (mock)
  uploadContent: async (data: {
    userId: string
    collectionId: string | null
    title: string
    description: string
    file: File
  }): Promise<ApiResponse<Content>> => {
    await delay(1500) // Simulate upload time

    const newContent: Content = {
      id: `content-${Date.now()}`,
      user_id: data.userId,
      collection_id: data.collectionId,
      title: data.title,
      description: data.description,
      file_url: URL.createObjectURL(data.file), // Mock URL
      file_size: data.file.size,
      file_type: data.file.type.includes('png') ? 'png' : 'jpg',
      analysis_status: 'pending',
      detection_count: 0,
      upload_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return {
      data: newContent,
      error: null,
      success: true,
    }
  },

  // Delete content
  deleteContent: async (id: string): Promise<ApiResponse<null>> => {
    await delay()

    const content = mockContents.find((c) => c.id === id)

    if (!content) {
      return {
        data: null,
        error: '콘텐츠를 찾을 수 없습니다.',
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  },

  // Get analysis result for content
  getAnalysisResult: async (contentId: string): Promise<ApiResponse<AnalysisResult>> => {
    await delay()

    const result = mockAnalysisResults.find((r) => r.content_id === contentId)

    if (!result) {
      return {
        data: null,
        error: '분석 결과를 찾을 수 없습니다.',
        success: false,
      }
    }

    return {
      data: result,
      error: null,
      success: true,
    }
  },

  // Get detected contents for original content
  getDetectedContents: async (
    originalContentId: string
  ): Promise<ApiResponse<DetectedContent[]>> => {
    await delay()

    const detectedList = mockDetectedContents.filter(
      (d) => d.original_content_id === originalContentId
    )

    return {
      data: detectedList,
      error: null,
      success: true,
    }
  },

  // Update detected content review
  updateDetectionReview: async (
    id: string,
    reviewData: {
      reviewStatus: string
      reviewNote?: string
      reviewedBy: string
    }
  ): Promise<ApiResponse<DetectedContent>> => {
    await delay()

    const detected = mockDetectedContents.find((d) => d.id === id)

    if (!detected) {
      return {
        data: null,
        error: '발견 콘텐츠를 찾을 수 없습니다.',
        success: false,
      }
    }

    const updated: DetectedContent = {
      ...detected,
      review_status: reviewData.reviewStatus as ReviewStatus,
      review_note: reviewData.reviewNote,
      reviewed_by: reviewData.reviewedBy,
      reviewed_at: new Date().toISOString(),
    }

    return {
      data: updated,
      error: null,
      success: true,
    }
  },
}
