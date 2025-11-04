'use client'

import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { DashboardStats } from '@/components/admin/dashboard/DashboardStats'
import { PendingContentsCard } from '@/components/admin/dashboard/PendingContentsCard'
import { PendingUsersCard } from '@/components/admin/dashboard/PendingUsersCard'

export default function AdminDashboardPage() {
  useAdminTitle('대시보드')

  return (
    <div className="space-y-6">
      {/* 통계 카드 - 독립적 로딩 */}
      <DashboardStats />

      {/* 실시간 활동 피드 - 각각 독립적 로딩 */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <PendingContentsCard />
        <PendingUsersCard />
      </div>
    </div>
  )
}
