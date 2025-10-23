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
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/lib/stores/authStore'
import { mockAuthApi } from '@/lib/api/mock'
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  rememberMe: z.boolean(),
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
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const response = await mockAuthApi.login(data.email, data.password)

      if (response.success && response.data) {
        login(response.data)
        toast({
          title: '로그인 성공',
          description: `환영합니다, ${response.data.name}님!`,
        })
        router.push('/dashboard')
      } else {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: response.error || '로그인에 실패했습니다.',
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

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm font-normal">
                  로그인 상태 유지
                </FormLabel>
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
