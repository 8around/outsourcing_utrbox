'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from './StatsCard'
import { FileImage, Clock, CheckCircle2, Users, Activity } from 'lucide-react'
import { getDashboardStats, DashboardStats as Stats } from '@/lib/api/dashboard'
import { useToast } from '@/hooks/use-toast'

export function DashboardStats() {
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const result = await getDashboardStats()

        if (result.success && result.data) {
          setStats(result.data)
        } else {
          toast({
            variant: 'destructive',
            title: '통계 조회 실패',
            description: result.error || '통계를 불러올 수 없습니다.',
          })
        }
      } catch (error) {
        console.error('통계 로드 중 오류:', error)
        toast({
          variant: 'destructive',
          title: '통계 조회 실패',
          description: '통계를 불러올 수 없습니다.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [toast])

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <StatsCard
        title="총 콘텐츠"
        value={stats?.totalContents}
        icon={<FileImage className="h-5 w-5" />}
        unit="건"
        isLoading={isLoading}
      />
      <StatsCard
        title="대기중"
        value={stats?.pendingContents}
        icon={<Clock className="h-5 w-5" />}
        unit="건"
        isLoading={isLoading}
      />
      <StatsCard
        title="분석중"
        value={stats?.analyzingContents}
        icon={<Activity className="h-5 w-5" />}
        unit="건"
        isLoading={isLoading}
      />
      <StatsCard
        title="분석완료"
        value={stats?.completedContents}
        icon={<CheckCircle2 className="h-5 w-5" />}
        unit="건"
        isLoading={isLoading}
      />
      <StatsCard
        title="회원수"
        value={stats?.totalUsers}
        icon={<Users className="h-5 w-5" />}
        unit="명"
        isLoading={isLoading}
      />
    </div>
  )
}
