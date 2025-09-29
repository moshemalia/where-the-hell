import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, User, Mail, Phone } from 'lucide-react'
import { useRooms } from '../../hooks/useRooms'
import { useEmployees } from '../../hooks/useEmployees'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import AppFooter from '../common/AppFooter'

export default function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { rooms, floors } = useRooms()
  const { employees: allEmployees } = useEmployees()

  const { employees = [], searchQuery = '', selectedEmployee } = location.state || {}
  const [currentEmployee, setCurrentEmployee] = useState(selectedEmployee || employees[0])
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  const room = useMemo(
    () => rooms.find(r => r.room_id === currentEmployee?.room_id),
    [rooms, currentEmployee]
  )

  const roomsById = useMemo(() => {
    const map = new Map()
    rooms.forEach(r => map.set(r.room_id, r))
    return map
  }, [rooms])

  const currentFloor = useMemo(
    () => floors.find(f => f.floor_number === (room?.floor ?? currentEmployee?.floor)),
    [floors, room, currentEmployee]
  )

  const floorNumber = room?.floor ?? currentEmployee?.floor ?? currentFloor?.floor_number ?? null
  const roomNumber = room?.room_number || currentEmployee?.room_id || null

  const coworkers = useMemo(() => {
    if (!room) return []
    return allEmployees
      .filter(emp => emp.room_id === room.room_id && emp.id !== currentEmployee?.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [allEmployees, room, currentEmployee])

  const departmentMates = useMemo(() => {
    if (!currentEmployee?.department) return []
    return allEmployees
      .filter(emp => emp.department === currentEmployee.department && emp.id !== currentEmployee.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [allEmployees, currentEmployee])

  const sameRoleEmployees = useMemo(() => {
    const role = currentEmployee?.role
    if (!role) return []
    return allEmployees
      .filter(emp => emp.id !== currentEmployee?.id && emp.role === role)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [allEmployees, currentEmployee])

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 768)
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  if (!employees.length && !currentEmployee) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05030f] text-[var(--brand-text)]" dir="rtl">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-brand-muted">לא נמצאו תוצאות.</p>
            <button
              onClick={() => navigate(-1)}
              className="brand-primary px-5 py-2 text-sm font-semibold rounded-xl"
            >
              חזרה ←
            </button>
          </div>
        </main>
        <AppFooter />
      </div>
    )
  }

  const handleSwitchEmployee = (emp) => {
    setCurrentEmployee(emp)
    if (isMobile) {
      setShowMobileDetails(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const toggleMobileDetails = () => setShowMobileDetails(prev => !prev)

  const formatAdministration = value => value || 'לא צויינה'
  const formatValue = value => value || 'לא צויין'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#090523] to-[#04020e] text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1">
        <div className="border-b border-[#2c2457]/60 bg-black/30 backdrop-blur-md">
          <div className="px-4 py-4 flex items-center max-w-6xl mx-auto justify-between text-white">
            <h1 className="text-lg font-semibold tracking-tight">תוצאות עבור "{searchQuery}"</h1>
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-[#3a2d6f]/60 hover:bg-[#1d173c] transition"
            >
              <ArrowRight className="h-5 w-5 text-[#8c3bff]" />
            </button>
          </div>
        </div>

        {currentEmployee && (
          <div className="px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid gap-6 lg:grid-cols-[360px,minmax(0,1fr)]">
                <div className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl font-bold text-white">{currentEmployee.name}</h3>
                      {currentEmployee.name_en && (
                        <p className="text-sm text-brand-muted">{currentEmployee.name_en}</p>
                      )}
                      <p className="mt-3 text-sm font-semibold text-[#ffbe5c]">{roomNumber ? `חדר ${roomNumber}` : 'חדר לא ידוע'} · {floorNumber !== null && floorNumber !== undefined ? `קומה ${floorNumber}` : 'קומה לא ידועה'}</p>
                      <p className="text-brand-muted mt-2">{formatValue(currentEmployee.role)}</p>
                      <p className="text-brand-muted text-sm">
                        {currentEmployee.department || 'ללא מחלקה'}
                        {currentEmployee.administration ? ` · ${currentEmployee.administration}` : ''}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8c3bff] to-[#2cc4ff] flex items-center justify-center shadow-[0_18px_35px_rgba(140,59,255,0.35)]">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {(!isMobile || showMobileDetails) && (
                    <div className="mt-6 space-y-4 text-sm text-brand-muted">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoItem label="תפקיד" value={formatValue(currentEmployee.role)} />
                        <InfoItem label="מחלקה" value={currentEmployee.department || 'לא צויין'} />
                        <InfoItem label="מנהלה" value={formatAdministration(currentEmployee.administration)} />
                        <InfoItem label="קומה" value={floorNumber ?? 'לא ידועה'} />
                        <InfoItem label="שם החדר" value={room?.room_name || 'לא צויין'} />
                        <InfoItem label="מספר החדר" value={roomNumber || 'לא צויין'} />
                        <InfoItem label="סטטוס" value={currentEmployee.is_admin ? 'מנהל מערכת' : 'עובד'} />
                        {currentEmployee.is_admin && (
                          <InfoItem label='דוא"ל מנהל' value={currentEmployee.admin_email || 'לא צויין'} />
                        )}
                      </div>

                      {(currentEmployee.email || currentEmployee.phone_office || currentEmployee.phone_mobile) && (
                        <div className="pt-3 border-t border-[#2d2459]/60 space-y-2">
                          <p className="font-semibold text-white">פרטי קשר</p>
                          {currentEmployee.email && (
                            <p className="flex items-center gap-2 justify-end text-brand-muted">
                              <Mail className="h-4 w-4 text-[#8c3bff]" /> {currentEmployee.email}
                            </p>
                          )}
                          {currentEmployee.phone_office && (
                            <p className="flex items-center gap-2 justify-end text-brand-muted">
                              <Phone className="h-4 w-4 text-[#5b6cff]" /> טלפון משרד: {currentEmployee.phone_office}
                            </p>
                          )}
                          {currentEmployee.phone_mobile && (
                            <p className="flex items-center gap-2 justify-end text-brand-muted">
                              <Phone className="h-4 w-4 text-[#2cc4ff]" /> טלפון נייד: {currentEmployee.phone_mobile}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isMobile && (
                    <div className="mt-4">
                      <button
                        onClick={toggleMobileDetails}
                        className="w-full px-4 py-2 rounded-2xl border border-[#3b2f70]/60 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
                      >
                        {showMobileDetails ? 'הסתר פרטי העובד' : 'הצג את כל פרטי העובד'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="surface-card-alt rounded-3xl p-4 border border-[#342a63]/60">
                  {currentFloor && room ? (
                    <TransformWrapper
                      initialScale={1}
                      minScale={0.6}
                      maxScale={4}
                      wheel={{ step: 0.12 }}
                      doubleClick={{ disabled: true }}
                    >
                      <TransformComponent>
                        <div className="relative w-full">
                          <img
                            src={currentFloor.image_url}
                            alt={currentFloor.floor_name || `קומה ${currentFloor.floor_number}`}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl border border-[#3f3278]/40"
                            style={{ cursor: 'grab' }}
                          />
                          <div className="absolute inset-0 pointer-events-none">
                            <div
                              className="absolute transform -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${room.x}%`, top: `${room.y}%` }}
                            >
                              <div className="bg-gradient-to-br from-[#ff427b] to-[#c819ff] text-white rounded-full w-6 h-6 text-[10px] flex items-center justify-center shadow-[0_10px_25px_rgba(200,25,255,0.45)] sm:w-8 sm:h-8 sm:text-xs">
                                <MapPin className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TransformComponent>
                    </TransformWrapper>
                  ) : (
                    <div className="h-[360px] lg:h-[640px] flex items-center justify-center text-brand-muted">
                      <p>מיקום החדר אינו זמין.</p>
                    </div>
                  )}
                </div>
              </div>

              {(coworkers.length > 0 || departmentMates.length > 0) && (
                <div className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 space-y-6">
                  {coworkers.length > 0 && (
                    <SectionList
                      title="שותפים לחדר"
                      employees={coworkers}
                      onSelect={handleSwitchEmployee}
                      roomsById={roomsById}
                      variant="room"
                    />
                  )}

                  {departmentMates.length > 0 && (
                    <SectionList
                      title="עובדים נוספים במחלקה"
                      employees={departmentMates}
                      onSelect={handleSwitchEmployee}
                      roomsById={roomsById}
                      variant="department"
                    />
                  )}
                </div>
              )}

              {sameRoleEmployees.length > 0 && (
                <div className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60">
                  <h3 className="text-md font-semibold text-white mb-4">עמיתים באותו תפקיד</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sameRoleEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleSwitchEmployee(emp)}
                        className="text-right p-4 rounded-2xl border border-[#3c2f71]/60 bg-[#161335] hover:bg-[#221c47] transition flex flex-col"
                      >
                        <span className="font-medium text-white">{emp.name}</span>
                        {emp.name_en && <span className="text-xs text-brand-muted">{emp.name_en}</span>}
                        <span className="text-xs text-brand-muted mt-1">{emp.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-muted">{label}</p>
      <p className="text-sm text-white mt-1">{value}</p>
    </div>
  )
}

function SectionList({ title, employees, onSelect, roomsById, variant }) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-white text-sm">{title}</p>
      <div className="space-y-2">
        {employees.map(emp => {
          const mateRoom = emp.room_id ? roomsById.get(emp.room_id) : null
          return (
            <button
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`w-full text-right px-4 py-3 rounded-2xl border transition flex flex-col ${
                variant === 'department'
                  ? 'border-[#3a2f71]/60 bg-[#131232] hover:bg-[#1e1a45]'
                  : 'border-[#352a66]/60 bg-[#141335] hover:bg-[#1f1a44]'
              }`}
            >
              <span className="font-medium text-white">{emp.name}</span>
              {emp.name_en && (
                <span className="text-xs text-brand-muted">{emp.name_en}</span>
              )}
              <span className="text-xs text-brand-muted mt-1">
                {variant === 'department'
                  ? `חדר ${mateRoom?.room_number || 'לא צויין'}`
                  : emp.role}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}





