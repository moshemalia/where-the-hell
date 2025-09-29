import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// נתונים לדוגמה
export const mockData = {
  floors: [
    { floor_number: 1, image_url: 'https://i.postimg.cc/xd5dm9tR/1.png' },
    { floor_number: 2, image_url: 'https://via.placeholder.com/800x600/f3e5f5/7b1fa2?text=קומה+2' },
    { floor_number: 3, image_url: 'https://via.placeholder.com/800x600/e8f5e8/388e3c?text=קומה+3' }
  ],
  rooms: [
    { room_id: '1', room_name: 'חדר ישיבות מרכזי', room_number: '101', floor: 1, x: 25.5, y: 30.2 },
    { room_id: '2', room_name: 'משרד מנהל', room_number: '102', floor: 1, x: 75.0, y: 20.5 },
    { room_id: '3', room_name: 'חדר מחשבים', room_number: '201', floor: 2, x: 40.3, y: 60.8 },
    { room_id: '4', room_name: 'מעבדה', room_number: '202', floor: 2, x: 80.1, y: 70.2 },
    { room_id: '5', room_name: 'ספרייה', room_number: '301', floor: 3, x: 50.0, y: 40.0 }
  ],
  employees: [
    { id: '1', name: 'יוסי כהן', role: 'מנהל פרויקטים', department: 'פיתוח', room_id: '1', floor: 1,
      rooms: { room_name: 'חדר ישיבות מרכזי', room_number: '101', x: 25.5, y: 30.2, floor: 1 } },
    { id: '2', name: 'שרה לוי', role: 'מנהלת טכנולוגיות', department: 'טכנולוגיה', room_id: '2', floor: 1,
      rooms: { room_name: 'משרד מנהל', room_number: '102', x: 75.0, y: 20.5, floor: 1 } },
    { id: '3', name: 'דני רוזן', role: 'מפתח תוכנה', department: 'פיתוח', room_id: '3', floor: 2,
      rooms: { room_name: 'חדר מחשבים', room_number: '201', x: 40.3, y: 60.8, floor: 2 } },
    { id: '4', name: 'מיכל אברהם', role: 'חוקרת', department: 'מחקר ופיתוח', room_id: '4', floor: 2,
      rooms: { room_name: 'מעבדה', room_number: '202', x: 80.1, y: 70.2, floor: 2 } }
  ]
}