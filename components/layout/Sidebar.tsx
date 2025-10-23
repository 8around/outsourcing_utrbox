'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Image, FolderOpen, SearchCheck } from 'lucide-react'

interface SidebarProps {
  className?: string
}

const menuItems = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '콘텐츠',
    href: '/contents',
    icon: Image,
  },
  {
    title: '컬렉션',
    href: '/collections',
    icon: FolderOpen,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn('flex w-64 flex-col border-r bg-white', className)}>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
