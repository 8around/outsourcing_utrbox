'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
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
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2 } from 'lucide-react'

const resetPasswordSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (result.success) {
        setIsSuccess(true)
      } else {
        toast({
          variant: 'destructive',
          title: '비밀번호 재설정 실패',
          description: result.error?.errorMessage || '비밀번호 재설정에 실패했습니다.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '비밀번호 재설정 중 오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-md">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">이메일이 발송되었습니다</h2>
        <p className="text-secondary-500 mb-6">
          비밀번호 재설정 링크가 이메일로 발송되었습니다.
          <br />
          이메일을 확인해주세요.
        </p>
        <Link href="/login">
          <Button className="w-full">로그인으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">비밀번호 재설정</h2>
        <p className="text-secondary-500 text-sm">
          이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : '재설정 링크 발송'}
          </Button>
        </form>
      </Form>

      <div className="text-secondary-500 mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
