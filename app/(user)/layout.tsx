'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { useAuthStore } from '@/lib/stores/authStore'
import { useAuthRecovery } from '@/hooks/use-auth-recovery'
import { LoadingSpinner } from '@/components/common'
import { cn } from '@/lib/utils'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { recovering } = useAuthRecovery()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          className={cn(
            'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transition-transform lg:sticky lg:z-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        />

        {/* Main content */}
        <main className="bg-secondary-50 flex-1">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
