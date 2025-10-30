'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { UserRole } from '@/types'

export function useAuthRecovery() {
  const attempted = useRef(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (attempted.current) return
    if (typeof window === 'undefined') return

    const missing = localStorage.getItem('auth-storage') === null
    if (!missing) return

    attempted.current = true

    setRecovering(true)
    ;(async () => {
      const { data, error } = await supabase.auth.getClaims()
      const claims = data?.claims

      if (error || !claims) {
        setRecovering(false)

        return
      }

      useAuthStore.getState().login({
        id: claims.sub,
        email: claims.email as string,
        name: claims.name as string,
        organization: claims.organization || null,
        role: claims.user_role as UserRole,
        isApproved: claims.is_approved,
      })

      setRecovering(false)
    })()
  }, [])

  return { recovering }
}
