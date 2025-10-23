import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-white py-6">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-secondary-500 text-sm">
            © {currentYear} UTRBOX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="text-secondary-500 hover:text-secondary-900 text-sm transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-secondary-500 hover:text-secondary-900 text-sm transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
