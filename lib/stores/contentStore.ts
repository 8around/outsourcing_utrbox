import { create } from 'zustand'
import { Content, Collection } from '@/types'

interface ContentState {
  contents: Content[]
  collections: Collection[]
  selectedContent: Content | null
  setContents: (contents: Content[]) => void
  setCollections: (collections: Collection[]) => void
  addContent: (content: Content) => void
  updateContent: (id: string, content: Partial<Content>) => void
  deleteContent: (id: string) => void
  setSelectedContent: (content: Content | null) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, collection: Partial<Collection>) => void
  deleteCollection: (id: string) => void
}

export const useContentStore = create<ContentState>()((set) => ({
  contents: [],
  collections: [],
  selectedContent: null,
  setContents: (contents) => set({ contents }),
  setCollections: (collections) => set({ collections }),
  addContent: (content) => set((state) => ({ contents: [...state.contents, content] })),
  updateContent: (id, contentData) =>
    set((state) => ({
      contents: state.contents.map((c) => (c.id === id ? { ...c, ...contentData } : c)),
    })),
  deleteContent: (id) =>
    set((state) => ({
      contents: state.contents.filter((c) => c.id !== id),
    })),
  setSelectedContent: (content) => set({ selectedContent: content }),
  addCollection: (collection) =>
    set((state) => ({ collections: [...state.collections, collection] })),
  updateCollection: (id, collectionData) =>
    set((state) => ({
      collections: state.collections.map((c) => (c.id === id ? { ...c, ...collectionData } : c)),
    })),
  deleteCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),
}))
