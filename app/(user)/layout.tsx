'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuthStore } from '@/lib/stores/authStore'
import { useAuthRecovery } from '@/hooks/use-auth-recovery'
import { LoadingSpinner } from '@/components/common'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { recovering } = useAuthRecovery()

  // Check authentication
  useEffect(() => {
    if (!recovering && !isAuthenticated) {
      router.push('/login')
    }
  }, [recovering, isAuthenticated, router])

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
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
