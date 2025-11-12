import Image from 'next/image'

// Auth Header 컴포넌트
function AuthHeader() {
  return (
    <header className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-1">
        <div className="relative h-8 w-8">
          <Image
            src="/images/logo.png"
            alt="UTRBOX Logo"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h1 className="text-2xl font-bold text-primary">UTRBOX</h1>
      </div>
    </header>
  )
}

// Auth Footer 컴포넌트
function AuthFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-center text-sm text-primary">
        <span>© {currentYear} UTRBOX</span>
        <span className="mx-2">·</span>
        <a
          target="_blank"
          href="https://utrbox.oopy.io/29b13c6a-c40f-805e-b802-e249f5c89edf"
          className="text-primary/80 transition-colors hover:text-primary/100"
        >
          Pricing
        </a>
        <span className="mx-2">·</span>
        <a
          target="_blank"
          href="https://utrbox.oopy.io/29913c6a-c40f-80d2-84f7-ecefbd123042"
          className="text-primary/80 transition-colors hover:text-primary/100"
        >
          이용약관
        </a>
        <span className="mx-2">·</span>
        <a
          target="_blank"
          href="https://utrbox.oopy.io/29913c6a-c40f-807f-b4cb-f1ec9a682384"
          className="text-primary/80 transition-colors hover:text-primary/100"
        >
          개인정보처리방침
        </a>
      </div>
    </footer>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 영역: 인증 컨텐츠 */}
      <div className="flex w-full flex-col bg-secondary/50 lg:w-1/2">
        <AuthHeader />

        {/* 중앙 컨텐츠 영역 */}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <AuthFooter />
      </div>

      {/* 오른쪽 영역: 배경 이미지 */}
      <div className="hidden items-center justify-center bg-background lg:flex lg:w-1/2">
        <div className="relative h-full w-full">
          {/* 배경 이미지 */}
          <Image
            src="/images/auth-background.jpg"
            alt="Authentication background"
            fill
            className="object-cover"
            unoptimized
          />

          {/* 중앙 오버레이: 로고 + 텍스트 */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              <p className="text-center text-4xl font-bold text-white">Beyond AI, Control.</p>
              <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                <div className="relative h-16 w-16">
                  <Image
                    src="/images/logo.png"
                    alt="UTRBOX Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
