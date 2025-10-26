'use client'

import { Card } from '@/components/ui/card'
import { Image, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react'

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

interface StatsCardsProps {
  totalContents: number
  completedAnalysis: number
  totalDetections: number
  totalCollections: number
}

export function StatsCards({
  totalContents,
  completedAnalysis,
  totalDetections,
  totalCollections,
}: StatsCardsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="총 콘텐츠"
        value={totalContents}
        icon={<Image className="h-6 w-6" />}
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
