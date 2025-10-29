'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuthRecovery } from '@/hooks/use-auth-recovery'
import { LoadingSpinner } from '@/components/common'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { recovering } = useAuthRecovery()

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="bg-secondary-50 flex flex-1 min-h-0">
        {children}
      </main>
      <Footer />
    </div>
  )
}
