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
import { Content, DetectedContent, getAnalysisStatus } from '@/types'
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
import { PageContainer } from '@/components/layout'

// Supabase Storage URL 생성 헬퍼 함수 (Mock 환경에서는 Unsplash 사용)
function getFileUrl(filePath: string): string {
  const imageMap: Record<string, string> = {
    'jeju_seongsan': 'photo-1519681393784-d120267933ba',
    'busan_haeundae': 'photo-1506905925346-21bda4d32df4',
    'gyeongju_bulguksa': 'photo-1478436127897-769e1b3f0f36',
    'paris_eiffel': 'photo-1502602898657-3e91760cbb34',
    'london_bigben': 'photo-1513635269975-59663e0ac1ad',
    'newyork_liberty': 'photo-1485871981521-5b1fd3805eee',
    'promo_banner': 'photo-1558655146-d09347e92766',
    'launch_poster': 'photo-1561070791-2526d30994b5',
    'sns_ad': 'photo-1572635196237-14b3f281503f',
    'laptop_product': 'photo-1496181133206-80ce9b88a853',
    'smartphone_white': 'photo-1511707171634-5f897ff02aa9',
    'wireless_earbuds': 'photo-1590658268037-6bf12165a8df',
    'smartwatch_black': 'photo-1523275335684-37898b6baf30',
    'random_test': 'photo-1501594907352-04cda38ebc29',
    'error_test': 'photo-1469854523086-cc02fe5d8800',
    'branding_design_a': 'photo-1558655146-d09347e92766',
    'poster_design': 'photo-1561070791-2526d30994b5',
    'anniversary_event': 'photo-1511795409834-ef04bbd61622',
    'product_launch': 'photo-1505373877841-8d25f7d46678',
    'workshop_group': 'photo-1511578314322-379afb476865',
  }

  const fileKey = filePath.split('/')[1]?.split('_').slice(1).join('_').replace('.jpg', '').replace('.png', '') || ''
  const imageId = imageMap[fileKey] || 'photo-1501594907352-04cda38ebc29'
  return `https://images.unsplash.com/${imageId}`
}

// 파일 크기 계산 헬퍼 함수 (Mock 환경)
function getFileSize(filePath: string): number {
  return Math.floor(Math.random() * 2097152) + 1048576
}

// 분석 상태 색상 헬퍼 함수
function getStatusColor(content: Content): string {
  const status = getAnalysisStatus(content)
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

// 분석 상태 텍스트 헬퍼 함수
function getStatusText(content: Content): string {
  const status = getAnalysisStatus(content)
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

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState<Content | null>(null)
  const [detectedContents, setDetectedContents] = useState<DetectedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 분석 결과 파생
  const analysisResult = content
    ? {
        labels:
          content.label_data &&
          typeof content.label_data === 'object' &&
          'responses' in content.label_data &&
          Array.isArray(content.label_data.responses) &&
          content.label_data.responses.length > 0 &&
          'labelAnnotations' in content.label_data.responses[0]
            ? (content.label_data.responses[0].labelAnnotations as Array<{
                description: string
                score: number
              }>)
            : [],
        texts:
          content.text_data &&
          typeof content.text_data === 'object' &&
          'responses' in content.text_data &&
          Array.isArray(content.text_data.responses) &&
          content.text_data.responses.length > 0 &&
          'textAnnotations' in content.text_data.responses[0]
            ? (content.text_data.responses[0].textAnnotations as Array<{
                description: string
              }>)
            : [],
        full_matching_images: detectedContents.filter((d) => d.detection_type === 'full'),
        partial_matching_images: detectedContents.filter((d) => d.detection_type === 'partial'),
        similar_images: detectedContents.filter((d) => d.detection_type === 'similar'),
      }
    : null

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

      // Load detected contents if analysis is completed
      if (contentResponse.data && getAnalysisStatus(contentResponse.data) === 'completed') {
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
    <PageContainer maxWidth="7xl">
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
                src={getFileUrl(content.file_path)}
                alt={content.file_name}
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
                  <h2 className="text-2xl font-bold">{content.file_name}</h2>
                  <p className="text-secondary-500 mt-2">{content.message || ""}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">업로드 날짜</p>
                      <p className="font-medium">
                        {format(new Date(content.created_at), 'yyyy년 MM월 dd일', {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileType className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">파일 형식</p>
                      <p className="font-medium uppercase">{content.file_name.split(".").pop()?.toUpperCase() || ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HardDrive className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">파일 크기</p>
                      <p className="font-medium">
                        {(getFileSize(content.file_path) / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tag className="text-secondary-400 h-5 w-5" />
                    <div>
                      <p className="text-secondary-500 text-sm">분석 상태</p>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(content)}
                      >
                        {getStatusText(content)}
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
                              <p className="text-sm">{text.description}</p>
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
                                  href={detection.source_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <span className="truncate">{detection.source_url || '출처 URL 없음'}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                                <p className="text-secondary-500 mt-1 text-sm">
                                  유형:{' '}
                                  {detection.detection_type === 'full'
                                    ? '완전 일치'
                                    : detection.detection_type === 'partial'
                                      ? '부분 일치'
                                      : '유사'}
                                </p>
                                <p className="text-secondary-400 mt-1 text-xs">
                                  발견일:{' '}
                                  {format(new Date(detection.created_at), 'yyyy.MM.dd', {
                                    locale: ko,
                                  })}
                                </p>
                              </div>
                              <Select
                                value={detection.admin_review_status}
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
                <p className="text-error text-3xl font-bold">{detectedContents.length}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-secondary-500 mb-2 text-sm">검토 현황</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>검토 중</span>
                    <span className="font-medium">
                      {detectedContents.filter((d) => d.admin_review_status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>일치</span>
                    <span className="text-error font-medium">
                      {detectedContents.filter((d) => d.admin_review_status === 'match').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>불일치</span>
                    <span className="text-success font-medium">
                      {detectedContents.filter((d) => d.admin_review_status === 'no_match').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>불명확</span>
                    <span className="text-warning font-medium">
                      {detectedContents.filter((d) => d.admin_review_status === 'cannot_compare').length}
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
        src={getFileUrl(content.file_path)}
        alt={content.file_name}
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
    </PageContainer>
  )
}
