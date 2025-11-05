'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  email: z.email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showResendButton, setShowResendButton] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 이메일 인증 결과 toast 표시
  useEffect(() => {
    const verified = searchParams.get('verified')
    const message = searchParams.get('message')

    if (verified === 'success') {
      // 성공 시 항상 동일한 메시지
      // setTimeout으로 toast 호출을 지연시켜 hydration 완료 후 실행
      setTimeout(() => {
        toast({
          title: '이메일 인증 완료',
          description: message || '이메일 인증이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
        })
      }, 0)
    } else if (verified === 'error') {
      // 에러 메시지 표시
      setTimeout(() => {
        toast({
          variant: 'destructive',
          title: '이메일 인증 실패',
          description: message || '이메일 인증에 실패했습니다.',
        })
      }, 0)

      // 재전송 버튼 표시 (모든 에러 케이스)
      setShowResendButton(true)

      // URL에서 쿼리 파라미터 제거 (history replace)
      router.replace('/login')
    }
  }, [searchParams, router, toast])

  // 인증 메일 재전송 핸들러
  const handleResendEmail = async () => {
    try {
      // 재전송 API 호출 구현 예정
      toast({
        title: '재전송 완료',
        description: '인증 메일을 재전송했습니다. 이메일을 확인해주세요.',
      })
      setShowResendButton(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '재전송 실패',
        description: '이메일 재전송 중 오류가 발생했습니다.',
      })
    }
  }

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

        if (result.data.user.role === 'member') {
          router.push('/collections')
        } else if (result.data.user.role === 'admin') {
          router.push('/admin/dashboard')
        }
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
    <div className="rounded-lg border bg-white p-8 shadow-md">
      <h1 className="text-center text-2xl font-bold text-primary">로그인</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="이메일" {...field} />
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
                  <Input type="password" placeholder="비밀번호" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 재전송 버튼 (에러 발생 시 표시) */}
          {showResendButton && (
            <div className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="mb-3 text-sm text-gray-700">인증 메일을 재전송하시겠습니까?</p>
              <Button variant="outline" onClick={handleResendEmail} className="text-sm">
                인증 메일 재전송
              </Button>
            </div>
          )}

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
