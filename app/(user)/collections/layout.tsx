'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useExplorerStore } from '@/lib/stores/explorerStore'
import { StatsCards, ExplorerToolbar, CreateCollectionModal } from '@/components/explorer'
import { ConfirmDialog } from '@/components/common'
import { getCollections, getCollection, deleteCollection } from '@/lib/api/collections'
import { useToast } from '@/hooks/use-toast'

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { sortBy, sortOrder, collections, currentCollection, setCollections, setCurrentCollection } = useExplorerStore()
  const { toast } = useToast()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  // 현재 경로에서 collectionId 추출
  const collectionId =
    pathname?.startsWith('/collections/') && params?.id ? (params.id as string) : null

  // 레이아웃 레벨 상태
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // 컬렉션 삭제 핸들러
  const handleDeleteCollection = () => {
    setIsDeleteDialogOpen(true)
  }

  // 컬렉션 삭제 확인
  const handleConfirmDelete = async () => {
    if (!currentCollection) return

    setIsDeleting(true)
    try {
      const result = await deleteCollection(currentCollection.id)

      if (result.success) {
        // 성공 메시지
        toast({
          title: '성공',
          description: '컬렉션이 삭제되었습니다.',
        })

        // 다이얼로그 닫기
        setIsDeleteDialogOpen(false)

        // 컬렉션 목록 페이지로 이동
        router.push('/collections')

        // 컬렉션 목록 새로고침
        if (user) {
          const collectionsRes = await getCollections(user.id, sortBy, sortOrder)
          if (collectionsRes.success && collectionsRes.data) {
            setCollections(collectionsRes.data)
          }
        }
      } else {
        toast({
          title: '오류',
          description: result.error || '컬렉션 삭제에 실패했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('컬렉션 삭제 중 오류:', error)
      toast({
        title: '오류',
        description: '컬렉션 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
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
          onDeleteCollection={handleDeleteCollection}
        />
      </div>

      {/* 페이지 컨텐츠 */}
      {children}

      {/* 컬렉션 생성 모달 */}
      <CreateCollectionModal
        open={isCreateCollectionModalOpen}
        onOpenChange={setIsCreateCollectionModalOpen}
        onCollectionCreated={async (collection) => {
          // 생성된 컬렉션 페이지로 이동
          router.push(`/collections/${collection.id}`)

          // 컬렉션 목록도 업데이트
          if (user) {
            const collectionsRes = await getCollections(user.id, sortBy, sortOrder)
            if (collectionsRes.success && collectionsRes.data) {
              setCollections(collectionsRes.data)
            }
          }
        }}
      />

      {/* 컬렉션 삭제 다이얼로그 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="컬렉션을 삭제하시겠습니까?"
        description={`[${currentCollection?.name}] 컬렉션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.\n컬렉션에 포함된 모든 콘텐츠도 함께 삭제됩니다.`}
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        cancelText="취소"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
