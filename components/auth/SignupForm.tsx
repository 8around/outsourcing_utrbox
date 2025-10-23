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
import { mockAuthApi } from '@/lib/api/mock'
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
    passwordConfirm: z.string(),
    name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
    organization: z.string().min(2, '소속은 최소 2자 이상이어야 합니다'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: '이용약관에 동의해주세요',
    }),
    agreePrivacy: z.boolean().refine((val) => val === true, {
      message: '개인정보처리방침에 동의해주세요',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      name: '',
      organization: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true)

    try {
      const response = await mockAuthApi.signup({
        email: data.email,
        password: data.password,
        name: data.name,
        organization: data.organization,
      })

      if (response.success) {
        setShowSuccessDialog(true)
      } else {
        toast({
          variant: 'destructive',
          title: '회원가입 실패',
          description: response.error || '회원가입에 실패했습니다.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '회원가입 중 오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = () => {
    setShowSuccessDialog(false)
    router.push('/login')
  }

  return (
    <>
      <div className="rounded-lg bg-white p-8 shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>소속</FormLabel>
                  <FormControl>
                    <Input placeholder="회사명 또는 단체명" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2">
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer text-sm font-normal">
                        <Link
                          href="/terms"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          이용약관
                        </Link>
                        에 동의합니다 (필수)
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreePrivacy"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer text-sm font-normal">
                        <Link
                          href="/privacy"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          개인정보처리방침
                        </Link>
                        에 동의합니다 (필수)
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : '회원가입'}
            </Button>
          </form>
        </Form>

        <div className="text-secondary-500 mt-6 text-center text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원가입 완료</DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>회원가입이 완료되었습니다.</p>
              <p className="text-warning">관리자 승인 후 로그인이 가능합니다.</p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleDialogClose}>확인</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
