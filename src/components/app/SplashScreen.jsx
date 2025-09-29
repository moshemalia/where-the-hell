import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG, ROUTES } from '../../lib/constants'
import AppFooter from '../common/AppFooter'

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(ROUTES.HOME)
    }, APP_CONFIG.SPLASH_DURATION)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col bg-[#05030f] text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-8">
          <div className="relative mx-auto w-32 h-32 rounded-[28px] bg-gradient-to-br from-[#8c3bff] via-[#5b6cff] to-[#2cc4ff] flex items-center justify-center shadow-[0_25px_65px_rgba(112,63,255,0.45)]">
            <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_65%)]" />
            <span className="relative text-4xl font-black tracking-[0.45em]">C</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{APP_CONFIG.APP_NAME}</h1>
            <p className="mt-3 text-brand-muted text-lg">מערכת הניווט הפנימית שמכניסה את Controp לכל מסדרון.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-muted text-sm">
            <span className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8c3bff] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-[#8c3bff]"></span>
            </span>
            <span>טוען את החוויה שלך...</span>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
