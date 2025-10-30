'use client'

import { useAdminContext } from './AdminContext'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function AdminHeader() {
  const { title, toggleCollapsed } = useAdminContext()
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: '로그아웃 실패',
          description: result.error,
        })
        return
      }

      logout()
      router.replace('/admin/login')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '네트워크 오류',
        description: '서버에 연결할 수 없습니다. 다시 시도해주세요.',
      })
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* 좌측: 토글 버튼 + 페이지 제목 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* 우측: 사용자 정보 */}
      {user && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-gray-500">{user.organization}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-gray-500">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
