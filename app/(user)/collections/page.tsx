'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/stores/authStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { mockCollections, mockContents } from '@/lib/mock-data'
import { Collection } from '@/types'
import { FolderOpen, Plus, Edit, Trash2, FileImage } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ConfirmDialog } from '@/components/common'
import Image from 'next/image'

export default function CollectionsPage() {
  const { user } = useAuthStore()
  const { setCollections } = useContentStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const userCollections = mockCollections.filter((c) => c.user_id === user?.id)

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCollections(userCollections)
      setIsLoading(false)
    }
    loadData()
  }, [user, setCollections])

  const getCollectionContents = (collectionId: string) => {
    return mockContents.filter((c) => c.collection_id === collectionId)
  }

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: '입력 오류',
        description: '컬렉션 이름을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: '생성 완료',
      description: `${formData.name} 컬렉션이 생성되었습니다`,
    })

    setShowCreateDialog(false)
    setFormData({ name: '', description: '' })
  }

  const handleEdit = () => {
    if (!formData.name.trim()) {
      toast({
        title: '입력 오류',
        description: '컬렉션 이름을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: '수정 완료',
      description: `${formData.name} 컬렉션이 수정되었습니다`,
    })

    setShowEditDialog(false)
    setSelectedCollection(null)
    setFormData({ name: '', description: '' })
  }

  const handleDelete = () => {
    if (!selectedCollection) return

    const contents = getCollectionContents(selectedCollection.id)
    if (contents.length > 0) {
      toast({
        title: '삭제 불가',
        description: '컬렉션에 콘텐츠가 있습니다. 먼저 콘텐츠를 이동하거나 삭제해주세요.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: '삭제 완료',
      description: `${selectedCollection.name} 컬렉션이 삭제되었습니다`,
    })

    setShowDeleteDialog(false)
    setSelectedCollection(null)
  }

  const openEditDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setShowDeleteDialog(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">컬렉션</h1>
          <p className="text-secondary-500 mt-1">총 {userCollections.length}개의 컬렉션</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />새 컬렉션
        </Button>
      </div>

      {/* Collections Grid */}
      {userCollections.length === 0 ? (
        <Card className="p-12">
          <div className="text-secondary-500 text-center">
            <FolderOpen className="text-secondary-300 mx-auto mb-3 h-12 w-12" />
            <p className="mb-4">아직 생성된 컬렉션이 없습니다</p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />첫 컬렉션 만들기
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userCollections.map((collection) => {
            const contents = getCollectionContents(collection.id)
            const thumbnails = contents.slice(0, 4)

            return (
              <Card key={collection.id} className="overflow-hidden">
                {/* Thumbnail Grid */}
                <Link href={`/contents?collection=${collection.id}`}>
                  <div className="bg-secondary-100 aspect-[16/10] p-2">
                    {thumbnails.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <FileImage className="text-secondary-300 h-12 w-12" />
                      </div>
                    ) : thumbnails.length === 1 ? (
                      <Image
                        src={thumbnails[0].file_url}
                        alt=""
                        className="h-full w-full rounded object-cover"
                      />
                    ) : (
                      <div className="grid h-full grid-cols-2 gap-2">
                        {thumbnails.map((content, index) => (
                          <div key={index} className="relative overflow-hidden rounded">
                            <Image
                              fill
                              src={content.file_url}
                              alt=""
                              className="object-cover"
                              unoptimized
                              quality={10}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{collection.name}</h3>
                      <p className="text-secondary-500 mt-1 truncate text-sm">
                        {collection.description}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(collection)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(collection)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-secondary-500">{contents.length}개 항목</span>
                    <span className="text-secondary-400 text-xs">
                      {format(new Date(collection.created_at), 'yyyy.MM.dd', {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 컬렉션 만들기</DialogTitle>
            <DialogDescription>콘텐츠를 그룹으로 관리하기 위한 컬렉션을 만드세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-name">이름 *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="컬렉션 이름"
              />
            </div>
            <div>
              <Label htmlFor="create-description">설명</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="컬렉션 설명 (선택사항)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setFormData({ name: '', description: '' })
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>컬렉션 수정</DialogTitle>
            <DialogDescription>컬렉션 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">이름 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="컬렉션 이름"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="컬렉션 설명 (선택사항)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setSelectedCollection(null)
                setFormData({ name: '', description: '' })
              }}
            >
              취소
            </Button>
            <Button onClick={handleEdit}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="컬렉션 삭제"
        description={
          selectedCollection ? `${selectedCollection.name} 컬렉션을 삭제하시겠습니까?` : ''
        }
        confirmText="삭제"
        isDestructive
      />
    </div>
  )
}
