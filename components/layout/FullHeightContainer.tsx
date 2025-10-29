import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FullHeightContainerProps {
  children: ReactNode
  className?: string
}

export function FullHeightContainer({ children, className }: FullHeightContainerProps) {
  return (
    <div className={cn('flex flex-1 min-h-0 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-12', className)}>
      {children}
    </div>
  )
}
