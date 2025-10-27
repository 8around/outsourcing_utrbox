import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  noPadding?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: '',
}

export function Container({
  children,
  className,
  maxWidth = '7xl',
  noPadding = false,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        !noPadding && 'px-4 sm:px-6 lg:px-8 xl:px-12',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
