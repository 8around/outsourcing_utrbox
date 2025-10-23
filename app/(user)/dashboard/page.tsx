'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/authStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { mockContents, mockCollections } from '@/lib/mock-data'
import { Image, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary-500 text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="text-secondary-400 mt-1 text-xs">{description}</p>
        </div>
        <div className="bg-primary-50 text-primary-600 flex h-12 w-12 items-center justify-center rounded-full">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { setContents, setCollections } = useContentStore()
  const [isLoading, setIsLoading] = useState(true)

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Filter data by current user
      const userContents = mockContents.filter((c) => c.user_id === user?.id)
      const userCollections = mockCollections.filter((c) => c.user_id === user?.id)

      setContents(userContents)
      setCollections(userCollections)
      setIsLoading(false)
    }

    loadData()
  }, [user, setContents, setCollections])

  const userContents = mockContents.filter((c) => c.user_id === user?.id)
  const completedContents = userContents.filter((c) => c.analysis_status === 'completed')
  const totalDetections = userContents.reduce((sum, c) => sum + c.detection_count, 0)

  // Recent uploads (last 5)
  const recentUploads = [...userContents]
    .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
    .slice(0, 5)

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-secondary-500 mt-1">콘텐츠 관리 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 콘텐츠"
          value={userContents.length}
          icon={<Image className="h-6 w-6" />}
          description="업로드된 전체 콘텐츠"
        />
        <StatCard
          title="분석 완료"
          value={completedContents.length}
          icon={<CheckCircle2 className="h-6 w-6" />}
          description="AI 분석 완료"
        />
        <StatCard
          title="발견 건수"
          value={totalDetections}
          icon={<AlertCircle className="h-6 w-6" />}
          description="침해 의심 건수"
        />
        <StatCard
          title="컬렉션"
          value={mockCollections.filter((c) => c.user_id === user?.id).length}
          icon={<FolderOpen className="h-6 w-6" />}
          description="관리 중인 컬렉션"
        />
      </div>

      {/* Recent Uploads */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">최근 업로드</h2>
          <Link href="/contents" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>

        {recentUploads.length === 0 ? (
          <div className="text-secondary-500 py-12 text-center">
            <Image className="text-secondary-300 mx-auto mb-3 h-12 w-12" />
            <p>아직 업로드된 콘텐츠가 없습니다</p>
            <Link
              href="/contents/upload"
              className="mt-2 inline-block text-primary hover:underline"
            >
              첫 콘텐츠 업로드하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentUploads.map((content) => (
              <Link key={content.id} href={`/contents/${content.id}`} className="block">
                <div className="hover:bg-secondary-50 flex items-center gap-4 rounded-lg p-4 transition-colors">
                  <img
                    src={content.file_url}
                    alt={content.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{content.title}</h3>
                    <p className="text-secondary-500 truncate text-sm">{content.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(content.analysis_status)}
                      >
                        {getStatusText(content.analysis_status)}
                      </Badge>
                      {content.detection_count > 0 && (
                        <span className="text-secondary-500 text-xs">
                          발견 {content.detection_count}건
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary-500 text-sm">
                      {format(new Date(content.upload_date), 'yyyy.MM.dd', { locale: ko })}
                    </p>
                    <p className="text-secondary-400 text-xs">
                      {(content.file_size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
