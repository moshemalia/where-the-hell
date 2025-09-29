import { Users, MapPin, Building, Mail, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEmployees } from '../../hooks/useEmployees'
import { useRooms } from '../../hooks/useRooms'
import AppFooter from '../common/AppFooter'

const statsConfig = (
  employeesCount,
  roomsCount,
  floorsCount
) => ([
  {
    title: 'עובדים',
    value: employeesCount,
    icon: Users,
    color: 'from-[#8c3bff] to-[#5b6cff]',
    path: '/admin/employees'
  },
  {
    title: 'חדרים',
    value: roomsCount,
    icon: MapPin,
    color: 'from-[#5b6cff] to-[#2cc4ff]',
    path: '/admin/maps'
  },
  {
    title: 'קומות',
    value: floorsCount,
    icon: Building,
    color: 'from-[#ff52d9] to-[#8c3bff]',
    path: '/admin/maps'
  },
  {
    title: 'הודעות',
    value: 0,
    icon: Mail,
    color: 'from-[#2cc4ff] to-[#5b6cff]',
    path: '/admin/messages'
  }
])

export default function Dashboard() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { rooms, floors, loading: roomsLoading } = useRooms()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const isLoading = employeesLoading || roomsLoading
  const cards = statsConfig(employees.length, rooms.length, floors.length)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#0a0526] to-[#05030f] text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1">
        <div className="border-b border-[#2c2457]/60 bg-black/40 backdrop-blur">
          <div className="px-4 py-4 flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white">לוח הניהול</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#3a2d6f]/60 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
            >
              <span>התנתקות</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-10 max-w-6xl mx-auto space-y-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => {
              const IconComponent = card.icon
              return (
                <button
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  className="rounded-3xl overflow-hidden border border-[#31275f]/60 bg-[#11102b] hover:bg-[#171338] transition shadow-[0_25px_55px_rgba(10,7,30,0.55)] text-right"
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${card.color}`} />
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-brand-muted text-xs uppercase tracking-[0.3em]">{card.title}</p>
                      <p className="text-3xl font-bold text-white mt-2">{isLoading ? '…' : card.value}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#161335] border border-[#3a2d6f]/60">
                      <IconComponent className="h-6 w-6 text-[#8c3bff]" />
                    </div>
                  </div>
                </button>
              )
            })}
          </section>

          <section className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 shadow-[0_25px_60px_rgba(12,8,38,0.55)]">
            <h2 className="text-lg font-semibold text-white mb-4">קיצורי ניהול</h2>
            <div className="grid grid-cols-1 gap-4">
              <ShortcutButton
                label="ניהול עובדים"
                icon={Users}
                onClick={() => navigate('/admin/employees')}
              />
              <ShortcutButton
                label="ניהול מפות וחדרים"
                icon={MapPin}
                onClick={() => navigate('/admin/maps')}
              />
              <ShortcutButton
                label="ניהול הודעות (בקרוב)"
                icon={Mail}
                onClick={() => navigate('/admin/messages')}
                disabled
              />
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

function ShortcutButton({ label, icon, onClick, disabled }) {
  const Icon = icon
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between p-4 rounded-2xl border border-[#352a66]/60 bg-[#141335] transition ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#1f1a45]'
      }`}
    >
      <Icon className="h-5 w-5 text-[#8c3bff]" />
      <span className="font-medium text-white">{label}</span>
    </button>
  )
}
