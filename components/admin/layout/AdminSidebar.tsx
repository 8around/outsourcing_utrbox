'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminContext } from './AdminContext'
import Image from 'next/image'

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
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { collapsed } = useAdminContext()

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* 로고 */}
        <div className="flex h-16 items-center justify-center gap-1 border-b px-4 text-lg font-bold text-primary">
          <div className="relative h-7 w-7">
            <Image
              src="/images/logo.png"
              alt="UTRBOX Logo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          {!collapsed && <span>UTRBOX Admin</span>}
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
      </div>
    </TooltipProvider>
  )
}
