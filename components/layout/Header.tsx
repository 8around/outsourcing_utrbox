'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/stores/authStore'
import { User, LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function Header() {
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

      // 성공 시
      logout()
      
      router.replace('/login')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '네트워크 오류',
        description: '서버에 연결할 수 없습니다. 다시 시도해주세요.',
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold text-primary">UTRBOX</div>
        </Link>

        <div className="flex-1" />

        {/* User menu */}
        {user && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="bg-primary-100 text-primary-600 flex h-8 w-8 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-secondary-500 text-xs">{user.organization}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-secondary-500 text-xs font-normal">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-error">
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
