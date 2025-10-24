'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AdminHeaderProps {
  title: string
}

export function AdminHeader({ title }: AdminHeaderProps) {
  // Mock 관리자 정보 - 실제로는 Supabase Auth에서 가져옴
  const adminName = '관리자'
  const adminEmail = 'pulwind00@gmail.com'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

      {/* 우측 영역 */}
      <div className="flex items-center gap-4">
        {/* 알림 버튼 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {/* 알림 배지 (개수가 있을 때만 표시) */}
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* 관리자 정보 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{adminName}</p>
            <p className="text-xs text-gray-500">{adminEmail}</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-blue-600 text-white">
              {adminName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
