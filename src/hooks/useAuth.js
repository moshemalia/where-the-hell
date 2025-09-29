// src/hooks/useAuth.js
import { api } from '../api'
import { useCallback, useEffect, useState } from 'react'

// מפתח יחיד ועקבי לאחסון ה-session
const STORAGE_KEY = 'wth_admin_v1'

// --- אחסון/שליפה מ-localStorage ---
function readUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeUser(user) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function clearUserStorage() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

// --- מנוי גלובלי לשינויים (בין קומפוננטים/טאבים) ---
let currentUser = readUser()
const subscribers = new Set()
function notify() {
  for (const fn of subscribers) fn(currentUser)
}

export function useAuth() {
  // נטען בתחילה ממצב גלובלי, אך נסמן loading עד הידרציה ראשונית
  const [user, setUser] = useState(currentUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // הידרציה ראשונית + סיום loading
    currentUser = readUser()
    setUser(currentUser)
    setLoading(false)

    // רישום למערכת המנויים
    const sub = (u) => setUser(u)
    subscribers.add(sub)

    // סנכרון בין טאבים
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        currentUser = readUser()
        setUser(currentUser)
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      subscribers.delete(sub)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // התחברות
  const signIn = useCallback(async (email, password) => {
    if (!email || !password) return { error: 'Email and password are required.' }
    setLoading(true)
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Invalid credentials' }))
        return { error: err?.error || 'Invalid credentials' }
      }
      const data = await res.json() // { id, email, name }
      currentUser = { id: data.id, email: data.email, name: data.name }
      writeUser(currentUser)
      notify()
      return { error: null, user: currentUser }
    } catch {
      return { error: 'Unable to sign in. Please try again.' }
    } finally {
      setLoading(false)
    }
  }, [])

  // התנתקות
  const signOut = useCallback(() => {
    clearUserStorage()
    currentUser = null
    notify()
    return { error: null }
  }, [])

  // החזר גם כ-aliases למקרה שקוד אחר מצפה ל-login/logout
  return {
    user,
    loading,
    signIn,
    signOut,
    login: signIn,
    logout: signOut,
  }
}
