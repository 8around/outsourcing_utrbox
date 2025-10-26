'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/authStore'
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // 최소 사용자 정보만 저장 (세션은 쿠키에 자동 저장됨)
        login({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          organization: result.data.user.organization,
          role: result.data.user.role,
          isApproved: result.data.user.isApproved,
        })
        toast({
          title: '로그인 성공',
          description: `환영합니다, ${result.data.user.name}님!`,
        })
        router.push('/')
      } else {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: result.error || '로그인에 실패했습니다.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '로그인 중 오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : '로그인'}
          </Button>
        </form>
      </Form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <Link href="/reset-password" className="block text-primary hover:underline">
          비밀번호를 잊으셨나요?
        </Link>
        <div className="text-secondary-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
