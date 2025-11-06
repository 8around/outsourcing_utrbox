'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { StatsCards, ExplorerToolbar, CreateCollectionModal } from '@/components/explorer'
import { getCollections, getCollection } from '@/lib/api/collections'

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { sortBy, sortOrder, collections, currentCollection, setCollections, setCurrentCollection } = useExplorerStore()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  // 현재 경로에서 collectionId 추출
  const collectionId =
    pathname?.startsWith('/collections/') && params?.id ? (params.id as string) : null

  // 레이아웃 레벨 상태
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false)

  // 컬렉션 목록 로드
  useEffect(() => {
    const loadCollections = async () => {
      if (!user) return

      try {
        const collectionsRes = await getCollections(user.id, sortBy, sortOrder)
        if (collectionsRes.success && collectionsRes.data) {
          setCollections(collectionsRes.data)
        }
      } catch (err) {
        console.error('컬렉션 로드 오류:', err)
      }
    }

    loadCollections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy, sortOrder])

  // 현재 컬렉션 로드
  useEffect(() => {
    const loadCurrentCollection = async () => {
      if (collectionId) {
        try {
          const collectionRes = await getCollection(collectionId)
          if (collectionRes.success && collectionRes.data) {
            setCurrentCollection(collectionRes.data)
          }
        } catch (err) {
          console.error('현재 컬렉션 로드 오류:', err)
          setCurrentCollection(null)
        }
      } else {
        setCurrentCollection(null)
      }
    }

    loadCurrentCollection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  // 컬렉션 변경 핸들러 (드롭다운에서 선택 시)
  const handleCollectionChange = (collectionId: string | null) => {
    if (collectionId === null) {
      router.push('/collections')
    } else {
      router.push(`/collections/${collectionId}`)
    }
  }

  // 컬렉션 생성 핸들러
  const handleCreateCollection = () => {
    setIsCreateCollectionModalOpen(true)
  }

  // 새로고침 핸들러
  const handleRefresh = async () => {
    if (!user) return
    
    try {
      const [collectionsRes, collectionRes] = await Promise.all([
        getCollections(user.id, sortBy, sortOrder),
        collectionId ? getCollection(collectionId) : Promise.resolve({ success: true, data: null }),
      ])

      if (collectionsRes.success && collectionsRes.data) {
        setCollections(collectionsRes.data)
      }
      if (collectionRes.success) {
        setCurrentCollection(collectionRes.data)
      }

      // 페이지에 새로고침 이벤트 발행
      window.dispatchEvent(new CustomEvent('refresh-explorer-contents'))
    } catch (err) {
      console.error('새로고침 오류:', err)
    }
  }

  return (
    <>
      {/* StatsCards */}
      <div className="flex flex-col px-4 pt-4 gap-y-4 sm:px-6 sm:pt-6 sm:gap-y-6 lg:px-8 xl:px-12">
        <StatsCards />

        {/* ExplorerToolbar */}
        <ExplorerToolbar
          currentCollection={currentCollection}
          collections={collections}
          onCollectionChange={handleCollectionChange}
          onCreateCollection={handleCreateCollection}
          onRefresh={handleRefresh}
        />
      </div>

      {/* 페이지 컨텐츠 */}
      {children}

      {/* 컬렉션 생성 모달 */}
      <CreateCollectionModal
        open={isCreateCollectionModalOpen}
        onOpenChange={setIsCreateCollectionModalOpen}
        onCollectionCreated={() => {
          handleRefresh()
        }}
      />
    </>
  )
}
