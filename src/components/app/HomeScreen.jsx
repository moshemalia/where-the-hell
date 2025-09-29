import React, { useEffect, useRef, useState } from "react"
import { Search, MapPin, Users, User, PhoneCall } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRooms } from '../../hooks/useRooms'
import { useEmployees } from '../../hooks/useEmployees'
import { APP_CONFIG, ROUTES } from '../../lib/constants'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import AppFooter from '../common/AppFooter'

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showRoomDetails, setShowRoomDetails] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const navigate = useNavigate()
  const roomsState = useRooms()
  const employeesState = useEmployees()
  const hideSuggestionsTimeout = useRef(null)

  const isLoading = roomsState.loading || employeesState.loading
  const currentFloor = roomsState.floors.find(f => f.floor_number === selectedFloor)
  const currentRooms = roomsState.rooms.filter(r => r.floor === selectedFloor)

  useEffect(() => {
    if (!roomsState.floors.length) return
    if (!roomsState.floors.some(f => f.floor_number === selectedFloor)) {
      setSelectedFloor(roomsState.floors[0].floor_number)
    }
  }, [roomsState.floors, selectedFloor])

  useEffect(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) {
      setSuggestions([])
      return
    }

    const matches = employeesState.employees
      .filter(emp => {
        const names = [emp.name, emp.name_en]
          .filter(Boolean)
          .map(value => value.toLowerCase())
        return names.some(value => value.includes(normalized))
      })
      .slice(0, 6)

    setSuggestions(matches)
  }, [searchQuery, employeesState.employees])

  const clearHideSuggestions = () => {
    if (hideSuggestionsTimeout.current) {
      clearTimeout(hideSuggestionsTimeout.current)
      hideSuggestionsTimeout.current = null
    }
  }

  const scheduleHideSuggestions = () => {
    clearHideSuggestions()
    hideSuggestionsTimeout.current = setTimeout(() => {
      setSuggestions([])
    }, 150)
  }

  const runSearch = async (term) => {
    const normalized = term.trim()
    if (!normalized) return
    const { data: results } = await employeesState.searchEmployees(normalized)
    if (results.length > 0) {
      navigate(ROUTES.SEARCH_RESULTS, {
        state: {
          employees: results,
          searchQuery: normalized,
          selectedEmployee: results[0]
        }
      })
    } else {
      alert('לא נמצאו תוצאות עם הנתונים שסיפקת.')
    }
  }

  const handleSuggestionSelect = async (employee) => {
    setSearchQuery(employee.name)
    setSuggestions([])
    await runSearch(employee.name)
  }


  const handleRoomClick = (room) => {
    const roomEmployees = employeesState.employees.filter(emp => emp.room_id === room.room_id)
    setShowRoomDetails({ room, employees: roomEmployees })
  }

  const handleSwitchFromRoom = (employee) => {
    setShowRoomDetails(null)
    navigate(ROUTES.SEARCH_RESULTS, {
      state: {
        employees: employeesState.employees,
        searchQuery: employee.name,
        selectedEmployee: employee
      }
    })
  }

  const handleEditRoom = (room) => {
    setSelectedRoom(room)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#05030f]" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8c3bff]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-right text-[var(--brand-text)]" dir="rtl">
      <main className="flex-1">
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_10%,rgba(140,59,255,0.25),transparent_50%)]" />
          <div className="max-w-6xl mx-auto px-4 py-10 relative space-y-10">
            <header className="surface-card rounded-3xl px-6 py-8 border border-[#2a2357]/60 shadow-[0_25px_60px_rgba(10,8,40,0.55)]">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div>
                  {/* <p className="uppercase text-xs tracking-[0.4em] text-brand-muted">"Eifo" Navigation Suite</p> */}
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_10px_35px_rgba(94,63,255,0.35)]">
                    {APP_CONFIG.APP_NAME}
                  </h1>
                  <p className="mt-2 text-brand-muted max-w-xl">
                    מצאו כל עובד.ת, חדר או מחלקה בלחיצת כפתור.
                  </p>
                </div>
                <button
                  onClick={() => navigate(ROUTES.CONTACT)}
                  className="brand-primary px-6 py-3 flex items-center gap-2 text-sm font-semibold shadow-lg hidden lg:flex"
                >
                  <PhoneCall className="h-4 w-4" />
                  יצירת קשר מהירה
                </button>
              </div>

              <div className="mt-8 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={clearHideSuggestions}
                    onBlur={scheduleHideSuggestions}
                    placeholder="איפה לעזאזל..."
                    className="w-full rounded-2xl bg-[#0f0c28] border border-[#4f46ad]/40 text-base text-white px-12 py-4 focus:outline-none focus:ring-2 focus:ring-[#8c3bff] transition"
                  />
                  <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8c3bff]" />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute w-full mt-2 surface-card-alt rounded-2xl border border-[#3b316f]/60 overflow-hidden shadow-xl z-30">
                    {suggestions.map(emp => (
                      <button
                        key={emp.id}
                        onMouseDown={() => handleSuggestionSelect(emp)}
                        className="w-full text-right px-4 py-3 hover:bg-[#201c3f] transition flex flex-col"
                      >
                        <span className="font-medium text-white">{emp.name}</span>
                        <span className="text-xs text-brand-muted">{emp.role}{emp.department ? ` · ${emp.department}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
              <div className="surface-card-alt rounded-3xl p-4 border border-[#31285f]/60">
                {currentFloor ? (
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
                          alt={currentFloor.floor_name || `קומה ${selectedFloor}`}
                          className="w-full h-auto max-h-[70vh] object-contain rounded-2xl border border-[#3f3278]/40"
                          style={{ cursor: 'grab' }}
                        />
                        <div className="absolute inset-0">
                          {currentRooms.map(room => (
                            <div
                              key={room.room_id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                              style={{ left: `${room.x}%`, top: `${room.y}%` }}
                            >
                              <div
                                className="bg-gradient-to-br from-[#ff427b] to-[#c819ff] text-white rounded-full w-6 h-6 text-[10px] font-bold flex items-center justify-center shadow-[0_10px_25px_rgba(200,25,255,0.45)] cursor-pointer sm:w-8 sm:h-8 sm:text-xs"
                                onClick={() => handleRoomClick(room)}
                                onDoubleClick={() => handleEditRoom(room)}
                              >
                                {room.room_number}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TransformComponent>
                  </TransformWrapper>
                ) : (
                  <div className="h-[360px] lg:h-[640px] flex flex-col items-center justify-center text-brand-muted">
                    <MapPin className="h-10 w-10 mb-3 text-[#8c3bff]" />
                    <p>לא נטענה מפה עבור הקומה הנבחרת.</p>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="surface-card rounded-3xl p-6 border border-[#322768]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-brand-muted text-sm">דילוג בין קומות</p>
                      <h3 className="text-2xl font-bold text-white">קומה {selectedFloor}</h3>
                    </div>
                    <MapPin className="h-6 w-6 text-[#8c3bff]" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    {roomsState.floors.map(floor => (
                      <button
                        key={floor.floor_number}
                        onClick={() => setSelectedFloor(floor.floor_number)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition border border-[#3d3274]/60 ${
                          floor.floor_number === selectedFloor
                            ? 'bg-[#8c3bff] text-white shadow-[0_12px_24px_rgba(140,59,255,0.35)]'
                            : 'bg-[#161235] text-brand-muted hover:text-white hover:bg-[#211b4b]'
                        }`}
                      >
                        {floor.floor_name || `קומה ${floor.floor_number}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="surface-card rounded-3xl p-6 border border-[#322768]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-brand-muted text-sm">מספר חדרים בקומה</p>
                      <h3 className="text-3xl font-bold text-white">{currentRooms.length}</h3>
                    </div>
                    <MapPin className="h-6 w-6 text-[#5b6cff]" />
                  </div>
                </div>

                <div className="surface-card rounded-3xl p-6 border border-[#322768]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-brand-muted text-sm">סה"כ עובדים במערכת</p>
                      <h3 className="text-3xl font-bold text-white">{employeesState.employees.length}</h3>
                    </div>
                    <Users className="h-6 w-6 text-[#ff52d9]" />
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </div>
      </main>

        <div className="px-4 mt-10 lg:hidden">
          <button
            onClick={() => navigate(ROUTES.CONTACT)}
            className="brand-primary w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
          >
            <PhoneCall className="h-4 w-4" />
            יצירת קשר מהירה
          </button>
        </div>

      <AppFooter />

      {showRoomDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="surface-card max-w-sm w-full rounded-3xl p-6 border border-[#3a2d6f]/60">
            <div className="border-b border-[#2b2354]/60 pb-3 mb-4">
              <h3 className="text-xl font-bold text-white">{showRoomDetails.room.room_name}</h3>
              <p className="text-brand-muted">חדר {showRoomDetails.room.room_number}</p>
            </div>

            <div className="space-y-3 text-sm">
              {showRoomDetails.employees.length > 0 ? (
                showRoomDetails.employees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleSwitchFromRoom(employee)}
                    className="w-full text-right flex items-center justify-between px-4 py-3 bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl hover:bg-[#201c45] transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-9 h-9 bg-gradient-to-br from-[#8c3bff] to-[#5b6cff] rounded-full flex items-center justify-center text-sm font-bold text-white shadow-[0_10px_25px_rgba(140,59,255,0.35)]">
                        {employee.name.charAt(0)}
                      </span>
                      <span className="text-white font-medium">
                        {employee.name}{employee.name_en ? ` (${employee.name_en})` : ''}
                      </span>
                    </span>
                    <User className="h-5 w-5 text-[#8c3bff]" />
                  </button>
                ))
              ) : (
                <p className="text-center text-brand-muted py-6">אין עובדים המשויכים לחדר זה.</p>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowRoomDetails(null)}
                className="w-full px-4 py-3 rounded-2xl border border-[#463b84]/70 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 text-right">
            <h2 className="text-xl font-bold mb-3 text-white">פרטי חדר</h2>
            <div className="space-y-2 text-brand-muted">
              <div>שם: {selectedRoom.room_name}</div>
              <div>מספר: {selectedRoom.room_number}</div>
            </div>
            <button
              className="mt-6 px-6 py-2 rounded-2xl border border-[#463b84]/70 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
              onClick={() => setSelectedRoom(null)}
            >
              סגירה
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
