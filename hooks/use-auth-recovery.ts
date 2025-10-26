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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setRecovering(false)
        return
      }
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

      if (profile) {
        useAuthStore.getState().login({
          id: user.id,
          email: user.email || '',
          name: profile.name,
          organization: profile.organization || '',
          role: profile.role as UserRole,
          isApproved: profile.is_approved,
        })
      }
      setRecovering(false)
    })()
  }, [])

  return { recovering }
}
