import Link from 'next/link'
import { EXTERNAL_LINKS } from '@/lib/constants/externalLinks'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-white py-6">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-primary">© {currentYear} UTRBOX. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              target="_blank"
              href={EXTERNAL_LINKS.TERMS_OF_SERVICE}
              className="text-sm text-primary/80 transition-colors hover:text-primary/100"
            >
              이용약관
            </Link>
            <Link
              target="_blank"
              href={EXTERNAL_LINKS.PRIVACY_POLICY}
              className="text-sm text-primary/80 transition-colors hover:text-primary/100"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
