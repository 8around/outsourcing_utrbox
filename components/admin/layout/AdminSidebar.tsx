'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileImage, ClipboardCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAdminContext } from './AdminContext'

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
  const { collapsed } = useAdminContext()

  const handleLogout = () => {
    // Mock 로그아웃 - 실제로는 Supabase Auth 로그아웃
    console.log('Logout clicked')
    // TODO: 실제 로그아웃 구현 시 추가
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex h-screen flex-col border-r bg-white transition-all duration-300',
          collapsed ? 'w-20' : 'w-56'
        )}
      >
        {/* 로고 */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          {collapsed ? (
            <div className="text-2xl font-bold text-primary">U</div>
          ) : (
            <Link href="/admin/dashboard" className="text-xl font-bold text-primary">
              UTRBOX Admin
            </Link>
          )}
        </div>

        {/* 메뉴 아이템 */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

            const menuLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : 'justify-start',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )

            // 축소 상태일 때 Tooltip 표시
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{menuLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return menuLink
          })}
        </nav>

        {/* 하단 로그아웃 */}
        <div className="border-t p-4">
          {!collapsed && <Separator className="mb-4" />}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>로그아웃</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              로그아웃
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
