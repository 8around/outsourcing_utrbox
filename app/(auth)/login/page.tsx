import { Suspense } from 'react'
import { LoginForm } from '@/components/auth'
import { LoadingSpinner } from '@/components/common'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner className="text-gray-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
