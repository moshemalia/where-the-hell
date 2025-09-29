import { useState, useEffect } from 'react'

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [floorsRes, roomsRes] = await Promise.all([
        fetch('/api/floors'),
        fetch('/api/rooms')
      ])
      const floorsData = await floorsRes.json()
      const roomsData = await roomsRes.json()
      if (Array.isArray(floorsData)) setFloors(floorsData)
      if (Array.isArray(roomsData)) setRooms(roomsData)
    } finally {
      setLoading(false)
    }
  }

  const addRoom = async (roomData) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  const updateRoom = async (roomId, roomData) => {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  const deleteRoom = async (roomId) => {
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  const addFloor = async (floorData) => {
    const res = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floorData)
    })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  const updateFloor = async (floorNumber, floorData) => {
    const res = await fetch(`/api/floors/${floorNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floorData)
    })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  const deleteFloor = async (floorNumber) => {
    const res = await fetch(`/api/floors/${floorNumber}`, { method: 'DELETE' })
    if (res.ok) await fetchData()
    return { data: res.ok ? await res.json().catch(() => ({})) : null, error: res.ok ? null : await res.json() }
  }

  return {
    rooms,
    floors,
    loading,
    refetch: fetchData,
    addRoom,
    updateRoom,
    deleteRoom,
    addFloor,
    updateFloor,
    deleteFloor
  }
}

