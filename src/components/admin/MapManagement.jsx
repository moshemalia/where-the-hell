import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Plus, Edit2, Trash2, Save, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRooms } from '../../hooks/useRooms'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import AppFooter from '../common/AppFooter'

export default function MapManagement() {
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [newRoomPosition, setNewRoomPosition] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [roomForm, setRoomForm] = useState({ room_name: '', room_number: '' })
  const [draggingRoomId, setDraggingRoomId] = useState(null)
  const [draggingPosition, setDraggingPosition] = useState(null)
  const [floorNameEdit, setFloorNameEdit] = useState('')
  const [newFloorForm, setNewFloorForm] = useState({ number: '', name: '', imageUrl: '', cloneFrom: '' })

  const navigate = useNavigate()
  const { rooms, floors, loading, addRoom, updateRoom, deleteRoom, addFloor, updateFloor, deleteFloor } = useRooms()

  const mapContainerRef = useRef(null)
  const activePointerIdRef = useRef(null)

  const currentFloor = useMemo(
    () => floors.find(f => f.floor_number === selectedFloor),
    [floors, selectedFloor]
  )

  const currentRooms = useMemo(
    () => rooms.filter(r => r.floor === selectedFloor),
    [rooms, selectedFloor]
  )

  useEffect(() => {
    if (!floors.length) return
    if (!floors.some(f => f.floor_number === selectedFloor)) {
      setSelectedFloor(floors[0].floor_number)
    }
  }, [floors, selectedFloor])

  useEffect(() => {
    setFloorNameEdit(currentFloor?.floor_name || '')
  }, [currentFloor])

  const handleImageClick = (e) => {
    if (editingRoom || showRoomForm || draggingRoomId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewRoomPosition({ x, y })
    setShowRoomForm(true)
  }

  const closeForm = () => {
    setShowRoomForm(false)
    setEditingRoom(null)
    setNewRoomPosition(null)
    setRoomForm({ room_name: '', room_number: '' })
  }

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    if (!roomForm.room_name.trim() || !roomForm.room_number.trim()) {
      alert('יש להזין שם ומספר לחדר')
      return
    }

    const payload = {
      room_name: roomForm.room_name,
      room_number: roomForm.room_number,
      floor: selectedFloor,
      x: editingRoom ? editingRoom.x : newRoomPosition?.x,
      y: editingRoom ? editingRoom.y : newRoomPosition?.y
    }

    try {
      if (editingRoom) {
        const { error } = await updateRoom(editingRoom.room_id, payload)
        if (error) throw error
        alert('החדר עודכן בהצלחה!')
      } else {
        if (!newRoomPosition) return
        const { error } = await addRoom(payload)
        if (error) throw error
        alert('החדר נוסף בהצלחה!')
      }
    } catch (err) {
      alert(err?.error || 'אירעה שגיאה בשמירת הנתונים. אנא נסו שוב.')
    }

    closeForm()
  }

  const handleEditRoom = (room) => {
    setEditingRoom(room)
    setRoomForm({ room_name: room.room_name, room_number: room.room_number })
    setShowRoomForm(true)
  }

  const handleמחיקהRoom = async (roomId) => {
    if (window.confirm('למחוק את החדר?')) {
      try {
        const { error } = await deleteRoom(roomId)
        if (error) throw error
        alert('החדר נמחק בהצלחה!')
      } catch (err) {
        alert(err?.error || 'אירעה שגיאה במחיקת החדר.')
      }
    }
  }

  const handleUpdateFloorImage = async () => {
    if (!imageUrl.trim()) {
      alert('יש להזין כתובת תמונה תקינה.')
      return
    }

    try {
      const { error } = await updateFloor(selectedFloor, { image_url: imageUrl.trim() })
      if (error) throw error
      setImageUrl('')
      alert('תמונת הקומה עודכנה בהצלחה!')
    } catch (err) {
      alert(err?.error || 'אירעה שגיאה בעדכון תמונת הקומה.')
    }
  }

  const handleSaveFloorName = async () => {
    if (!floorNameEdit.trim()) {
      alert('יש להזין שם לקומה')
      return
    }
    try {
      const { error } = await updateFloor(selectedFloor, { floor_name: floorNameEdit.trim() })
      if (error) throw error
      alert('שם הקומה נשמר')
    } catch (err) {
      alert(err?.error || 'לא ניתן לעדכן את שם הקומה')
    }
  }

  const handleהוספהFloor = async () => {
    if (!newFloorForm.number.trim() || Number.isNaN(Number(newFloorForm.number))) {
      alert('יש להזין מספר קומה')
      return
    }
    if (!newFloorForm.name.trim()) {
      alert('יש להזין שם לקומה')
      return
    }

    try {
      const payload = {
        floor_number: Number(newFloorForm.number),
        floor_name: newFloorForm.name.trim(),
        image_url: newFloorForm.imageUrl.trim() || undefined,
        clone_from: newFloorForm.cloneFrom ? Number(newFloorForm.cloneFrom) : undefined
      }
      const { error } = await addFloor(payload)
      if (error) throw error
      setNewFloorForm({ number: '', name: '', imageUrl: '', cloneFrom: '' })
      setSelectedFloor(Number(payload.floor_number))
      alert('הקומה נוספה בהצלחה!')
    } catch (err) {
      alert(err?.error || 'לא ניתן ליצור קומה')
    }
  }

  const handleמחיקהFloor = async (floorNumber) => {
    if (floors.length === 1) {
      alert('לא ניתן למחוק את הקומה היחידה')
      return
    }
    if (!window.confirm('למחוק את הקומה? כל החדרים בקומה זו יוסרו.')) {
      return
    }
    try {
      const { error } = await deleteFloor(floorNumber)
      if (error) throw error
      alert('הקומה נמחקה בהצלחה!')
    } catch (err) {
      alert(err?.error || 'לא ניתן למחוק את הקומה')
    }
  }

  const handleMarkerPointerDown = (event, room) => {
    if (showRoomForm) return

    event.preventDefault()
    event.stopPropagation()

    if (!mapContainerRef.current) return

    let currentPosition = { x: room.x, y: room.y }

    setDraggingRoomId(room.room_id)
    setDraggingPosition(currentPosition)
    activePointerIdRef.current = event.pointerId

    const updatePositionFromEvent = (clientX, clientY) => {
      const rect = mapContainerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return

      const rawX = ((clientX - rect.left) / rect.width) * 100
      const rawY = ((clientY - rect.top) / rect.height) * 100

      const nextPosition = {
        x: Math.min(100, Math.max(0, rawX)),
        y: Math.min(100, Math.max(0, rawY))
      }

      currentPosition = nextPosition
      setDraggingPosition(nextPosition)
    }

    updatePositionFromEvent(event.clientX, event.clientY)

    const handleMove = (moveEvent) => {
      if (activePointerIdRef.current !== null && moveEvent.pointerId !== activePointerIdRef.current) return
      moveEvent.preventDefault()
      updatePositionFromEvent(moveEvent.clientX, moveEvent.clientY)
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleביטול)
      activePointerIdRef.current = null
    }

    const finishDrag = async () => {
      try {
        const { error } = await updateRoom(room.room_id, {
          x: currentPosition.x,
          y: currentPosition.y
        })
        if (error) throw error
      } catch (err) {
        alert(err?.error || 'לא ניתן לעדכן את מיקום החדר. אנא נסו שוב.')
      } finally {
        setDraggingRoomId(null)
        setDraggingPosition(null)
      }
    }

    const handleUp = (upEvent) => {
      if (activePointerIdRef.current !== null && upEvent.pointerId !== activePointerIdRef.current) return
      upEvent.preventDefault()
      cleanup()
      finishDrag()
    }

    const handleביטול = (cancelEvent) => {
      if (activePointerIdRef.current !== null && cancelEvent.pointerId !== activePointerIdRef.current) return
      cancelEvent.preventDefault()
      cleanup()
      setDraggingRoomId(null)
      setDraggingPosition(null)
    }

    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleביטול)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#090523] to-[#05030f] text-[var(--brand-text)]">
      <div className="surface-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-[#161335] rounded-full"
              title="Back to dashboard"
            >
              <ArrowRight className="h-5 w-5 text-brand-muted rotate-180" />
            </button>
            <h1 className="text-xl font-bold text-white">ניהול מפות</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="surface-card border border-[#3a2d6f]/60 rounded-lg p-4 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 flex flex-wrap gap-2">
              {floors.map((floor) => (
                <div key={floor.floor_number} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFloor(floor.floor_number)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFloor === floor.floor_number
                        ? 'bg-gradient-to-r from-[#8c3bff] to-[#5b6cff] text-white shadow-[0_12px_25px_rgba(140,59,255,0.35)]'
                        : 'bg-[#161335] text-brand-muted hover:text-white hover:bg-[#201c45]'
                    }`}
                  >
                    {floor.floor_name || `Floor ${floor.floor_number}`}
                  </button>
                  <button
                    className="text-xs text-[#ff6fa5] hover:text-[#ff92bf]"
                    onClick={() => handleמחיקהFloor(floor.floor_number)}
                    title="מחיקת קומה"
                  >
                    מחיקה
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 lg:w-80">
              <label className="text-sm font-medium text-brand-muted">Floor name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={floorNameEdit}
                  onChange={e => setFloorNameEdit(e.target.value)}
                  placeholder="Enter floor name"
                  className="flex-1 px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSaveFloorName}
                  className="brand-primary text-white font-medium py-2 px-4 rounded-lg"
                >
                  שמירה
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-brand-muted">Update image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={`קישור לתמונה חדשה for floor ${selectedFloor}`}
                  className="w-full px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleUpdateFloorImage}
                disabled={!imageUrl.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                שמירה
              </button>
            </div>

            <div className="border border-[#3a2d6f]/60 rounded-lg p-3">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Copy className="h-4 w-4" /> שכפול או הוספת קומה
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min="-10"
                  value={newFloorForm.number}
                  onChange={e => setNewFloorForm(prev => ({ ...prev, number: e.target.value }))}
                  className="px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Floor number"
                />
                <input
                  type="text"
                  value={newFloorForm.name}
                  onChange={e => setNewFloorForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Floor name"
                />
                <input
                  type="url"
                  value={newFloorForm.imageUrl}
                  onChange={e => setNewFloorForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional image URL"
                />
                <select
                  value={newFloorForm.cloneFrom}
                  onChange={e => setNewFloorForm(prev => ({ ...prev, cloneFrom: e.target.value }))}
                  className="px-3 py-2 border border-[#3a2d6f]/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No clone</option>
                  {floors.map(f => (
                    <option key={f.floor_number} value={f.floor_number}>
                      שכפול מקומה {f.floor_name || `Floor ${f.floor_number}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleהוספהFloor}
                className="mt-3 w-full brand-primary text-white font-medium py-2 px-4 rounded-lg"
              >
                הוספה floor
              </button>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-3xl border border-[#3a2d6f]/60 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-white">{currentFloor?.floor_name || `Floor ${selectedFloor}`}</h3>
            <p className="text-sm text-brand-muted">
              לחצו על המפה כדי להוסיף חדר חדש, גררו סמנים למיקום מדויק והשתמשו בגלגלת או במחוות צביטה לצורך זום.
            </p>
          </div>

          <div className="relative">
            {loading ? (
              <div className="h-[360px] lg:h-[640px] flex items-center justify-center text-brand-muted">טוען מפה...</div>
            ) : currentFloor && currentFloor.image_url ? (
              <div className="w-full">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ disabled: true }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="absolute left-1/2 -translate-x-1/2 top-3 z-20 hidden gap-2 rounded-full bg-white/80 px-3 py-1 text-sm text-[#8c3bff] shadow-sm lg:flex">
                        <button onClick={zoomIn}>הגדלה</button>
                        <span className="text-brand-muted">|</span>
                        <button onClick={zoomOut}>הקטנה</button>
                        <span className="text-brand-muted">|</span>
                        <button onClick={resetTransform}>איפוס</button>
                      </div>
                      <TransformComponent>
                        <div
                          ref={mapContainerRef}
                          className="relative w-full min-h-[360px] lg:min-h-[640px]"
                          onClick={handleImageClick}
                        >
                          <img
                            src={currentFloor.image_url}
                            alt={`Floor ${selectedFloor}`}
                            className="w-full h-full object-contain"
                            style={{ cursor: showRoomForm ? 'default' : 'crosshair' }}
                          />
                          {currentRooms.map((room) => {
                            const isDragging = draggingRoomId === room.room_id
                            const markerPosition = isDragging && draggingPosition
                              ? draggingPosition
                              : { x: room.x, y: room.y }

                            return (
                              <div
                                key={room.room_id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                style={{
                                  left: `${markerPosition.x}%`,
                                  top: `${markerPosition.y}%`
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <div
                                  className={`bg-gradient-to-br from-[#ff427b] to-[#c819ff] text-white rounded-full w-6 h-6 text-[10px] font-bold flex items-center justify-center shadow-lg cursor-pointer sm:w-8 sm:h-8 sm:text-xs ${isDragging ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                  style={{ touchAction: 'none' }}
                                  onPointerDown={(event) => handleMarkerPointerDown(event, room)}
                                  onDoubleClick={() => handleEditRoom(room)}
                                >
                                  {room.room_number}
                                </div>
                                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {room.room_name}
                                </div>
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex space-x-1 rtl:space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditRoom(room)}
                                    className="bg-gradient-to-br from-[#5b6cff] to-[#2cc4ff] text-white rounded p-1"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleמחיקהRoom(room.room_id)}
                                    className="bg-gradient-to-br from-[#ff427b] to-[#c819ff] text-white rounded p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                          {newRoomPosition && !editingRoom && (
                            <div
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white rounded-full w-6 h-6 text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse sm:w-8 sm:h-8 sm:text-xs"
                              style={{
                                left: `${newRoomPosition.x}%`,
                                top: `${newRoomPosition.y}%`
                              }}
                            >
                              <Plus size={14} />
                            </div>
                          )}
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </div>
            ) : (
              <div className="h-[360px] lg:h-[640px] flex items-center justify-center text-brand-muted">
                <p>No image was provided for this floor. Use the box above to set one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="surface-card rounded-3xl shadow-lg max-w-sm w-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold text-white">
                {editingRoom ? 'עריכת חדר' : 'הוספת חדר חדש'}
              </h3>
              <p className="text-sm text-brand-muted">{currentFloor?.floor_name || `Floor ${selectedFloor}`}</p>
            </div>

            <form onSubmit={handleRoomSubmit} className="p-4 space-y-3">
              <input
                type="text"
                value={roomForm.room_name}
                onChange={(e) => setRoomForm({ ...roomForm, room_name: e.target.value })}
                placeholder="שם החדר"
                className="w-full border border-[#3a2d6f]/60 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                value={roomForm.room_number}
                onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                placeholder="מספר החדר"
                className="w-full border border-[#3a2d6f]/60 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <div className="flex justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-[#161335] hover:bg-[#1e1a45] text-white rounded-lg py-2"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 brand-primary text-white rounded-lg py-2"
                >
                  {editingRoom ? 'שמירה' : 'הוספה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AppFooter />
    </div>
  )
}




