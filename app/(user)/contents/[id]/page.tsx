'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getContentDetail, deleteContent } from '@/lib/api/contents'
import { getDetections } from '@/lib/api/detections'
import { ContentDetail, DetectedContent, getAnalysisStatus } from '@/types'
import { DetectionTable } from '@/components/admin/contents/DetectionTable'
import {
  ArrowLeft,
  Trash2,
  AlertCircle,
  ExternalLink,
  FileImage,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ConfirmDialog, MessageViewModal } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { PageContainer } from '@/components/layout'

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [detectedContents, setDetectedContents] = useState<DetectedContent[]>([])
  const [selectedDetection, setSelectedDetection] = useState<DetectedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)

  // selectedDetection 변경 시 이미지 에러 상태 초기화
  useEffect(() => {
    setImageError(false)
  }, [selectedDetection])

  useEffect(() => {
    const loadContent = async () => {
      const contentId = params.id as string

      // Load content
      const contentResponse = await getContentDetail(contentId)
      if (!contentResponse.success) {
        toast({
          title: '오류',
          description: contentResponse.error || '콘텐츠를 불러올 수 없습니다',
          variant: 'destructive',
        })
        router.push('/contents')
        return
      }

      setContent(contentResponse.data)

      // Load detected contents if analysis is completed
      if (contentResponse.data && getAnalysisStatus(contentResponse.data) === 'completed') {
        const detectedResponse = await getDetections(contentId)
        if (detectedResponse.success) {
          // 관리자가 '일치'로 리뷰한 콘텐츠만 필터링
          const matchedContents = (detectedResponse.data || []).filter(
            (d) => d.admin_review_status === 'match'
          )
          setDetectedContents(matchedContents)
        }
      }

      setIsLoading(false)
    }

    loadContent()
  }, [params.id, router, toast])

  const handleDelete = async () => {
    if (!content) return

    setIsDeleting(true)
    const response = await deleteContent(content.id)

    if (response.success) {
      toast({
        title: '삭제 완료',
        description: '콘텐츠가 삭제되었습니다',
      })
      router.back()
    } else {
      toast({
        title: '삭제 실패',
        description: response.error || '콘텐츠를 삭제할 수 없습니다',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  // detection_type별로 그룹화하여 순회용 배열 생성
  const orderedDetections = useMemo(() => {
    const full = detectedContents.filter((d) => d.detection_type === 'full')
    const partial = detectedContents.filter((d) => d.detection_type === 'partial')
    const similar = detectedContents.filter((d) => d.detection_type === 'similar')
    return [...full, ...partial, ...similar]
  }, [detectedContents])

  const handleDetectionClick = (detection: DetectedContent) => {
    setSelectedDetection(detection)
  }

  // 이전/다음 detection으로 순회
  const handleNavigateDetection = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedDetection || orderedDetections.length <= 1) return

      const currentIndex = orderedDetections.findIndex((d) => d.id === selectedDetection.id)
      if (currentIndex === -1) return

      let newIndex
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % orderedDetections.length
      } else {
        newIndex = (currentIndex - 1 + orderedDetections.length) % orderedDetections.length
      }

      setSelectedDetection(orderedDetections[newIndex])
    },
    [selectedDetection, orderedDetections]
  )

  if (isLoading) {
    return (
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-20" />
          </div>

          {/* 파일 정보 Skeleton */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 이미지 카드 Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* 왼쪽 컬럼: 원본 이미지 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 컬럼: 발견 이미지 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!content) {
    return null
  }

  return (
    <PageContainer maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="gap-2 text-error hover:text-error">
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>

      {/* 파일 정보 */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 좌측 카드 - 파일 정보 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">파일명</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="truncate text-base font-semibold text-gray-900 cursor-default">
                        {content.file_name}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{content.file_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">업로드 날짜</p>
                <p className="text-base text-gray-900">
                  {format(new Date(content.created_at), 'PPP HH:mm', { locale: ko })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 우측 카드 - 분석 정보 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">분석 상태</p>
                <div className="mt-1">
                  {content.is_analyzed === true ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      분석 완료
                    </Badge>
                  ) : content.is_analyzed === null ? (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                      대기 중
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      분석 중
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">관리자 메시지</p>
                {content.message ? (
                  <p
                    className="truncate text-base text-gray-900 cursor-pointer"
                    onClick={() => setShowMessageModal(true)}
                    title="클릭하여 전체 메시지 보기"
                  >
                    {content.message}
                  </p>
                ) : (
                  <p className="text-base text-gray-900">-</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 왼쪽 절반: 원본 이미지 + 라벨/텍스트 검출 결과 */}
        <div className="space-y-6">
          {/* 원본 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>원본 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-100"
              >
                <Image
                  src={content.file_path}
                  alt={content.file_name}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </CardContent>
          </Card>

          {/* 라벨 검출 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>라벨 검출 결과 ({content.label_data?.labels?.length || 0}개)</CardTitle>
            </CardHeader>
            <CardContent>
              {content.label_data?.labels && content.label_data.labels.length > 0 ? (
                <div className="space-y-2">
                  {content.label_data.labels.map((label, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="font-medium">{label.description}</span>
                      <Badge variant="outline">{(label.score * 100).toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">검출된 라벨이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 텍스트 검출 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>텍스트 검출 결과 ({content.text_data?.words?.length || 0}개)</CardTitle>
            </CardHeader>
            <CardContent>
              {content.text_data?.words && content.text_data.words.length > 0 ? (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {content.text_data.words.map((word, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded border bg-white px-2 py-1 text-sm text-gray-900"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">검출된 텍스트가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 절반: 발견 이미지 + 이미지 검출 결과 */}
        <div className="space-y-6">
          {/* 발견 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>발견 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-50">
                {selectedDetection ? (
                  !imageError ? (
                    <Image
                      referrerPolicy="no-referrer"
                      src={selectedDetection.image_url}
                      alt="발견된 이미지"
                      fill
                      className="object-contain"
                      unoptimized
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                      <div>
                        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="font-medium">이미지를 출력할 수 없습니다</p>
                        <p className="mt-1 text-sm">직접 링크에 접속하여 확인하세요</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => window.open(selectedDetection.source_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          페이지 방문
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <FileImage className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="font-medium">선택된 이미지가 없습니다</p>
                      <p className="mt-1 text-sm">발견내역을 클릭하여 이미지를 확인하세요</p>
                    </div>
                  </div>
                )}

                {/* 이미지 순회 화살표 버튼 (호버 시 표시) */}
                {selectedDetection && orderedDetections.length > 1 && (
                  <>
                    <button
                      onClick={() => handleNavigateDetection('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleNavigateDetection('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                      aria-label="다음 이미지"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 이미지 검출 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>이미지 검출 결과 ({detectedContents.length}건)</CardTitle>
            </CardHeader>
            <CardContent>
              {detectedContents.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">검출된 이미지가 없습니다.</p>
              ) : (
                <DetectionTable
                  detections={detectedContents}
                  selectedDetection={selectedDetection}
                  onDetectionClick={handleDetectionClick}
                  variant="user"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="콘텐츠 삭제"
        description="이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        isDestructive
        isLoading={isDeleting}
      />

      {/* Message View Modal */}
      <MessageViewModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        message={content.message}
      />
      </div>
    </PageContainer>
  )
}
