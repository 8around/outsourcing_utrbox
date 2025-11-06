'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { updateUserPassword } from '@/lib/supabase/auth'

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
      .regex(/^[a-zA-Z0-9@$!%*?&]*$/, '영어, 숫자, 특수문자(@$!%*?&)만 사용 가능합니다')
      .regex(/[a-z]/, '영어 소문자를 최소 1개 포함해야 합니다')
      .regex(/[A-Z]/, '영어 대문자를 최소 1개 포함해야 합니다')
      .regex(/\d/, '숫자를 최소 1개 포함해야 합니다')
      .regex(/[@$!%*?&]/, '특수문자(@$!%*?&)를 최소 1개 포함해야 합니다'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export function ResetPasswordChangeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsLoading(true)

    try {
      // 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          variant: 'destructive',
          title: '인증 오류',
          description: '세션이 만료되었습니다. 다시 시도해주세요.',
        })
        router.push('/reset-password')
        return
      }

      // 비밀번호 업데이트
      const result = await updateUserPassword(supabase, data.password)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: '비밀번호 변경 실패',
          description: result.error?.errorMessage || '비밀번호 변경에 실패했습니다.',
        })
        return
      }

      // 성공
      toast({
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
      })

      // 세션 정리 후 로그인 페이지로
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '비밀번호 변경 중 오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">새 비밀번호 설정</h2>
        <p className="text-secondary-500 text-sm">
          새로운 비밀번호를 입력해주세요. 영어 대소문자, 숫자, 특수문자(@$!%*?&)를 각각 최소 1개
          이상 포함한 8자 이상이어야 합니다.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">새 비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="영문 대소문자, 숫자, 특수문자 포함 8자 이상"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">새 비밀번호 확인</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="새 비밀번호 확인" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : '비밀번호 변경'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
