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
    email: z.email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
      .regex(/^[a-zA-Z0-9@$!%*?&]*$/, '영어, 숫자, 특수문자(@$!%*?&)만 사용 가능합니다')
      .regex(/[a-z]/, '영어 소문자를 최소 1개 포함해야 합니다')
      .regex(/[A-Z]/, '영어 대문자를 최소 1개 포함해야 합니다')
      .regex(/\d/, '숫자를 최소 1개 포함해야 합니다')
      .regex(/[@$!%*?&]/, '특수문자(@$!%*?&)를 최소 1개 포함해야 합니다'),
    passwordConfirm: z.string(),
    name: z
      .string()
      .min(2, '이름은 최소 2자 이상이어야 합니다')
      .regex(
        /^[a-zA-Z가-힣]+(\s[a-zA-Z가-힣]+)*$/,
        '영어와 한글만 입력 가능하며, 연속된 공백은 허용되지 않습니다.'
      ),
    organization: z
      .string()
      .min(2, '소속은 최소 2자 이상이어야 합니다')
      .regex(
        /^[a-zA-Z가-힣0-9]+(\s[a-zA-Z가-힣0-9]+)*$/,
        '영어, 한글, 숫자만 입력 가능하며, 연속된 공백은 허용되지 않습니다.'
      ),
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
    mode: 'onTouched', // 입력 시점부터 실시간 검증 시작
    reValidateMode: 'onChange', // 에러 발생 후 실시간 재검증
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          organization: data.organization,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowSuccessDialog(true)
      } else {
        toast({
          variant: 'destructive',
          title: '회원가입 실패',
          description: result.error?.errorMessage || '회원가입에 실패했습니다.',
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
        <h2 className="text-center text-xl font-bold text-primary">회원가입</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">이메일</FormLabel>
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
                  <FormLabel className="text-foreground">비밀번호</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="비밀번호"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        // 비밀번호가 변경되면 비밀번호 확인 필드도 재검증
                        const passwordConfirmValue = form.getValues('passwordConfirm')
                        if (passwordConfirmValue) {
                          form.trigger('passwordConfirm')
                        }
                      }}
                    />
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
                  <FormLabel className="text-foreground">비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="비밀번호 확인" {...field} />
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
                  <FormLabel className="text-foreground">이름</FormLabel>
                  <FormControl>
                    <Input placeholder="이름" {...field} />
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
                  <FormLabel className="text-foreground">소속</FormLabel>
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
                      <FormLabel className="cursor-pointer text-sm font-normal text-foreground">
                        <Link href="#" className="text-primary hover:underline" target="_blank">
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
                      <FormLabel className="cursor-pointer text-sm font-normal text-foreground">
                        <Link href="#" className="text-primary hover:underline" target="_blank">
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
              <p>
                <span className="font-bold">이메일 인증</span> 및{' '}
                <span className="font-bold">관리자 승인</span> 이후 서비스 이용이 가능합니다.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleDialogClose}>확인</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
