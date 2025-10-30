'use client'

import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { StatsCard } from '@/components/admin/dashboard/StatsCard'
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed'
import { FileImage, Clock, CheckCircle2, Users, Activity } from 'lucide-react'
import { mockDashboardStats, mockPendingContents, mockPendingUsers } from '@/lib/admin/mock-data'

export default function AdminDashboardPage() {
  useAdminTitle('대시보드')

  return (
    <div className="space-y-6">
        {/* 통계 카드 (5개) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="총 콘텐츠"
            value={mockDashboardStats.total_contents}
            icon={<FileImage className="h-5 w-5" />}
            change="+12%"
            trend="up"
          />
          <StatsCard
            title="대기중"
            value={mockDashboardStats.pending_contents}
            icon={<Clock className="h-5 w-5" />}
            change="+3"
            trend="up"
          />
          <StatsCard
            title="분석중"
            value={mockDashboardStats.analyzing_contents}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatsCard
            title="분석완료"
            value={mockDashboardStats.completed_contents}
            icon={<CheckCircle2 className="h-5 w-5" />}
            change="+8"
            trend="up"
          />
          <StatsCard
            title="회원수"
            value={mockDashboardStats.total_users}
            icon={<Users className="h-5 w-5" />}
            change="+2"
            trend="up"
          />
        </div>

      {/* 실시간 활동 피드 */}
      <ActivityFeed
        pendingContents={mockPendingContents}
        pendingUsers={mockPendingUsers}
        maxItems={10}
      />
    </div>
  )
}
