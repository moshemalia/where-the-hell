import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/constants'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t border-[#2b2354]/60 bg-black/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-right" dir="rtl">
        <div className="text-sm text-brand-muted">
          © {year} משה מליה פתרונות טכנולוגים. כל הזכויות שמורות.
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link to={ROUTES.HOME} className="text-brand-muted hover:text-white transition">
            דף הבית
          </Link>
          <Link to={ROUTES.CONTACT} className="text-brand-muted hover:text-white transition">
            צור קשר
          </Link>
        </div>
      </div>
    </footer>
  )
}
