'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockContentsApi } from '@/lib/api/mock'
import { Content, DetectedContent, getAnalysisStatus } from '@/types'
import {
  ArrowLeft,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileImage,
} from 'lucide-react'
import { ImageViewer, ConfirmDialog } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
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


export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState<Content | null>(null)
  const [detectedContents, setDetectedContents] = useState<DetectedContent[]>([])
  const [selectedDetection, setSelectedDetection] = useState<DetectedContent | null>(null)
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

  const handleDetectionClick = (detection: DetectedContent) => {
    setSelectedDetection(detection)
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

  // 발견내역 그룹화
  const groupedDetections = {
    full: detectedContents.filter((d) => d.detection_type === 'full'),
    partial: detectedContents.filter((d) => d.detection_type === 'partial'),
    similar: detectedContents.filter((d) => d.detection_type === 'similar'),
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 왼쪽 절반: 원본 이미지 + 분석결과 */}
        <div className="space-y-6">
          {/* 원본 이미지 */}
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

          {/* 분석결과 통합 */}
          <Card className="p-6">
            {/* 파일명 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{content.file_name}</h2>
              {content.message && (
                <p className="text-secondary-500 mt-2">{content.message}</p>
              )}
            </div>

            {/* 분석결과 */}
            <div className="space-y-4">
              {analysisResult ? (
                <>
                  {/* 감지된 레이블 */}
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

                  {/* 감지된 텍스트 */}
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

                  {/* 발견 통계 */}
                  <div>
                    <h3 className="mb-3 font-semibold">발견 통계</h3>
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
                  </div>
                </>
              ) : (
                <div className="text-secondary-500 py-12 text-center">
                  <AlertCircle className="text-secondary-300 mx-auto mb-3 h-12 w-12" />
                  <p>분석 결과가 아직 없습니다</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 오른쪽 절반: 감지 이미지 + 발견내역 */}
        <div className="space-y-6">
          {/* 감지 이미지 */}
          <Card className="overflow-hidden">
            <div className="bg-secondary-100 relative aspect-video flex items-center justify-center">
              {selectedDetection ? (
                <img
                  src={selectedDetection.image_url}
                  alt="감지된 이미지"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = getFileUrl(content.file_path)
                  }}
                />
              ) : (
                <div className="text-center text-secondary-400 p-8">
                  <FileImage className="mx-auto mb-3 h-12 w-12" />
                  <p className="font-medium">선택된 이미지가 없습니다</p>
                  <p className="text-sm mt-1">발견내역을 클릭하여 이미지를 확인하세요</p>
                </div>
              )}
            </div>
          </Card>

          {/* 발견내역 탭 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">발견 내역</h3>

            {detectedContents.length > 0 ? (
              <Tabs defaultValue="full" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="full"
                    className="data-[state=active]:text-error data-[state=active]:bg-error/10"
                  >
                    일치 ({groupedDetections.full.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="partial"
                    className="data-[state=active]:text-warning data-[state=active]:bg-warning/10"
                  >
                    부분 일치 ({groupedDetections.partial.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="similar"
                    className="data-[state=active]:text-primary data-[state=active]:bg-primary/10"
                  >
                    유사 ({groupedDetections.similar.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="full" className="mt-4">
                  {groupedDetections.full.length > 0 ? (
                    <div className="space-y-2">
                      {groupedDetections.full.map((detection) => (
                        <button
                          key={detection.id}
                          onClick={() => handleDetectionClick(detection)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedDetection?.id === detection.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="bg-secondary-100 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded">
                              <FileImage className="text-secondary-400 h-8 w-8" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {detection.page_title || '제목 없음'}
                              </p>
                              <a
                                href={detection.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">{detection.source_url || '출처 정보 없음'}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-center py-8">일치하는 발견내역이 없습니다</p>
                  )}
                </TabsContent>

                <TabsContent value="partial" className="mt-4">
                  {groupedDetections.partial.length > 0 ? (
                    <div className="space-y-2">
                      {groupedDetections.partial.map((detection) => (
                        <button
                          key={detection.id}
                          onClick={() => handleDetectionClick(detection)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedDetection?.id === detection.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="bg-secondary-100 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded">
                              <FileImage className="text-secondary-400 h-8 w-8" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {detection.page_title || '제목 없음'}
                              </p>
                              <a
                                href={detection.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">{detection.source_url || '출처 정보 없음'}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-center py-8">부분일치하는 발견내역이 없습니다</p>
                  )}
                </TabsContent>

                <TabsContent value="similar" className="mt-4">
                  {groupedDetections.similar.length > 0 ? (
                    <div className="space-y-2">
                      {groupedDetections.similar.map((detection) => (
                        <button
                          key={detection.id}
                          onClick={() => handleDetectionClick(detection)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedDetection?.id === detection.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="bg-secondary-100 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded">
                              <FileImage className="text-secondary-400 h-8 w-8" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {detection.page_title || '제목 없음'}
                              </p>
                              <a
                                href={detection.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">{detection.source_url || '출처 정보 없음'}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-center py-8">유사한 발견내역이 없습니다</p>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-secondary-500 py-12 text-center">
                <CheckCircle2 className="text-success mx-auto mb-3 h-12 w-12" />
                <p>발견된 침해 콘텐츠가 없습니다</p>
              </div>
            )}
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
