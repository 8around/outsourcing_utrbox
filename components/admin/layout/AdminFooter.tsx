import Link from 'next/link'
import { EXTERNAL_LINKS } from '@/lib/constants/externalLinks'

export function AdminFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-white py-6">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center text-sm text-primary">
          <span>© {currentYear} UTRBOX</span>
          <span className="mx-2">·</span>
          <Link
            target="_blank"
            href={EXTERNAL_LINKS.PRICING}
            className="text-primary/80 transition-colors hover:text-primary/100"
          >
            Pricing
          </Link>
          <span className="mx-2">·</span>
          <Link
            target="_blank"
            href={EXTERNAL_LINKS.TERMS_OF_SERVICE}
            className="text-sm text-primary/80 transition-colors hover:text-primary/100"
          >
            이용약관
          </Link>
          <span className="mx-2">·</span>
          <Link
            target="_blank"
            href={EXTERNAL_LINKS.PRIVACY_POLICY}
            className="text-sm text-primary/80 transition-colors hover:text-primary/100"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
}
