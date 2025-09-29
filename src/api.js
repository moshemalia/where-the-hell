
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://where-the-hell.onrender.com';



export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
