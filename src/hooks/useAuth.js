import { api } from '../api';

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'where-the-hell-auth'

let currentUser = null
const subscribers = new Set()

const hydrateFromStorage = () => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

if (typeof window !== 'undefined') {
  const stored = hydrateFromStorage()
  if (stored) {
    currentUser = stored
  }
}

const notify = () => {
  for (const subscriber of subscribers) {
    subscriber(currentUser)
  }
}

export function useAuth() {
  const [user, setUser] = useState(currentUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const update = (nextUser) => setUser(nextUser)
    subscribers.add(update)

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        currentUser = hydrateFromStorage()
        update(currentUser)
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      subscribers.delete(update)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    try {
      if (!email || !password) {
        return { error: 'Email and password are required.' }
      }
      const res = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Invalid credentials' }))
        return { error: err.error || 'Invalid credentials' }
      }
      const data = await res.json()
      currentUser = { id: data.id, email: data.email, name: data.name }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
      }
      notify()
      return { error: null }
    } catch {
      return { error: 'Unable to sign in. Please try again.' }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    currentUser = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    notify()
    return { error: null }
  }, [])

  return {
    user,
    loading,
    signIn,
    signOut
  }
}

