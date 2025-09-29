// src/lib/auth.js
export const AUTH_KEY = 'where-the-hell:admin';

export function setAdminSession(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    id: user.id, email: user.email, name: user.name, ts: Date.now()
  }));
}

export function getAdminSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(AUTH_KEY);
}
