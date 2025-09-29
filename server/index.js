import { q } from './libsql.js'; // נתיב יחסי מדויק לפי מיקומו של libsql.js
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import process from 'node:process'
import { XMLParser } from 'fast-xml-parser'


const app = express()
app.use(express.json({ limit: '10mb' }))

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// 1) קורא מ-ENV (רשימה מופרדת בפסיקים) + דיפולטים ללוקאל
const extraAllowed = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// 2) פונקציה שבודקת אם המקור מותר
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl/Postman/healthchecks בלי Origin
  try {
    const u = new URL(origin);
    const host = u.hostname;

    // מותר אם:
    // (א) הוגדר מפורשות ב-ENV
    if (extraAllowed.includes(origin)) return true;

    // (ב) כל תת-דומיין של vercel.app (כולל preview)
    if (host.endsWith('.vercel.app')) return true;

    // (ג) localhost בפיתוח
    if (host === 'localhost' && (u.port === '5173' || u.port === '3000')) return true;

    return false;
  } catch {
    return false;
  }
};

// 3) הפעלת ה-CORS
app.use(cors({
  origin: (origin, cb) => cb(isAllowedOrigin(origin) ? null : new Error('Not allowed by CORS: ' + origin), isAllowedOrigin(origin)),
  credentials: true,
}));




const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

const normalizeText = (value) => (typeof value === 'string' && value.trim().length ? value.trim() : null)
const xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true })
const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

