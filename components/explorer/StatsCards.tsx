'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Image as ImageIcon, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'
import { getCollectionsCount } from '@/lib/api/collections'
import { getContentsCount, getCompletedAnalysisCount } from '@/lib/api/contents'
import { getMatchedAnalyzedContentsCount } from '@/lib/api/detections'

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

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

export function StatsCards() {
  const { user } = useAuthStore()
  
  const [totalContents, setTotalContents] = useState(0)
  const [completedAnalysis, setCompletedAnalysis] = useState(0)
  const [totalDetections, setTotalDetections] = useState(0)
  const [totalCollections, setTotalCollections] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const [contentsCountRes, completedCountRes, detectionsCountRes, collectionsCountRes] =
          await Promise.all([
            getContentsCount(user.id),
            getCompletedAnalysisCount(user.id),
            getMatchedAnalyzedContentsCount(user.id),
            getCollectionsCount(user.id),
          ])

        if (contentsCountRes.success && contentsCountRes.data) {
          setTotalContents(contentsCountRes.data)
        }
        if (completedCountRes.success && completedCountRes.data) {
          setCompletedAnalysis(completedCountRes.data)
        }
        if (detectionsCountRes.success && detectionsCountRes.data) {
          setTotalDetections(detectionsCountRes.data)
        }
        if (collectionsCountRes.success && collectionsCountRes.data) {
          setTotalCollections(collectionsCountRes.data)
        }
        
      } catch (err) {
        console.error('통계 데이터 로드 오류:', err)
        setError('통계 데이터를 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [user])

  if (isLoading) {
    return <StatsCardsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="총 콘텐츠"
        value={totalContents}
        icon={<ImageIcon className="h-6 w-6" />}
        description="업로드된 전체 콘텐츠"
      />
      <StatCard
        title="분석 완료"
        value={completedAnalysis}
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
        value={totalCollections}
        icon={<FolderOpen className="h-6 w-6" />}
        description="관리 중인 컬렉션"
      />
    </div>
  )
}
