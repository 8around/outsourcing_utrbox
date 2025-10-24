import { ReactNode } from 'react'

interface AdminRootLayoutProps {
  children: ReactNode
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  // AdminLayout은 각 페이지에서 개별적으로 적용
  // 여기서는 공통 설정만 처리
  return <>{children}</>
}
