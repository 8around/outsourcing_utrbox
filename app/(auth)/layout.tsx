export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary/50 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">UTRBOX</h1>
          <p className="text-secondary/500 mt-2">콘텐츠 저작권 관리 시스템</p>
        </div>
        {children}
      </div>
    </div>
  )
}
