'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, RefreshCw, Settings, FileImage } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AnalysisStatusModal } from '@/components/admin/contents/AnalysisStatusModal'
import { ReviewStatusModal } from '@/components/admin/contents/ReviewStatusModal'
import { AIAnalysisRequestModal } from '@/components/admin/contents/AIAnalysisRequestModal'
import { RedetectionModal } from '@/components/admin/contents/RedetectionModal'
import { DetectionTable } from '@/components/admin/contents/DetectionTable'

type Content = {
  id: string
  file_name: string
  file_path: string
  is_analyzed: boolean | null
  message: string | null
  label_data: { labels?: { description: string; score: number }[] } | null
  text_data: { text?: string; words?: string[] } | null
  created_at: string
  user_name: string | null
  collection_name: string | null
}

type DetectedContent = {
  id: string
  content_id: string
  source_url: string | null
  image_url: string
  page_title: string | null
  detection_type: string
  admin_review_status: string | null
  created_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

export default function AdminContentDetailPage() {
  useAdminTitle('콘텐츠 상세')
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contentId = params.id as string

  const [content, setContent] = useState<Content | null>(null)
  const [detections, setDetections] = useState<DetectedContent[]>([])
  const [selectedDetection, setSelectedDetection] = useState<DetectedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 모달 상태
  const [analysisStatusModalOpen, setAnalysisStatusModalOpen] = useState(false)
  const [reviewStatusModalOpen, setReviewStatusModalOpen] = useState(false)
  const [aiAnalysisModalOpen, setAIAnalysisModalOpen] = useState(false)
  const [redetectionModalOpen, setRedetectionModalOpen] = useState(false)
  const [redetectType, setRedetectType] = useState<'label' | 'text'>('label')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    fetchData()
    fetchCurrentUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  const fetchCurrentUser = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (session) {
      setCurrentUserId(session.user.id)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)

    try {
      // contents 조회
      const { data: contentData, error: contentError } = await supabase
        .from('contents')
        .select(
          `
          id,
          file_name,
          file_path,
          is_analyzed,
          message,
          label_data,
          text_data,
          created_at,
          users!contents_user_id_fkey(name),
          collections(name)
        `
        )
        .eq('id', contentId)
        .single()

      if (contentError) throw contentError

      if (!contentData) {
        setContent(null)
        return
      }

      setContent({
        ...contentData,
        user_name: contentData.users && typeof contentData.users === 'object' && 'name' in contentData.users ? contentData.users.name : null,
        collection_name: contentData.collections && typeof contentData.collections === 'object' && 'name' in contentData.collections ? contentData.collections.name : null
      } as Content)

      // detected_contents 조회
      const { data: detectionsData, error: detectionsError } = await supabase
        .from('detected_contents')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false })

      if (detectionsError) throw detectionsError

      setDetections(detectionsData || [])
    } catch (error) {
      console.error('데이터 조회 에러:', error)
      toast({
        title: '데이터 조회 실패',
        description: '콘텐츠 데이터를 불러올 수 없습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
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
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

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

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 버튼 */}
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        콘텐츠 목록으로
      </Button>

      {/* 파일 정보 */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 좌측 카드 - 파일 정보 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">파일명</p>
                <p className="truncate text-base font-semibold text-gray-900">{content.file_name}</p>
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 원본 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle>원본 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-100">
              <Image
                src={content.file_path}
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

        {/* 발견 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle>발견 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50">
              {selectedDetection ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedDetection.image_url}
                    alt="발견된 이미지"
                    className="h-full w-full object-contain"
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center p-8">
                  <div>
                    <FileImage className="mx-auto mb-3 h-12 w-12" />
                    <p className="font-medium">선택된 이미지가 없습니다</p>
                    <p className="text-sm mt-1">발견내역을 클릭하여 이미지를 확인하세요</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewStatusModalOpen(true)}
                disabled={!selectedDetection}
              >
                {selectedDetection?.admin_review_status === 'pending' ? '판정' : '판정 수정'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이미지 검출 결과 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>이미지 검출 결과 ({detections.length}건)</CardTitle>
          <Button onClick={() => setAIAnalysisModalOpen(true)} variant="outline" size="sm">
            {content.is_analyzed === null ? 'AI 분석 요청' : 'AI 분석 추가요청'}
          </Button>
        </CardHeader>
        <CardContent>
          {detections.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">발견된 이미지가 없습니다.</p>
          ) : (
            <DetectionTable
              detections={detections}
              selectedDetection={selectedDetection}
              onDetectionClick={setSelectedDetection}
            />
          )}
        </CardContent>
      </Card>

      {/* 레이블/텍스트 검출 결과 */}
      {content.is_analyzed !== null && (content.label_data || content.text_data) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 레이블 검출 결과 */}
          {content.label_data && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>라벨 검출 결과</CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {content.label_data.labels?.map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">{label.description}</span>
                      <Badge variant="outline">{(label.score * 100).toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 텍스트 검출 결과 */}
          {content.text_data && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>텍스트 검출 결과</CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {content.text_data.words?.map((word, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded bg-white border px-2 py-1 text-sm text-gray-900"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
          reviewedBy={currentUserId}
          onUpdate={fetchData}
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
    </div>
  )
}
