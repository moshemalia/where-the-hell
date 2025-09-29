import { useMemo, useState } from 'react'
import { useEmployees } from '../../hooks/useEmployees'
import AppFooter from '../common/AppFooter'
import { APP_CONFIG } from '../../lib/constants'

export default function Contact() {
  const { employees } = useEmployees()
  const [message, setMessage] = useState('')

  const adminPhone = useMemo(() => {
    const admin = employees.find(emp => emp.is_admin && emp.phone_mobile)
    if (!admin) return null
    return admin.phone_mobile.replace(/[^0-9+]/g, '')
  }, [employees])

  const handleSend = () => {
    const fallback = '0501234567'
    const raw = (adminPhone || fallback).replace(/[^0-9+]/g, '')
    let formatted = raw
    if (formatted.startsWith('+')) {
      formatted = formatted.slice(1)
    } else if (formatted.startsWith('0')) {
      formatted = `972${formatted.slice(1)}`
    }
    const finalMessage = message.trim() || `שלום, יש לי שאלה לגבי "${APP_CONFIG.APP_NAME}"`
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(finalMessage)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#090523] to-[#05030f] text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
          <header className="surface-card rounded-3xl p-8 border border-[#3a2d6f]/60 shadow-[0_25px_55px_rgba(10,8,40,0.55)]">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">צור קשר</p>
            <h1 className="text-4xl font-black text-white mt-2">בואו נדבר בוואטסאפ</h1>
            <p className="mt-4 text-brand-muted">
              יש לכם שאלה, בקשה לשינוי או תמיכה טכנית? שלחו הודעה דרך וואטסאפ ונחזור אליכם בהקדם.
            </p>
          </header>

          <section className="surface-card rounded-3xl p-8 border border-[#3a2d6f]/60 space-y-6">
            <div>
              <label className="block text-sm text-brand-muted mb-2">הודעה</label>
              <textarea
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="כתבו לנו כל מה שעל ליבכם..."
                className="w-full bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              />
            </div>

            <div className="flex items-center justify-between text-sm text-brand-muted">
              <div>
                <p className="font-semibold text-white">מספר הוואטסאפ של מנהל המערכת</p>
                <p>{adminPhone || '050-123-4567 (ברירת מחדל)'}</p>
              </div>
            </div>

            <button
              onClick={handleSend}
              className="brand-primary px-6 py-3 text-sm font-semibold rounded-2xl self-start"
            >
              שלחו הודעת וואטסאפ
            </button>
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
