'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockContentsApi } from '@/lib/api/mock'
import { Content, AnalysisResult, DetectedContent } from '@/types'
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  FileType,
  HardDrive,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  FileImage,
} from 'lucide-react'
import { LoadingSpinner, ImageViewer, ConfirmDialog } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState<Content | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [detectedContents, setDetectedContents] = useState<DetectedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadContent = async () => {
      const contentId = params.id as string

      // Load content
      const contentResponse = await mockContentsApi.getContent(contentId)
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

      // Load analysis result if completed
      if (contentResponse.data?.analysis_status === 'completed') {
        const analysisResponse = await mockContentsApi.getAnalysisResult(contentId)
        if (analysisResponse.success) {
          setAnalysisResult(analysisResponse.data)
        }

        // Load detected contents
        const detectedResponse = await mockContentsApi.getDetectedContents(contentId)
        if (detectedResponse.success) {
          setDetectedContents(detectedResponse.data || [])
        }
      }

      setIsLoading(false)
    }

    loadContent()
  }, [params.id, router, toast])

  const handleDelete = async () => {
    if (!content) return

    setIsDeleting(true)
    const response = await mockContentsApi.deleteContent(content.id)

    if (response.success) {
      toast({
        title: '삭제 완료',
        description: '콘텐츠가 삭제되었습니다',
      })
      router.push('/contents')
    } else {
      toast({
        title: '삭제 실패',
        description: response.error || '콘텐츠를 삭제할 수 없습니다',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  const handleReviewUpdate = async (detectionId: string, reviewStatus: string) => {
    const response = await mockContentsApi.updateDetectionReview(detectionId, {
      reviewStatus,
      reviewedBy: 'current-user',
    })

    if (response.success) {
      setDetectedContents((prev) => prev.map((d) => (d.id === detectionId ? response.data! : d)))
      toast({
        title: '검토 완료',
        description: '검토 상태가 업데이트되었습니다',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success'
      case 'analyzing':
        return 'bg-primary/10 text-primary'
      case 'pending':
        return 'bg-warning/10 text-warning'
      case 'failed':
        return 'bg-error/10 text-error'
      default:
        return 'bg-secondary-100 text-secondary-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '분석 완료'
      case 'analyzing':
        return '분석 중'
      case 'pending':
        return '대기 중'
      case 'failed':
        return '실패'
      default:
        return status
    }
  }

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-error/10 text-error'
      case 'false_positive':
        return 'bg-success/10 text-success'
      case 'pending':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-secondary-100 text-secondary-600'
    }
  }

  const getReviewStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '침해 확인'
      case 'false_positive':
        return '오탐'
      case 'pending':
        return '검토 중'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!content) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            다운로드
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image */}
          <Card className="overflow-hidden">
            <div
              className="bg-secondary-100 relative aspect-video cursor-pointer"
              onClick={() => setShowImageViewer(true)}
            >
              <img
                src={content.file_url}
                alt={content.title}
                className="h-full w-full object-contain"
              />
            </div>
          </Card>

          {/* Analysis Results */}
          <Card className="p-6">
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">정보</TabsTrigger>
                <TabsTrigger value="analysis">분석 결과</TabsTrigger>
                <TabsTrigger value="detections">발견 내역 ({detectedContents.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{content.title}</h2>
                  <p className="text-secondary-500 mt-2">{content.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">업로드 날짜</p>
                      <p className="font-medium">
                        {format(new Date(content.upload_date), 'yyyy년 MM월 dd일', {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileType className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">파일 형식</p>
                      <p className="font-medium uppercase">{content.file_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HardDrive className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">파일 크기</p>
                      <p className="font-medium">
                        {(content.file_size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tag className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">분석 상태</p>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(content.analysis_status)}
                      >
                        {getStatusText(content.analysis_status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-6 space-y-4">
                {analysisResult ? (
                  <>
                    {/* Labels */}
                    {analysisResult.labels.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-semibold">감지된 레이블</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.labels.map((label, index) => (
                            <Badge key={index} variant="secondary">
                              {label.description} ({(label.score * 100).toFixed(0)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Texts */}
                    {analysisResult.texts.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-semibold">감지된 텍스트</h3>
                        <div className="space-y-2">
                          {analysisResult.texts.map((text, index) => (
                            <Card key={index} className="p-3">
                              <p className="text-sm">{text}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Images Summary */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Card className="p-4">
                        <p className="text-secondary-500 text-sm">완전 일치</p>
                        <p className="mt-1 text-2xl font-bold">
                          {analysisResult.full_matching_images.length}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-secondary-500 text-sm">부분 일치</p>
                        <p className="mt-1 text-2xl font-bold">
                          {analysisResult.partial_matching_images.length}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-secondary-500 text-sm">유사 이미지</p>
                        <p className="mt-1 text-2xl font-bold">
                          {analysisResult.similar_images.length}
                        </p>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-secondary-500 py-12 text-center">
                    <AlertCircle className="text-secondary-300 mx-auto mb-3 h-12 w-12" />
                    <p>분석 결과가 아직 없습니다</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="detections" className="mt-6 space-y-4">
                {detectedContents.length > 0 ? (
                  <div className="space-y-4">
                    {detectedContents.map((detection) => (
                      <Card key={detection.id} className="p-4">
                        <div className="flex gap-4">
                          <div className="bg-secondary-100 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded">
                            <FileImage className="text-secondary-400 h-8 w-8" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <a
                                  href={detection.detected_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <span className="truncate">{detection.detected_url}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                                <p className="text-secondary-500 mt-1 text-sm">
                                  일치율: {(detection.similarity_score * 100).toFixed(1)}% •{' '}
                                  {detection.detection_type === 'full'
                                    ? '완전 일치'
                                    : detection.detection_type === 'partial'
                                      ? '부분 일치'
                                      : '유사'}
                                </p>
                                <p className="text-secondary-400 mt-1 text-xs">
                                  발견일:{' '}
                                  {format(new Date(detection.detected_at), 'yyyy.MM.dd', {
                                    locale: ko,
                                  })}
                                </p>
                              </div>
                              <Select
                                value={detection.review_status}
                                onValueChange={(value) => handleReviewUpdate(detection.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">검토 중</SelectItem>
                                  <SelectItem value="match">일치</SelectItem>
                                  <SelectItem value="no_match">불일치</SelectItem>
                                  <SelectItem value="unclear">불명확</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary-500 py-12 text-center">
                    <CheckCircle2 className="text-success mx-auto mb-3 h-12 w-12" />
                    <p>발견된 침해 콘텐츠가 없습니다</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">빠른 통계</h3>
            <div className="space-y-4">
              <div>
                <p className="text-secondary-500 text-sm">총 발견 건수</p>
                <p className="text-error text-3xl font-bold">{content.detection_count}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-secondary-500 mb-2 text-sm">검토 현황</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>검토 중</span>
                    <span className="font-medium">
                      {detectedContents.filter((d) => d.review_status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>일치</span>
                    <span className="text-error font-medium">
                      {detectedContents.filter((d) => d.review_status === 'match').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>불일치</span>
                    <span className="text-success font-medium">
                      {detectedContents.filter((d) => d.review_status === 'no_match').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>불명확</span>
                    <span className="text-warning font-medium">
                      {detectedContents.filter((d) => d.review_status === 'unclear').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">작업</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                원본 다운로드
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                보고서 다운로드
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        src={content.file_url}
        alt={content.title}
        open={showImageViewer}
        onClose={() => setShowImageViewer(false)}
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
