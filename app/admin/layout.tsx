'use client'

import { ReactNode } from 'react'
import { AdminContextProvider } from '@/components/admin/layout/AdminContext'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminContextProvider>
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminContextProvider>
  )
}
