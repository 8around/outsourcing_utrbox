'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminContextType {
  title: string
  setTitle: (title: string) => void
  collapsed: boolean
  toggleCollapsed: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminContextProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('대시보드')
  const [collapsed, setCollapsed] = useState(false)

  // localStorage에서 초기 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed')
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
  }, [])

  // 토글 함수
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('adminSidebarCollapsed', String(newState))
  }

  return (
    <AdminContext.Provider value={{ title, setTitle, collapsed, toggleCollapsed }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminContext must be used within AdminContextProvider')
  }
  return context
}

// 각 페이지에서 사용할 훅
export function useAdminTitle(newTitle: string) {
  const { setTitle } = useAdminContext()

  useEffect(() => {
    setTitle(newTitle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTitle])
}
