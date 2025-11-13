'use client'

import { ReactNode } from 'react'
import { AdminContextProvider, useAdminContext } from '@/components/admin/layout/AdminContext'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { AdminFooter } from '@/components/admin/layout/AdminFooter'
import { cn } from '@/lib/utils'

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { collapsed } = useAdminContext()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          collapsed ? 'pl-16' : 'pl-56'
        )}
      >
        <AdminHeader />
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
        <AdminFooter />
      </div>
    </div>
  )
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminContextProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminContextProvider>
  )
}
