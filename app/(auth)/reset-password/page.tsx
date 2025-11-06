'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm, ResetPasswordChangeForm } from '@/components/auth'
import { LoadingSpinner } from '@/components/common'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useRouter } from 'next/navigation'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // 세션 확인
    const checkSession = async () => {
      const { data } = await supabase.auth.getClaims()
      const claims = data?.claims

      if (!claims?.is_approved) {
        await supabase.auth.signOut()
        setHasSession(false)

        return
      }

      useAuthStore.getState().login({
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        organization: claims.organization,
        role: claims.user_role,
        isApproved: claims.is_approved,
      })

      setHasSession(true)
    }

    checkSession()
  }, [])

  // URL 파라미터로부터 인증 결과 확인 및 표시
  useEffect(() => {
    const verified = searchParams.get('verified')
    const message = searchParams.get('message')

    if (verified === 'true') {
      // 성공 시 Toast 표시
      setTimeout(() => {
        toast({
          title: '인증 완료',
          description: '새 비밀번호를 설정해주세요.',
        })
      }, 0)
    } else if (verified === 'false') {
      // 실패 시 Toast 표시
      setTimeout(() => {
        toast({
          variant: 'destructive',
          title: '인증 실패',
          description: message || '비밀번호 재설정 링크가 유효하지 않습니다.',
        })
      }, 0)
    }

    router.replace('/reset-password')
  }, [searchParams, toast, router])

  // 세션 확인 중
  if (hasSession === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner className="text-gray-400" />
      </div>
    )
  }

  // 세션 있음 → 비밀번호 변경 폼
  if (hasSession) {
    return <ResetPasswordChangeForm />
  }

  // 세션 없음 → 이메일 요청 폼
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner className="text-gray-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