// Floors
app.get('/api/floors', async (req, res) => {
  try {
    const rows = await q('SELECT floor_number, floor_name, image_url FROM floors ORDER BY floor_number;')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})


app.post('/api/floors', (req, res) => {
  const { floor_number, floor_name, image_url, clone_from } = req.body
  if (!floor_number || Number.isNaN(Number(floor_number))) {
    return res.status(400).json({ error: 'floor_number is required' })
  }
  if (!floor_name || !floor_name.trim()) {
    return res.status(400).json({ error: 'floor_name is required' })
  }

  try {
    db.prepare('INSERT INTO floors (floor_number, floor_name, image_url) VALUES (?, ?, ?)')
      .run(Number(floor_number), floor_name.trim(), image_url || null)

    if (clone_from) {
      const roomsToClone = db.prepare('SELECT room_name, room_number, x, y FROM rooms WHERE floor = ?').all(clone_from)
      const imageSource = db.prepare('SELECT image_url FROM floors WHERE floor_number = ?').get(clone_from)
      const insertRoom = db.prepare('INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, ?, ?)')

      const tx = db.transaction(() => {
        if (imageSource?.image_url && !image_url) {
          db.prepare('UPDATE floors SET image_url = ? WHERE floor_number = ?').run(imageSource.image_url, floor_number)
        }
        for (const room of roomsToClone) {
          insertRoom.run(crypto.randomUUID(), room.room_name, room.room_number, floor_number, room.x, room.y)
        }
      })

      tx()
    }

    res.status(201).json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.put('/api/floors/:floor_number', (req, res) => {
  const { floor_number } = req.params
  const { floor_name, image_url } = req.body

  try {
    const result = db.prepare('UPDATE floors SET floor_name = COALESCE(?, floor_name), image_url = COALESCE(?, image_url) WHERE floor_number = ?')
      .run(normalizeText(floor_name), normalizeText(image_url), floor_number)
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Floor not found' })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/floors/:floor_number', (req, res) => {
  const { floor_number } = req.params
  try {
    const roomsOnFloor = db.prepare('SELECT room_id FROM rooms WHERE floor = ?').all(floor_number)
    const roomIds = roomsOnFloor.map(r => r.room_id)

    const tx = db.transaction(() => {
      if (roomIds.length) {
        const placeholders = roomIds.map(() => '?').join(',')
        db.prepare(`UPDATE employees SET room_id = NULL WHERE room_id IN (${placeholders})`).run(...roomIds)
      }
      db.prepare('UPDATE employees SET floor = NULL WHERE floor = ?').run(floor_number)
      db.prepare('DELETE FROM rooms WHERE floor = ?').run(floor_number)
      const result = db.prepare('DELETE FROM floors WHERE floor_number = ?').run(floor_number)
      if (result.changes === 0) {
        throw new Error('Floor not found')
      }
    })

    tx()
    res.json({ ok: true })
  } catch (e) {
    const status = e.message === 'Floor not found' ? 404 : 400
    res.status(status).json({ error: e.message })
  }
})

// Rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rows = await q('SELECT room_id, room_name, room_number, floor, x, y FROM rooms ORDER BY room_number;')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})


app.post('/api/rooms', (req, res) => {
  const { room_id, room_name, room_number, floor, x, y } = req.body
  const normalizedNumber = typeof room_number === 'number' ? String(room_number) : room_number ? String(room_number).trim() : ''
  if (!normalizedNumber) {
    return res.status(400).json({ error: 'room_number is required and must be unique' })
  }
  if (room_id && String(room_id).trim() && String(room_id).trim() !== normalizedNumber) {
    return res.status(400).json({ error: 'room_id must match room_number' })
  }
  const normalizedFloor = typeof floor === 'number' ? floor : floor ? Number(floor) : null
  const normalizedX = typeof x === 'number' ? x : x ? Number(x) : null
  const normalizedY = typeof y === 'number' ? y : y ? Number(y) : null
  try {
    db.prepare('INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, ?, ?)')
      .run(normalizedNumber, normalizeText(room_name), normalizedNumber, normalizedFloor, normalizedX, normalizedY)
    res.status(201).json({ room_id: normalizedNumber })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.put('/api/rooms/:room_id', (req, res) => {
  const { room_id: currentId } = req.params
  const { room_name, room_number, floor, x, y } = req.body
  const normalizedNumber = room_number !== undefined && room_number !== null ? String(room_number).trim() : null
  const normalizedFloor = typeof floor === 'number' ? floor : floor ? Number(floor) : null
  const normalizedX = typeof x === 'number' ? x : x ? Number(x) : null
  const normalizedY = typeof y === 'number' ? y : y ? Number(y) : null
  try {
    const existing = db.prepare('SELECT room_id FROM rooms WHERE room_id = ?').get(currentId)
    if (!existing) {
      return res.status(404).json({ error: 'Room not found' })
    }
    let targetId = existing.room_id
    const tx = db.transaction(() => {
      if (normalizedNumber && normalizedNumber !== existing.room_id) {
        const conflict = db.prepare('SELECT room_id FROM rooms WHERE room_id = ?').get(normalizedNumber)
        if (conflict) {
          throw new Error('room_number already exists')
        }
        db.prepare('UPDATE rooms SET room_id = ?, room_number = ? WHERE room_id = ?')
          .run(normalizedNumber, normalizedNumber, existing.room_id)
        db.prepare('UPDATE employees SET room_id = ? WHERE room_id = ?')
          .run(normalizedNumber, existing.room_id)
        targetId = normalizedNumber
      } else if (normalizedNumber) {
        db.prepare('UPDATE rooms SET room_number = ? WHERE room_id = ?')
          .run(normalizedNumber, existing.room_id)
      }
      db.prepare('UPDATE rooms SET room_name = COALESCE(?, room_name), floor = COALESCE(?, floor), x = COALESCE(?, x), y = COALESCE(?, y) WHERE room_id = ?')
        .run(normalizeText(room_name), normalizedFloor, normalizedX, normalizedY, targetId)
    })
    tx()
    res.json({ ok: true, room_id: targetId })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/rooms/:room_id', (req, res) => {
  const { room_id } = req.params
  try {
    db.prepare('UPDATE employees SET room_id = NULL WHERE room_id = ?').run(room_id)
    db.prepare('DELETE FROM rooms WHERE room_id = ?').run(room_id)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const rows = await q(`
      SELECT id, name, name_en, role, department, administration, room_id, floor, email,
             phone_office, phone_mobile, is_active, is_admin, admin_email
        FROM employees
       WHERE COALESCE(is_active, 1) = 1
       ORDER BY name;
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})


app.get('/api/taxonomy', async (req, res) => {
  try {
    const rolesRows = await q('SELECT name FROM roles ORDER BY name;')
    const deptRows  = await q('SELECT name FROM departments ORDER BY name;')
    res.json({ roles: rolesRows.map(r => r.name), departments: deptRows.map(d => d.name) })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/import/xml', (req, res) => {
  const { xml } = req.body
  if (typeof xml !== 'string' || !xml.trim()) {
    return res.status(400).json({ error: 'XML content is required' })
  }

  let parsed
  try {
    parsed = xmlParser.parse(xml)
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse XML', details: err.message })
  }

  const root = parsed.Import || parsed.import || parsed
  if (typeof root !== 'object' || root === null) {
    return res.status(400).json({ error: 'Unexpected XML structure' })
  }

  const employeesNode = root.Employees || root.employees || {}
  const rolesNode = root.Roles || root.roles || {}
  const departmentsNode = root.Departments || root.departments || {}

  const employeesRaw = ensureArray(employeesNode.Employee ?? employeesNode.employee ?? [])
  const rolesRaw = ensureArray(rolesNode.Role ?? rolesNode.role ?? [])
  const departmentsRaw = ensureArray(departmentsNode.Department ?? departmentsNode.department ?? [])

  const getField = (node, keys) => {
    if (!node || typeof node !== 'object') return undefined
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) return node[key]
      const lower = key.toLowerCase()
      if (Object.prototype.hasOwnProperty.call(node, lower)) return node[lower]
      const camel = key.charAt(0).toLowerCase() + key.slice(1)
      if (Object.prototype.hasOwnProperty.call(node, camel)) return node[camel]
    }
    return undefined
  }

  const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value
    if (value === null || typeof value === 'undefined') return undefined
    const str = String(value).trim().toLowerCase()
    if (!str) return undefined
    if (['1', 'true', 'yes', 'y'].includes(str)) return true
    if (['0', 'false', 'no', 'n'].includes(str)) return false
    return undefined
  }

  const parseNumber = (value) => {
    if (value === null || typeof value === 'undefined') return null
    const num = Number(value)
    return Number.isNaN(num) ? null : num
  }

  const normalizeString = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    if (typeof value === 'number') {
      return String(value)
    }
    return null
  }

  const rolesSet = new Set(rolesRaw.map(value => {
    if (typeof value === 'object') {
      return normalizeString(getField(value, ['Name', 'Value']) ?? Object.values(value)[0])
    }
    return normalizeString(value)
  }).filter(Boolean))

  const departmentsSet = new Set(departmentsRaw.map(value => {
    if (typeof value === 'object') {
      return normalizeString(getField(value, ['Name', 'Value']) ?? Object.values(value)[0])
    }
    return normalizeString(value)
  }).filter(Boolean))

  const selectEmployee = db.prepare('SELECT * FROM employees WHERE id = ?')
  const upsertEmployee = db.prepare(`
    INSERT INTO employees (id, name, name_en, role, department, administration, room_id, floor, email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password)
    VALUES (@id, @name, @name_en, @role, @department, @administration, @room_id, @floor, @email, @phone_office, @phone_mobile, @is_active, @is_admin, @admin_email, @admin_password)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      name_en = excluded.name_en,
      role = excluded.role,
      department = excluded.department,
      administration = excluded.administration,
      room_id = excluded.room_id,
      floor = excluded.floor,
      email = excluded.email,
      phone_office = excluded.phone_office,
      phone_mobile = excluded.phone_mobile,
      is_active = excluded.is_active,
      is_admin = excluded.is_admin,
      admin_email = COALESCE(excluded.admin_email, employees.admin_email),
      admin_password = COALESCE(excluded.admin_password, employees.admin_password)
  `)
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)')
  const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)')
  const upsertRoom = db.prepare(`
    INSERT INTO rooms (room_id, room_name, room_number, floor, x, y)
    VALUES (?, ?, ?, ?, NULL, NULL)
    ON CONFLICT(room_id) DO UPDATE SET
      room_name = COALESCE(excluded.room_name, rooms.room_name),
      room_number = COALESCE(excluded.room_number, rooms.room_number),
      floor = COALESCE(excluded.floor, rooms.floor)
  `)

  let inserted = 0
  let updated = 0

  const tx = db.transaction(() => {
    for (const role of rolesSet) insertRole.run(role)
    for (const department of departmentsSet) insertDepartment.run(department)

    for (const raw of employeesRaw) {
      const idValue = normalizeString(getField(raw, ['EmployeeId', 'EmployeeID', 'Id', 'id']))
      const nameValue = normalizeString(getField(raw, ['Name', 'FullName', 'name']))
      if (!idValue || !nameValue) continue

      const nameEnValue = normalizeString(getField(raw, ['NameEn', 'EnglishName']))
      const roleValue = normalizeString(getField(raw, ['Role']))
      const departmentValue = normalizeString(getField(raw, ['Department']))
      const administrationValue = normalizeString(getField(raw, ['Administration']))
      const roomNumberValue = normalizeString(getField(raw, ['RoomNumber', 'RoomId', 'RoomID']))
      const roomNameValue = normalizeString(getField(raw, ['RoomName']))
      const floorValue = parseNumber(getField(raw, ['Floor']))
      const emailValue = normalizeString(getField(raw, ['Email']))
      const officePhoneValue = normalizeString(getField(raw, ['PhoneOffice', 'OfficePhone']))
      const mobilePhoneValue = normalizeString(getField(raw, ['PhoneMobile', 'MobilePhone']))
      const adminEmailRaw = getField(raw, ['AdminEmail'])
      const adminPasswordValue = normalizeString(getField(raw, ['AdminPassword']))
      const isAdminFlag = parseBoolean(getField(raw, ['IsAdmin']))
      const isActiveFlag = parseBoolean(getField(raw, ['IsActive']))

      if (roleValue) {
        if (!rolesSet.has(roleValue)) insertRole.run(roleValue)
        rolesSet.add(roleValue)
      }
      if (departmentValue) {
        if (!departmentsSet.has(departmentValue)) insertDepartment.run(departmentValue)
        departmentsSet.add(departmentValue)
      }

      if (roomNumberValue) {
        upsertRoom.run(
          roomNumberValue,
          roomNameValue,
          roomNumberValue,
          floorValue,
          null,
          null
        )
      }

      const existing = selectEmployee.get(idValue)
      const payload = {
        id: idValue,
        name: nameValue,
        name_en: nameEnValue,
        role: roleValue,
        department: departmentValue,
        administration: administrationValue,
        room_id: roomNumberValue || null,
        floor: floorValue,
        email: emailValue,
        phone_office: officePhoneValue,
        phone_mobile: mobilePhoneValue,
        is_active: isActiveFlag === undefined ? (existing ? (existing.is_active ?? 1) : 1) : (isActiveFlag ? 1 : 0),
        is_admin: isAdminFlag === undefined ? (existing ? existing.is_admin : 0) : (isAdminFlag ? 1 : 0),
        admin_email: typeof adminEmailRaw === 'undefined' ? null : normalizeString(adminEmailRaw),
        admin_password: adminPasswordValue ? hashPassword(adminPasswordValue) : null
      }

      upsertEmployee.run(payload)
      if (existing) {
        updated += 1
      } else {
        inserted += 1
      }
    }
  })

  tx()

  res.json({ ok: true, summary: { employeesInserted: inserted, employeesUpdated: updated, roles: rolesSet.size, departments: departmentsSet.size } })
})

app.get('/api/export/:table', (req, res) => {
  const table = String(req.params.table || '').toLowerCase()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_')
  const makeFilename = (name) => `${name}-${timestamp}.json`

  try {
    if (table === 'employees') {
      const rows = db.prepare(`
        SELECT id,
               name,
               name_en,
               role,
               department,
               administration,
               room_id,
               floor,
               email,
               phone_office,
               phone_mobile,
               is_active,
               is_admin,
               admin_email,
               admin_password
          FROM employees
         ORDER BY id
      `).all()
      res.setHeader('Content-Disposition', `attachment; filename="${makeFilename('employees')}"`)
      res.type('application/json').send(JSON.stringify(rows, null, 2))
      return
    }

    if (table === 'roles' || table === 'departments') {
      const rows = db.prepare(`SELECT name FROM ${table} ORDER BY name`).all()
      res.setHeader('Content-Disposition', `attachment; filename="${makeFilename(table)}"`)
      res.type('application/json').send(JSON.stringify(rows, null, 2))
      return
    }

    res.status(400).json({ error: 'Unsupported table. Allowed values: employees, roles, departments' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/import/:table', (req, res) => {
  const table = String(req.params.table || '').toLowerCase()
  const payload = Array.isArray(req.body) ? req.body : req.body?.records
  const records = Array.isArray(payload) ? payload : null

  if (!records) {
    return res.status(400).json({ error: 'records array is required' })
  }

  const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value
    if (value === null || typeof value === 'undefined') return undefined
    const str = String(value).trim().toLowerCase()
    if (!str) return undefined
    if (['1', 'true', 'yes', 'y'].includes(str)) return true
    if (['0', 'false', 'no', 'n'].includes(str)) return false
    return undefined
  }

  const normalizeString = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }
    if (typeof value === 'number') {
      return String(value)
    }
    return null
  }

  if (table === 'roles' || table === 'departments') {
    const insert = db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`)
    let inserted = 0
    const tx = db.transaction(() => {
      for (const entry of records) {
        const name = normalizeString(typeof entry === 'object' ? (entry?.name ?? Object.values(entry ?? {})[0]) : entry)
        if (!name) continue
        const result = insert.run(name)
        if (result.changes > 0) inserted += 1
      }
    })
    try {
      tx()
      return res.json({ ok: true, summary: { inserted } })
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  if (table !== 'employees') {
    return res.status(400).json({ error: 'Unsupported table. Allowed values: employees, roles, departments' })
  }

  const selectEmployee = db.prepare('SELECT * FROM employees WHERE id = ?')
  const upsertEmployee = db.prepare(`
    INSERT INTO employees (id, name, name_en, role, department, administration, room_id, floor, email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password)
    VALUES (@id, @name, @name_en, @role, @department, @administration, @room_id, @floor, @email, @phone_office, @phone_mobile, @is_active, @is_admin, @admin_email, @admin_password)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      name_en = excluded.name_en,
      role = excluded.role,
      department = excluded.department,
      administration = excluded.administration,
      room_id = excluded.room_id,
      floor = excluded.floor,
      email = excluded.email,
      phone_office = excluded.phone_office,
      phone_mobile = excluded.phone_mobile,
      is_active = excluded.is_active,
      is_admin = excluded.is_admin,
      admin_email = COALESCE(excluded.admin_email, employees.admin_email),
      admin_password = COALESCE(excluded.admin_password, employees.admin_password)
  `)
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)')
  const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)')
  const ensureRoom = db.prepare(`INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, NULL, NULL)
    ON CONFLICT(room_id) DO UPDATE SET
      room_number = excluded.room_number,
      floor = COALESCE(excluded.floor, rooms.floor),
      room_name = COALESCE(excluded.room_name, rooms.room_name)`)

  let inserted = 0
  let updated = 0

  const tx = db.transaction(() => {
    for (const raw of records) {
      const idValue = normalizeString(raw?.id ?? raw?.employee_id)
      const nameValue = normalizeString(raw?.name)
      if (!idValue || !nameValue) continue

      const roleValue = normalizeString(raw?.role)
      const departmentValue = normalizeString(raw?.department)
      const administrationValue = normalizeString(raw?.administration)
      const roomNumberValue = normalizeString(raw?.room_id ?? raw?.room_number)
      const roomNameValue = normalizeString(raw?.room_name)
      const floorValue = raw?.floor === null || typeof raw?.floor === 'undefined' ? null : Number(raw.floor)
      const emailValue = normalizeString(raw?.email)
      const officePhoneValue = normalizeString(raw?.phone_office)
      const mobilePhoneValue = normalizeString(raw?.phone_mobile)
      const adminEmailValue = normalizeString(raw?.admin_email)
      const isAdminFlag = parseBoolean(raw?.is_admin)
      const isActiveFlag = parseBoolean(raw?.is_active)
      const adminPasswordRaw = normalizeString(raw?.admin_password)

      let adminPasswordValue = null
      if (adminPasswordRaw) {
        if (/^[0-9a-fA-F]{64}$/.test(adminPasswordRaw)) {
          adminPasswordValue = adminPasswordRaw.toLowerCase()
        } else {
          adminPasswordValue = hashPassword(adminPasswordRaw)
        }
      }

      if (roleValue) insertRole.run(roleValue)
      if (departmentValue) insertDepartment.run(departmentValue)

      if (roomNumberValue) {
        const floorNormalized = Number.isNaN(floorValue) ? null : floorValue
        ensureRoom.run(roomNumberValue, roomNameValue, roomNumberValue, floorNormalized)
      }

      const existing = selectEmployee.get(idValue)
      const previousIsActive = existing ? (existing.is_active ?? 1) : 1
      const previousIsAdmin = existing ? existing.is_admin : 0
      const nextIsActive = isActiveFlag === undefined ? previousIsActive : (isActiveFlag ? 1 : 0)
      const nextIsAdmin = isAdminFlag === undefined ? previousIsAdmin : (isAdminFlag ? 1 : 0)
      const nextAdminEmail = nextIsAdmin ? (adminEmailValue ?? existing?.admin_email ?? null) : null
      const nextAdminPassword = nextIsAdmin ? (adminPasswordValue || existing?.admin_password || null) : null

      const payload = {
        id: idValue,
        name: nameValue,
        name_en: normalizeString(raw?.name_en),
        role: roleValue,
        department: departmentValue,
        administration: administrationValue,
        room_id: roomNumberValue || null,
        floor: Number.isNaN(floorValue) ? null : floorValue,
        email: emailValue,
        phone_office: officePhoneValue,
        phone_mobile: mobilePhoneValue,
        is_active: nextIsActive,
        is_admin: nextIsAdmin,
        admin_email: nextAdminEmail,
        admin_password: nextAdminPassword
      }

      upsertEmployee.run(payload)
      if (existing) {
        updated += 1
      } else {
        inserted += 1
      }
    }
  })

  try {
    tx()
    res.json({ ok: true, summary: { employeesInserted: inserted, employeesUpdated: updated } })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/employees', (req, res) => {
  const {
    id,
    name,
    name_en,
    role,
    department,
    administration,
    room_id,
    floor,
    email,
    phone_office,
    phone_mobile,
    is_active,
    is_admin,
    admin_email,
    admin_password
  } = req.body

  try {
    const trimmedId = typeof id === 'number' ? String(id).trim() : id ? String(id).trim() : ''
    if (!trimmedId) {
      return res.status(400).json({ error: 'Employee id is required' })
    }
    const isActive = typeof is_active === 'undefined' ? 1 : (is_active ? 1 : 0)
    const isAdmin = is_admin ? 1 : 0
    const adminEmail = isAdmin ? normalizeText(admin_email) : null
    const adminPassword = isAdmin && admin_password ? hashPassword(admin_password) : null
    const normalizedRoomId = room_id ? String(room_id).trim() || null : null

    db.prepare(`
      INSERT INTO employees (
        id,
        name,
        name_en,
        role,
        department,
        administration,
        room_id,
        floor,
        email,
        phone_office,
        phone_mobile,
        is_active,
        is_admin,
        admin_email,
        admin_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        trimmedId,
        normalizeText(name),
        normalizeText(name_en),
        normalizeText(role),
        normalizeText(department),
        normalizeText(administration),
        normalizedRoomId,
        typeof floor === 'number' ? floor : floor ? Number(floor) : null,
        normalizeText(email),
        normalizeText(phone_office),
        normalizeText(phone_mobile),
        isActive,
        isAdmin,
        adminEmail,
        adminPassword
      )
    res.status(201).json({ id: trimmedId })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params
  const {
    name,
    name_en,
    role,
    department,
    administration,
    room_id,
    floor,
    email,
    phone_office,
    phone_mobile,
    is_active,
    is_admin,
    admin_email,
    admin_password
  } = req.body

  try {
    const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!current) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    const nextIsActive = typeof is_active === 'undefined' ? (current.is_active ?? 1) : (is_active ? 1 : 0)
    const nextIsAdmin = typeof is_admin === 'undefined' ? current.is_admin : (is_admin ? 1 : 0)
    let nextAdminEmail = current.admin_email
    let nextAdminPassword = current.admin_password
    const normalizedRoomId = typeof room_id === 'undefined' ? undefined : (String(room_id).trim().length ? String(room_id).trim() : null)

    if (nextIsAdmin) {
      if (typeof admin_email !== 'undefined') {
        nextAdminEmail = normalizeText(admin_email)
      }
      if (typeof admin_password === 'string' && admin_password.length) {
        nextAdminPassword = hashPassword(admin_password)
      }
    } else {
      nextAdminEmail = null
      nextAdminPassword = null
    }

    db.prepare(`
      UPDATE employees
         SET name = COALESCE(?, name),
             name_en = COALESCE(?, name_en),
             role = COALESCE(?, role),
             department = COALESCE(?, department),
             administration = COALESCE(?, administration),
             room_id = COALESCE(?, room_id),
             floor = COALESCE(?, floor),
             email = COALESCE(?, email),
             phone_office = COALESCE(?, phone_office),
             phone_mobile = COALESCE(?, phone_mobile),
             is_active = ?,
             is_admin = ?,
             admin_email = ?,
             admin_password = ?
       WHERE id = ?
    `)
      .run(
        normalizeText(name),
        normalizeText(name_en),
        normalizeText(role),
        normalizeText(department),
        normalizeText(administration),
        normalizedRoomId,
        typeof floor === 'number' ? floor : floor ? Number(floor) : null,
        normalizeText(email),
        normalizeText(phone_office),
        normalizeText(phone_mobile),
        nextIsActive,
        nextIsAdmin,
        nextAdminEmail,
        nextAdminPassword,
        id
      )
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const candidate = db.prepare('SELECT id, name, admin_password FROM employees WHERE is_admin = 1 AND COALESCE(is_active, 1) = 1 AND admin_email = ?').get(email)
  if (!candidate || !candidate.admin_password) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const hashed = hashPassword(password)
  if (candidate.admin_password !== hashed) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  res.json({ id: candidate.id, email, name: candidate.name })
})

// app.listen(PORT, () => {
//   console.log(`SQLite API listening on :${PORT}`)
// })

app.get('/api/health-db', async (req, res) => {
  try {
    const [{ c: rooms }] = await q('SELECT COUNT(*) AS c FROM rooms;');
    const [{ c: employees }] = await q('SELECT COUNT(*) AS c FROM employees;');
    res.json({ ok: true, rooms, employees });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});