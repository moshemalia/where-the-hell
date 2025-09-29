// src/pages/admin/Login.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import AppFooter from '../common/AppFooter'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [uiLoading, setUiLoading] = useState(false)
  const [error, setError] = useState('')

  // מה-hook: user + loading (טעינת session מ-localStorage)
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // אם כבר מחוברים – ננתב לדשבורד (רק אחרי שה-hook סיים להיטען)
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUiLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError('פרטי ההתחברות שגויים. נסו שוב או פנו למנהל המערכת.')
      setUiLoading(false)
      return
    }

    // הניווט יתבצע גם ברגע שה-user יתעדכן ב-hook,
    // אבל ננווט מידית לטובת UX
    navigate('/admin/dashboard', { replace: true })
    setUiLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#090523] to-[#05030f] text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="surface-card rounded-3xl border border-[#3a2d6f]/60 shadow-[0_30px_65px_rgba(10,7,35,0.6)] max-w-md w-full p-8 text-right">
          <div className="text-center mb-8 space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8c3bff] to-[#2cc4ff] flex items-center justify-center shadow-[0_18px_45px_rgba(112,63,255,0.45)]">
              <LogIn className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">כניסת מנהלים</h1>
            <p className="text-brand-muted text-sm">התחברו באמצעות הדוא"ל והסיסמה שקיבלתם ממנהל הטכנולוגיות.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-sm text-brand-muted mb-1">דוא"ל</label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-brand-muted mb-1">סיסמה</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
                  placeholder="הקלידו סיסמה"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white"
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="border border-[#7c244f]/60 bg-[#2d1227] text-[#ff6fa5] px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={uiLoading || authLoading}
              className="w-full brand-primary py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uiLoading || authLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  התחברות
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-brand-muted">
            <p>דוגמה לנתוני בדיקה:</p>
            <p className="font-mono bg-[#161335] border border-[#3a2d6f]/60 px-3 py-2 rounded-xl mt-2">
              admin@example.com / password123
            </p>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
