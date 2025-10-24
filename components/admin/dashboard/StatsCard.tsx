import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: ReactNode
  change?: string
  trend?: 'up' | 'down'
}

export function StatsCard({ title, value, icon, change, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className="mt-1 flex items-center text-xs">
            {trend === 'up' && <ArrowUp className="mr-1 h-3 w-3 text-green-500" />}
            {trend === 'down' && <ArrowDown className="mr-1 h-3 w-3 text-red-500" />}
            <span className={cn('font-medium', trend === 'up' ? 'text-green-500' : 'text-red-500')}>
              {change}
            </span>
            <span className="ml-1 text-gray-500">전일 대비</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
