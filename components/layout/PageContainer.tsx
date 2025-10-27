import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Container } from './Container'

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  withVerticalPadding?: boolean
}

export function PageContainer({
  children,
  className,
  maxWidth = '7xl',
  withVerticalPadding = true,
}: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      className={cn(withVerticalPadding && 'py-4 sm:py-6 lg:py-6 xl:py-8', className)}
    >
      {children}
    </Container>
  )
}
