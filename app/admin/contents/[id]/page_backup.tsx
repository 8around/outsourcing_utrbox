'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockContents, mockDetectedContents, getPlaceholderImageUrl } from '@/lib/admin/mock-data'
import { ArrowLeft, Download, RefreshCw, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

export default function AdminContentDetailPage() {
  useAdminTitle('콘텐츠 상세')
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contentId = params.id as string

  // Mock 콘텐츠 찾기
  const content = mockContents.find((c) => c.id === contentId)

  if (!content) {
    return (
      <div className="flex h-96 items-center justify-center">
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

  // 해당 콘텐츠의 발견 내역 찾기
  const detections = mockDetectedContents.filter((d) => d.content_id === contentId)

  const handleReanalyze = () => {
    // Mock 재분석 - 실제로는 API 호출
    console.log('Reanalyze content:', contentId)
    toast({
      title: 'AI 재분석 시작',
      description: '콘텐츠 AI 재분석을 시작했습니다.',
    })
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

  const getAnalysisStatusBadge = (isAnalyzed: boolean | null, message?: string) => {
    if (isAnalyzed === true) {
      return (
        <Badge className="truncate bg-green-100 text-green-700 hover:bg-green-100">
          완료
        </Badge>
      )
    } else if (isAnalyzed === null) {
      return (
        <Badge className="truncate bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          대기
        </Badge>
      )
    } else {
      return (
        <Badge className="truncate bg-blue-100 text-blue-700 hover:bg-blue-100">
          분석 중
        </Badge>
      )
    }
  }

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기</Badge>
      case 'match':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
            일치
          </Badge>
        )
      case 'no_match':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">불일치</Badge>
      case 'cannot_compare':
        return <Badge variant="secondary">비교 불가</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
        {/* 뒤로 가기 버튼 */}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          콘텐츠 목록으로
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 원본 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>원본 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
                <Image
                  src={getPlaceholderImageUrl(800, 600, content.id)}
                  alt={content.file_name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 메타데이터 */}
          <Card>
            <CardHeader>
              <CardTitle>메타데이터</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">파일명</p>
                <p className="text-base font-semibold text-gray-900">{content.file_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">업로더</p>
                <p className="text-base text-gray-900">{content.user_name || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">컬렉션</p>
                <p className="text-base text-gray-900">{content.collection_name || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">업로드일</p>
                <p className="text-base text-gray-900">
                  {format(new Date(content.created_at), 'PPP p', { locale: ko })}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">분석 상태</p>
                <div className="mt-1">
                  {getAnalysisStatusBadge(content.is_analyzed, content.message || undefined)}
                </div>
              </div>

              {content.is_analyzed !== true && (
                <Button onClick={handleReanalyze} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  AI 분석 {content.is_analyzed === null ? '실행' : '재실행'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI 분석 결과 */}
        {content.is_analyzed === true && (content.label_data || content.text_data) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LABEL_DETECTION 결과 */}
            {content.label_data && (
              <Card>
                <CardHeader>
                  <CardTitle>레이블 검출 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(
                      content.label_data as { labels?: { description: string; score: number }[] }
                    )?.labels?.map((label, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <span className="font-medium">{label.description}</span>
                        <Badge variant="outline">{(label.score * 100).toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TEXT_DETECTION 결과 */}
            {content.text_data && (
              <Card>
                <CardHeader>
                  <CardTitle>텍스트 검출 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-sm text-gray-900">
                      {(content.text_data as { text?: string })?.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 발견된 유사 콘텐츠 */}
        <Card>
          <CardHeader>
            <CardTitle>발견된 유사 콘텐츠 ({detections.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            {detections.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                발견된 유사 콘텐츠가 없습니다.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발견 이미지</TableHead>
                    <TableHead>페이지 제목</TableHead>
                    <TableHead>검출 유형</TableHead>
                    <TableHead>검토 상태</TableHead>
                    <TableHead>발견일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detections.map((detection) => (
                    <TableRow key={detection.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 overflow-hidden rounded border">
                          <Image
                            src={getPlaceholderImageUrl(100, 100, detection.id)}
                            alt="Detected"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{detection.page_title || '(제목 없음)'}</p>
                          {detection.source_url && (
                            <p className="max-w-xs truncate text-xs text-gray-500">
                              {detection.source_url}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getDetectionTypeBadge(detection.detection_type)}</TableCell>
                      <TableCell>{getReviewStatusBadge(detection.admin_review_status)}</TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(detection.created_at), 'PPP', { locale: ko })}
                      </TableCell>
                      <TableCell className="text-right">
                        {detection.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(detection.source_url!, '_blank')}
                            className="gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            방문
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
