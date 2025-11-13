'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Settings,
  FileImage,
  ExternalLink,
  AlertCircle,
  SearchIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { getContentDetail, deleteContent } from '@/lib/api/contents'
import { getDetections } from '@/lib/api/detections'
import { ContentDetail, DetectedContent } from '@/types'
import { AnalysisStatusModal } from '@/components/admin/contents/AnalysisStatusModal'
import { ReviewStatusModal } from '@/components/admin/contents/ReviewStatusModal'
import { AIAnalysisRequestModal } from '@/components/admin/contents/AIAnalysisRequestModal'
import { RedetectionModal } from '@/components/admin/contents/RedetectionModal'
import { DetectionTable } from '@/components/admin/contents/DetectionTable'
import { LoadingSpinner, ConfirmDialog } from '@/components/common'

export default function AdminContentDetailPage() {
  useAdminTitle('콘텐츠 상세')
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contentId = params.id as string

  const [content, setContent] = useState<ContentDetail | null>(null)
  const [detections, setDetections] = useState<DetectedContent[]>([])
  const [selectedDetection, setSelectedDetection] = useState<DetectedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // 발견 이미지 카드로 스크롤하기 위한 ref
  const detectedImageCardRef = useRef<HTMLDivElement>(null)

  // 모달 상태
  const [analysisStatusModalOpen, setAnalysisStatusModalOpen] = useState(false)
  const [reviewStatusModalOpen, setReviewStatusModalOpen] = useState(false)
  const [aiAnalysisModalOpen, setAIAnalysisModalOpen] = useState(false)
  const [redetectionModalOpen, setRedetectionModalOpen] = useState(false)
  const [redetectType, setRedetectType] = useState<'label' | 'text'>('label')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  // selectedDetection 변경 시 이미지 에러 상태 초기화
  useEffect(() => {
    setImageError(false)
  }, [selectedDetection])

  // detection_type별로 그룹화하여 순회용 배열 생성
  const orderedDetections = useMemo(() => {
    const full = detections.filter((d) => d.detection_type === 'full')
    const partial = detections.filter((d) => d.detection_type === 'partial')
    const similar = detections.filter((d) => d.detection_type === 'similar')
    return [...full, ...partial, ...similar]
  }, [detections])

  // 비교 버튼 클릭 시 발견 이미지로 스크롤
  const handleDetectionClick = useCallback((detection: DetectedContent) => {
    setSelectedDetection(detection)

    // 약간의 지연 후 스크롤
    detectedImageCardRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [])

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

  const fetchData = async () => {
    setIsLoading(true)

    try {
      // 콘텐츠 상세 조회 (API 함수 사용)
      const contentResult = await getContentDetail(contentId)
      if (!contentResult.success || !contentResult.data) {
        throw new Error(contentResult.error || '콘텐츠를 찾을 수 없습니다.')
      }
      setContent(contentResult.data)

      // 탐지 결과 조회 (API 함수 사용)
      const detectionsResult = await getDetections(contentId)
      if (!detectionsResult.success) {
        throw new Error(detectionsResult.error || '탐지 결과를 불러올 수 없습니다.')
      }
      setDetections(detectionsResult.data || [])
    } catch (error) {
      console.error('데이터 조회 에러:', error)

      toast({
        title: '데이터 조회 실패',
        description: '콘텐츠 데이터를 불러올 수 없습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 검토 완료 후 백그라운드 업데이트 (로딩 없이)
  const handleReviewUpdate = useCallback(async () => {
    try {
      // 백그라운드에서 데이터 새로고침 (isLoading 상태 변경 없음)
      const contentResult = await getContentDetail(contentId)
      if (contentResult.success && contentResult.data) {
        setContent(contentResult.data)
      }

      const detectionsResult = await getDetections(contentId)
      if (detectionsResult.success) {
        const newDetections = detectionsResult.data || []
        setDetections(newDetections)

        // selectedDetection도 업데이트하여 UI 즉시 반영
        if (selectedDetection) {
          const updatedDetection = newDetections.find((d) => d.id === selectedDetection.id)
          if (updatedDetection) {
            setSelectedDetection(updatedDetection)
          }
        }
      }

      toast({
        title: '검토 완료',
        description: '검토 상태가 업데이트되었습니다.',
      })
    } catch {
      router.refresh()
    }
  }, [contentId, toast, selectedDetection, router])

  const handleDelete = async () => {
    if (!content) return

    setIsDeleting(true)
    const response = await deleteContent(contentId)

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

  const handleDownloadOriginalImage = async () => {
    try {
      const response = await fetch(content!.file_path)
      if (!response.ok) {
        throw new Error('이미지를 가져올 수 없습니다')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = content!.file_name
      document.body.appendChild(a)
      a.click()

      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('이미지 다운로드 에러:', error)
      toast({
        title: '다운로드 실패',
        description: '이미지를 다운로드할 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  // file_path는 이미 Supabase public URL이므로 그대로 사용

  const getAnalysisStatusBadge = (isAnalyzed: boolean | null) => {
    if (isAnalyzed === true) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">분석 완료</Badge>
    } else if (isAnalyzed === null) {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기 중</Badge>
    } else {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">분석 중</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner className="text-gray-400" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">콘텐츠를 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          콘텐츠 목록으로
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-2 text-error hover:text-error"
        >
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
                <p className="truncate text-base font-semibold text-gray-900">
                  {content.file_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">업로더명</p>
                <p className="text-base text-gray-900">{content.user_name || '-'}</p>
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
                <div className="mt-1 flex items-center gap-2">
                  {getAnalysisStatusBadge(content.is_analyzed)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalysisStatusModalOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">추가 메시지</p>
                <p className="truncate text-base text-gray-900">{content.message || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 원본 이미지 / 발견 이미지 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 원본 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <span>원본 이미지</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleDownloadOriginalImage}
                >
                  <Download className="h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-100">
              <Image
                src={content.file_path}
                alt={content.file_name}
                fill
                className="object-contain"
              />
            </div>
            {/* <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                다운로드
              </Button>
            </div> */}
          </CardContent>
        </Card>

        {/* 발견 이미지 */}
        <Card ref={detectedImageCardRef}>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <span>발견 이미지</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewStatusModalOpen(true)}
                  disabled={!selectedDetection}
                >
                  <SearchIcon className="h-4 w-4" />
                  {selectedDetection === null
                    ? '검토'
                    : selectedDetection.admin_review_status === 'pending'
                      ? '검토'
                      : '검토 수정'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-50">
              {selectedDetection ? (
                !imageError ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                      referrerPolicy="no-referrer"
                      src={selectedDetection.image_url}
                      alt="발견된 이미지"
                      fill
                      className="object-contain"
                      unoptimized
                      onError={() => setImageError(true)}
                    />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="font-medium">이미지를 출력할 수 없습니다</p>
                      <p className="mt-1 text-sm">직접 링크에 접속하여 확인하세요</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() =>
                            window.open(
                              selectedDetection.image_url,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          원본 이미지 링크
                        </Button>
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleNavigateDetection('next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            {/* <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewStatusModalOpen(true)}
                disabled={!selectedDetection}
              >
                {selectedDetection === null
                  ? '검토'
                  : selectedDetection.admin_review_status === 'pending'
                    ? '검토'
                    : '검토 수정'}
              </Button>
            </div> */}
          </CardContent>
        </Card>
      </div>

      {/* 이미지 검출 결과 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>이미지 검출 결과 ({detections.length}건)</CardTitle>
          <Button onClick={() => setAIAnalysisModalOpen(true)} variant="outline" size="sm">
            {content.is_analyzed === null ? 'AI 분석 요청' : 'AI 분석 추가 요청'}
          </Button>
        </CardHeader>
        <CardContent>
          {detections.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">검출된 이미지가 없습니다.</p>
          ) : (
            <DetectionTable
              detections={detections}
              selectedDetection={selectedDetection}
              onDetectionClick={handleDetectionClick}
            />
          )}
        </CardContent>
      </Card>

      {/* 라벨/텍스트 검출 결과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 라벨 검출 결과 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>라벨 검출 결과 ({content.label_data?.labels?.length || 0}개)</CardTitle>
            {content.is_analyzed !== null && !content.is_analyzed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRedetectType('label')
                  setRedetectionModalOpen(true)
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>텍스트 검출 결과 ({content.text_data?.words?.length || 0}개)</CardTitle>
            {content.is_analyzed !== null && !content.is_analyzed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRedetectType('text')
                  setRedetectionModalOpen(true)
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
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

      {/* 모달들 */}
      <AnalysisStatusModal
        isOpen={analysisStatusModalOpen}
        onClose={() => setAnalysisStatusModalOpen(false)}
        contentId={contentId}
        currentStatus={content.is_analyzed}
        currentMessage={content.message}
        onUpdate={fetchData}
      />

      {selectedDetection && (
        <ReviewStatusModal
          isOpen={reviewStatusModalOpen}
          onClose={() => setReviewStatusModalOpen(false)}
          detectionId={selectedDetection.id}
          currentStatus={selectedDetection.admin_review_status}
          onUpdate={handleReviewUpdate}
        />
      )}

      <AIAnalysisRequestModal
        isOpen={aiAnalysisModalOpen}
        onClose={() => setAIAnalysisModalOpen(false)}
        contentId={contentId}
        isFirstRequest={content.is_analyzed === null}
        onSuccess={fetchData}
      />

      <RedetectionModal
        isOpen={redetectionModalOpen}
        onClose={() => setRedetectionModalOpen(false)}
        contentId={contentId}
        featureType={redetectType}
        onSuccess={fetchData}
      />

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
    </div>
  )
}
