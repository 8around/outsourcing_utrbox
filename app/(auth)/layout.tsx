import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 영역: 인증 컨텐츠 */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-secondary/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">UTRBOX</h1>
            <p className="text-secondary/500 mt-2">콘텐츠 저작권 관리 시스템</p>
          </div>
          {children}
        </div>
      </div>

      {/* 오른쪽 영역: 배경 이미지 */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-background">
        <div className="relative w-full h-full">
          <Image
            src="/images/auth-background.jpg"
            alt="Authentication background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  )
}
