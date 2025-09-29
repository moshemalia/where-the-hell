// src/hooks/useRooms.js
import { useState, useEffect } from 'react'
import { api } from '../api' // שים לב לנתיב היחסי מ-src/hooks אל src/api.js

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // api() כבר מחזיר JSON, לא Response
      const [floorsData, roomsData] = await Promise.all([
        api('/api/floors'),
        api('/api/rooms'),
      ])
      if (Array.isArray(floorsData)) setFloors(floorsData)
      if (Array.isArray(roomsData)) setRooms(roomsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ---- פעולות על Rooms ----
  const addRoom = async (roomData) => {
    try {
      const data = await api('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const updateRoom = async (roomId, roomData) => {
    try {
      const data = await api(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const deleteRoom = async (roomId) => {
    try {
      const data = await api(`/api/rooms/${roomId}`, { method: 'DELETE' })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // ---- פעולות על Floors ----
  const addFloor = async (floorData) => {
    try {
      const data = await api('/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(floorData),
      })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const updateFloor = async (floorNumber, floorData) => {
    try {
      const data = await api(`/api/floors/${floorNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(floorData),
      })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const deleteFloor = async (floorNumber) => {
    try {
      const data = await api(`/api/floors/${floorNumber}`, { method: 'DELETE' })
      await fetchData()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  return {
    rooms,
    floors,
    loading,
    error,
    refetch: fetchData,
    addRoom,
    updateRoom,
    deleteRoom,
    addFloor,
    updateFloor,
    deleteFloor,
  }
}
