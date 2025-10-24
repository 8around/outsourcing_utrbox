import { Badge } from '@/components/ui/badge'
import { Clock, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

interface AnalysisStatusBadgeProps {
  status: boolean | null // is_analyzed
  message?: string
}

export function AnalysisStatusBadge({ status, message }: AnalysisStatusBadgeProps) {
  // NULL: Gray (대기)
  if (status === null) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        대기
      </Badge>
    )
  }

  // FALSE + message: Red (실패)
  if (status === false && message) {
    return (
      <Badge variant="destructive" className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
        <AlertCircle className="h-3 w-3" />
        실패
      </Badge>
    )
  }

  // FALSE: Yellow (진행 중)
  if (status === false) {
    return (
      <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        <Activity className="h-3 w-3" />
        분석 중
      </Badge>
    )
  }

  // TRUE + no message: Green (완료)
  return (
    <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
      <CheckCircle2 className="h-3 w-3" />
      완료
    </Badge>
  )
}
