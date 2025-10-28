'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { uploadContent } from '@/lib/api/contents'
import { Collection } from '@/types'
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common'

interface FileWithPreview extends File {
  preview: string
}

interface UploadItem {
  file: FileWithPreview
  title: string
  collectionId: string | null
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCollectionId?: string | null
  collections?: Collection[] // 사용자의 컬렉션 목록
  onUploadComplete?: () => void
}

export function UploadModal({
  open,
  onOpenChange,
  defaultCollectionId = null,
  collections = [],
  onUploadComplete,
}: UploadModalProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const userCollections = collections

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newItems = acceptedFiles.map((file) => {
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        })

        return {
          file: fileWithPreview,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          collectionId: defaultCollectionId,
          status: 'pending' as const,
          progress: 0,
        }
      })

      setUploadItems((prev) => [...prev, ...newItems])
    },
    [defaultCollectionId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  const updateItem = (index: number, updates: Partial<UploadItem>) => {
    setUploadItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)))
  }

  const removeItem = (index: number) => {
    setUploadItems((prev) => {
      const newItems = [...prev]
      URL.revokeObjectURL(newItems[index].file.preview)
      newItems.splice(index, 1)
      return newItems
    })
  }

  const uploadFile = async (item: UploadItem, index: number) => {
    updateItem(index, { status: 'uploading', progress: 0 })

    try {
      // Upload using Supabase API
      const response = await uploadContent(
        {
          file: item.file,
          title: item.title,
          userId: user!.id,
          collectionId: item.collectionId,
        },
        (progress) => {
          updateItem(index, { progress })
        }
      )

      if (response.success) {
        updateItem(index, { status: 'success', progress: 100 })
      } else {
        updateItem(index, {
          status: 'error',
          error: response.error || '업로드 실패',
        })
      }
    } catch (error) {
      console.error('업로드 중 오류:', error)
      updateItem(index, {
        status: 'error',
        error: '업로드 중 오류가 발생했습니다',
      })
    }
  }

  const handleUploadAll = async () => {
    const pendingItems = uploadItems.filter(
      (item) => item.status === 'pending' || item.status === 'error'
    )

    if (pendingItems.length === 0) return

    // Validate all items
    const invalidItems = uploadItems.filter((item) => !item.title.trim())
    if (invalidItems.length > 0) {
      toast({
        title: '입력 오류',
        description: '모든 콘텐츠의 제목을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    // Upload all files
    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i]
      if (item.status === 'pending' || item.status === 'error') {
        await uploadFile(item, i)
      }
    }

    setIsUploading(false)

    const successCount = uploadItems.filter((item) => item.status === 'success').length

    toast({
      title: '업로드 완료',
      description: `${successCount}개의 콘텐츠가 업로드되었습니다`,
    })

    // Close modal and trigger refresh
    setTimeout(() => {
      onOpenChange(false)
      setUploadItems([])
      onUploadComplete?.()
    }, 1000)
  }

  const handleClearAll = () => {
    uploadItems.forEach((item) => URL.revokeObjectURL(item.file.preview))
    setUploadItems([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>콘텐츠 업로드</DialogTitle>
          <DialogDescription>JPG, PNG 파일을 업로드하세요 (최대 10MB)</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dropzone */}
          <Card className="p-8">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-secondary-300 hover:bg-secondary-50 hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="text-secondary-400 mx-auto mb-4 h-12 w-12" />
              {isDragActive ? (
                <p className="text-lg font-medium">파일을 여기에 놓으세요</p>
              ) : (
                <>
                  <p className="mb-2 text-lg font-medium">
                    파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p className="text-secondary-500 text-sm">
                    JPG, PNG 형식 • 최대 10MB • 여러 파일 가능
                  </p>
                </>
              )}
            </div>
          </Card>

          {/* Upload Items */}
          {uploadItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">업로드 목록 ({uploadItems.length})</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClearAll} disabled={isUploading}>
                    전체 삭제
                  </Button>
                  <Button onClick={handleUploadAll} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">업로드 중...</span>
                      </>
                    ) : (
                      '전체 업로드'
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {uploadItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="relative h-32 w-32 flex-shrink-0 bg-secondary rounded-xl">
                        <img
                          src={item.file.preview}
                          alt={item.title}
                          className="h-full w-full rounded object-contain"
                        />
                        {item.status === 'success' && (
                          <div className="bg-success/20 absolute inset-0 flex items-center justify-center rounded">
                            <CheckCircle2 className="text-success h-8 w-8" />
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="bg-error/20 absolute inset-0 flex items-center justify-center rounded">
                            <AlertCircle className="text-error h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Form */}
                      <div className="flex-1 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor={`title-${index}`}>제목 *</Label>
                            <Input
                              id={`title-${index}`}
                              value={item.title}
                              onChange={(e) => updateItem(index, { title: e.target.value })}
                              disabled={item.status === 'uploading' || item.status === 'success'}
                              placeholder="콘텐츠 제목"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`collection-${index}`}>컬렉션</Label>
                            <Select
                              value={item.collectionId || 'none'}
                              onValueChange={(value) =>
                                updateItem(index, {
                                  collectionId: value === 'none' ? null : value,
                                })
                              }
                              disabled={item.status === 'uploading' || item.status === 'success'}
                            >
                              <SelectTrigger id={`collection-${index}`}>
                                <SelectValue placeholder="선택 안함" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">선택 안함</SelectItem>
                                {userCollections.map((collection) => (
                                  <SelectItem key={collection.id} value={collection.id}>
                                    {collection.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`filename-${index}`}>원본 파일명</Label>
                          <Input
                            id={`filename-${index}`}
                            value={item.file.name}
                            disabled
                            className="bg-secondary-50"
                          />
                        </div>

                        {/* Progress */}
                        {item.status === 'uploading' && (
                          <div className="space-y-2">
                            <div className="bg-secondary-200 h-2 overflow-hidden rounded-full">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <p className="text-secondary-500 text-sm">
                              업로드 중... {item.progress}%
                            </p>
                          </div>
                        )}

                        {/* Error */}
                        {item.status === 'error' && (
                          <p className="text-error text-sm">{item.error}</p>
                        )}

                        {/* Success */}
                        {item.status === 'success' && (
                          <p className="text-success text-sm">업로드 완료!</p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={item.status === 'uploading'}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
