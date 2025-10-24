'use client'

import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'

interface AnalysisButtonProps {
  contentId: string
  onAnalyze: (contentId: string) => void
  isAnalyzing?: boolean
  disabled?: boolean
}

export function AnalysisButton({
  contentId,
  onAnalyze,
  isAnalyzing = false,
  disabled = false,
}: AnalysisButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onAnalyze(contentId)}
      disabled={disabled || isAnalyzing}
      className="gap-1"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          분석 중...
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          AI 분석
        </>
      )}
    </Button>
  )
}
