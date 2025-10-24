'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileImage, ClipboardCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const menuItems = [
  {
    title: '대시보드',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '회원 관리',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: '콘텐츠 관리',
    href: '/admin/contents',
    icon: FileImage,
  },
  {
    title: '비교 검토',
    href: '/admin/review',
    icon: ClipboardCheck,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    // Mock 로그아웃 - 실제로는 Supabase Auth 로그아웃
    console.log('Logout clicked')
    // TODO: 실제 로그아웃 구현 시 추가
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50">
      {/* 로고 */}
      <div className="flex h-16 items-center justify-center border-b px-6">
        <Link href="/admin/dashboard" className="text-xl font-bold text-blue-600">
          UTRBOX Admin
        </Link>
      </div>

      {/* 메뉴 아이템 */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* 하단 로그아웃 */}
      <div className="border-t p-4">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          로그아웃
        </Button>
      </div>
    </div>
  )
}
