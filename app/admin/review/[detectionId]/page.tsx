'use client'

import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { ImageCompareViewer } from '@/components/admin/review/ImageCompareViewer'
import { ReviewPanel } from '@/components/admin/review/ReviewPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockDetectedContents, getPlaceholderImageUrl } from '@/lib/admin/mock-data'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

export default function AdminReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const detectionId = params.detectionId as string

  // Mock 발견 콘텐츠 찾기
  const detection = mockDetectedContents.find((d) => d.id === detectionId)

  if (!detection) {
    return (
      <AdminLayout title="비교 검토">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">검토 항목을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const handleReview = (status: 'match' | 'no_match' | 'cannot_compare', memo?: string) => {
    // Mock 판정 저장 - 실제로는 Supabase API 호출
    console.log('Review:', { detectionId, status, memo })

    const statusText = status === 'match' ? '일치' : status === 'no_match' ? '불일치' : '비교 불가'

    toast({
      title: '판정 완료',
      description: `검토 결과를 "${statusText}"로 저장했습니다.`,
    })

    // 검토 목록으로 돌아가기
    router.push('/admin/review')
  }

  const getDetectionTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
            완전 일치
          </Badge>
        )
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">부분 일치</Badge>
        )
      case 'similar':
        return <Badge variant="secondary">시각적 유사</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <AdminLayout title="비교 검토">
      <div className="space-y-6">
        {/* 뒤로 가기 버튼 */}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          검토 목록으로
        </Button>

        {/* 메타데이터 */}
        <Card>
          <CardHeader>
            <CardTitle>발견 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-500">원본 파일명</p>
                <p className="text-base font-semibold text-gray-900">
                  {detection.original_file_name || '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">페이지 제목</p>
                <p className="text-base text-gray-900">{detection.page_title || '(제목 없음)'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">검출 유형</p>
                <div className="mt-1">{getDetectionTypeBadge(detection.detection_type)}</div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">발견일</p>
                <p className="text-base text-gray-900">
                  {format(new Date(detection.created_at), 'PPP', { locale: ko })}
                </p>
              </div>
            </div>

            {detection.source_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">소스 URL</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="flex-1 truncate text-base text-blue-600">{detection.source_url}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(detection.source_url!, '_blank')}
                    className="gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    방문
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이미지 비교 뷰어 */}
        <ImageCompareViewer
          originalImageUrl={getPlaceholderImageUrl(800, 600, 'original-' + detectionId)}
          detectedImageUrl={getPlaceholderImageUrl(800, 600, detectionId)}
        />

        {/* 판정 패널 */}
        <ReviewPanel onReview={handleReview} />
      </div>
    </AdminLayout>
  )
}
