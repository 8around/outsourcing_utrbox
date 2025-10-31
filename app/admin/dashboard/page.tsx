'use client'

import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { StatsCard } from '@/components/admin/dashboard/StatsCard'
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed'
import { FileImage, Clock, CheckCircle2, Users, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  useAdminTitle('대시보드')

  return (
    <div className="space-y-6">
        {/* 통계 카드 (5개) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="총 콘텐츠"
            value={0}
            icon={<FileImage className="h-5 w-5" />}
            unit="건"
          />
          <StatsCard
            title="대기중"
            value={0}
            icon={<Clock className="h-5 w-5" />}
            unit="건"
          />
          <StatsCard
            title="분석중"
            value={0}
            icon={<Activity className="h-5 w-5" />}
            unit="건"
          />
          <StatsCard
            title="분석완료"
            value={0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            unit="건"
          />
          <StatsCard
            title="회원수"
            value={0}
            icon={<Users className="h-5 w-5" />}
            unit="명"
          />
        </div>

      {/* 실시간 활동 피드 */}
      <ActivityFeed
        pendingContents={[]}
        pendingUsers={[]}
        maxItems={10}
      />
    </div>
  )
}
