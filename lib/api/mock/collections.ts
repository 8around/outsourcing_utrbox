import { ApiResponse, Collection } from '@/types'
import { mockCollections } from '@/lib/mock-data'

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockCollectionsApi = {
  // Get all collections for a user
  getCollections: async (userId: string): Promise<ApiResponse<Collection[]>> => {
    await delay()

    const userCollections = mockCollections.filter((c) => c.user_id === userId)

    return {
      data: userCollections,
      error: null,
      success: true,
    }
  },

  // Get single collection
  getCollection: async (id: string): Promise<ApiResponse<Collection>> => {
    await delay()

    const collection = mockCollections.find((c) => c.id === id)

    if (!collection) {
      return {
        data: null,
        error: '컬렉션을 찾을 수 없습니다.',
        success: false,
      }
    }

    return {
      data: collection,
      error: null,
      success: true,
    }
  },

  // Create collection
  createCollection: async (data: {
    userId: string
    name: string
    description: string
  }): Promise<ApiResponse<Collection>> => {
    await delay()

    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      user_id: data.userId,
      name: data.name,
      description: data.description,
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return {
      data: newCollection,
      error: null,
      success: true,
    }
  },

  // Update collection
  updateCollection: async (
    id: string,
    data: {
      name?: string
      description?: string
    }
  ): Promise<ApiResponse<Collection>> => {
    await delay()

    const collection = mockCollections.find((c) => c.id === id)

    if (!collection) {
      return {
        data: null,
        error: '컬렉션을 찾을 수 없습니다.',
        success: false,
      }
    }

    const updated: Collection = {
      ...collection,
      ...data,
      updated_at: new Date().toISOString(),
    }

    return {
      data: updated,
      error: null,
      success: true,
    }
  },

  // Delete collection
  deleteCollection: async (id: string): Promise<ApiResponse<null>> => {
    await delay()

    const collection = mockCollections.find((c) => c.id === id)

    if (!collection) {
      return {
        data: null,
        error: '컬렉션을 찾을 수 없습니다.',
        success: false,
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    }
  },
}
