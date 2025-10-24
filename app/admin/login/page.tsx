'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Mock 로그인 검증 - PRD 명시된 임시 계정
    // 실제로는 Supabase Auth + RLS is_admin() 체크
    if (email === 'pulwind00@gmail.com' && password === 'Youngtest002!') {
      // 로그인 성공
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 500)
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 text-3xl font-bold text-blue-600">UTRBOX Admin</div>
          <CardTitle className="text-2xl">관리자 로그인</CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>

            {/* Mock 계정 안내 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg border bg-blue-50 p-3 text-xs text-blue-900">
                <p className="font-semibold">개발 환경 - Mock 계정</p>
                <p className="mt-1">
                  이메일: pulwind00@gmail.com
                  <br />
                  비밀번호: Youngtest002!
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
