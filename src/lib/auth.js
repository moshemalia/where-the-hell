// src/lib/auth.js
export const AUTH_KEY = 'wth_admin_v1';

export function loadUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch { return null; }
}

export function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(AUTH_KEY);
}
