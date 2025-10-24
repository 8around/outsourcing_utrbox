'use client'

import { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
  title: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col">
        {/* 헤더 */}
        <AdminHeader title={title} />

        {/* 컨텐츠 영역 */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
