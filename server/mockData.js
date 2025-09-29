import crypto from 'node:crypto'

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

export const mockData = {
  floors: [
    { floor_number: 1, floor_name: 'קומת קרקע', image_url: 'https://via.placeholder.com/1600x1000/eeeeee/222?text=Floor+1' },
    { floor_number: 2, floor_name: 'קומת משרדים', image_url: 'https://via.placeholder.com/1600x1000/eeeeee/222?text=Floor+2' },
    { floor_number: 3, floor_name: 'קומת הנהלה', image_url: 'https://via.placeholder.com/1600x1000/eeeeee/222?text=Floor+3' }
  ],
  rooms: [
    { room_id: '1', room_name: 'חדר ישיבות A', room_number: '101', floor: 1, x: 25.5, y: 30.2 },
    { room_id: '2', room_name: 'מטבחון', room_number: '102', floor: 1, x: 75.0, y: 20.5 },
    { room_id: '3', room_name: 'חדר ישיבות B', room_number: '201', floor: 2, x: 40.3, y: 60.8 },
    { room_id: '4', room_name: 'לאונג׳', room_number: '202', floor: 2, x: 80.1, y: 70.2 },
    { room_id: '5', room_name: 'מחלקת IT', room_number: '301', floor: 3, x: 50.0, y: 40.0 }
  ],
  employees: [
    {
      id: '1',
      name: 'משה מליה',
      name_en: 'Moshe Malia',
      role: 'מנהל פיתוח',
      department: 'פיתוח',
      administration: 'הנהלה טכנית',
      room_id: '1',
      floor: 1,
      email: 'm.malia017@gmail.com',
      phone_office: '03-5551234',
      phone_mobile: '050-1234567',
      is_active: true,
      is_admin: true,
      admin_email: 'm.malia017@gmail.com',
      admin_password: hash('1234')
    },
    {
      id: '2',
      name: 'בן כהן',
      name_en: 'Ben Cohen',
      role: 'מעצב UX',
      department: 'עיצוב',
      administration: 'סטודיו',
      room_id: '2',
      floor: 1,
      email: 'ben@example.com',
      phone_office: '03-5552345',
      phone_mobile: '052-7654321',
      is_active: true,
      is_admin: false
    },
    {
      id: '3',
      name: 'חן לוי',
      name_en: 'Chen Levi',
      role: 'מנהל מוצר',
      department: 'מוצר',
      administration: 'מנהלת מוצר',
      room_id: '3',
      floor: 2,
      email: 'chen@example.com',
      phone_office: '03-5553456',
      phone_mobile: '054-9876543',
      is_active: true,
      is_admin: false
    },
    {
      id: '4',
      name: 'דנה יוגב',
      name_en: 'Dana Yogev',
      role: 'HR',
      department: 'משאבי אנוש',
      administration: 'מנהלה',
      room_id: '4',
      floor: 2,
      email: 'dana@example.com',
      phone_office: '03-5554567',
      phone_mobile: '058-2468101',
      is_active: true,
      is_admin: false
    }
  ]
}

