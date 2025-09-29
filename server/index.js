import express from 'express'
import crypto from 'node:crypto'
import process from 'node:process'


/* eslint-env node */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error('Missing TURSO_DATABASE_URL');
if (!authToken) throw new Error('Missing TURSO_AUTH_TOKEN');

export const q = async (sql, params = []) => {
  const client = createClient({ url, authToken });
  const { rows } = await client.execute({ sql, args: params });
  return rows;
};


const app = express()

// --- HARD CORS OVERRIDE: לפני כל דבר אחר ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// --- סוף CORS ---

app.get('/__diag', (req, res) => {
  res.json({ ok: true, cors: 'hard-override' });
});


console.log('CORS override active. Commit:', process.env.RENDER_GIT_COMMIT || 'unknown');




app.use(express.json({ limit: '10mb' }));



const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')


// Floors
app.get('/api/floors', async (req, res) => {
  try {
    const rows = await q('SELECT floor_number, floor_name, image_url FROM floors ORDER BY floor_number;')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})


app.post('/api/floors', async (req, res) => {
  const { floor_number, floor_name, image_url, clone_from } = req.body
  if (!floor_number || Number.isNaN(Number(floor_number))) return res.status(400).json({ error: 'floor_number is required' })
  if (!floor_name || !floor_name.trim()) return res.status(400).json({ error: 'floor_name is required' })

  try {
    await q('INSERT INTO floors (floor_number, floor_name, image_url) VALUES (?, ?, ?);',
      [Number(floor_number), floor_name.trim(), image_url || null])

    if (clone_from) {
      const srcImg = await q('SELECT image_url FROM floors WHERE floor_number = ?;', [Number(clone_from)])
      const rooms  = await q('SELECT room_name, room_number, x, y FROM rooms WHERE floor = ?;', [Number(clone_from)])

      if (srcImg?.[0]?.image_url && !image_url) {
        await q('UPDATE floors SET image_url = ? WHERE floor_number = ?;', [srcImg[0].image_url, Number(floor_number)])
      }
      for (const r of rooms) {
        await q('INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, ?, ?);',
          [crypto.randomUUID(), r.room_name || null, r.room_number, Number(floor_number), r.x ?? null, r.y ?? null])
      }
    }
    res.status(201).json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.put('/api/floors/:floor_number', async (req, res) => {
  const { floor_number } = req.params
  const { floor_name, image_url } = req.body
  try {
    const exists = await q('SELECT 1 FROM floors WHERE floor_number = ?;', [Number(floor_number)])
    if (!exists.length) return res.status(404).json({ error: 'Floor not found' })
    await q(
      'UPDATE floors SET floor_name = COALESCE(?, floor_name), image_url = COALESCE(?, image_url) WHERE floor_number = ?;',
      [floor_name?.trim() || null, image_url?.trim() || null, Number(floor_number)]
    )
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.delete('/api/floors/:floor_number', async (req, res) => {
  const { floor_number } = req.params
  try {
    const rooms = await q('SELECT room_id FROM rooms WHERE floor = ?;', [Number(floor_number)])
    if (rooms.length) {
      const ids = rooms.map(r => r.room_id)
      const placeholders = ids.map(() => '?').join(',')
      await q(`UPDATE employees SET room_id = NULL WHERE room_id IN (${placeholders});`, ids)
    }
    await q('UPDATE employees SET floor = NULL WHERE floor = ?;', [Number(floor_number)])

    const existing = await q('SELECT 1 FROM floors WHERE floor_number = ?;', [Number(floor_number)])
    if (!existing.length) return res.status(404).json({ error: 'Floor not found' })

    await q('DELETE FROM rooms WHERE floor = ?;', [Number(floor_number)])
    await q('DELETE FROM floors WHERE floor_number = ?;', [Number(floor_number)])
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
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


app.post('/api/rooms', async (req, res) => {
  const { room_id, room_name, room_number, floor, x, y } = req.body
  const normalizedNumber = typeof room_number === 'number' ? String(room_number) : room_number ? String(room_number).trim() : ''
  if (!normalizedNumber) return res.status(400).json({ error: 'room_number is required and must be unique' })
  if (room_id && String(room_id).trim() && String(room_id).trim() !== normalizedNumber) {
    return res.status(400).json({ error: 'room_id must match room_number' })
  }
  try {
    await q('INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, ?, ?);',
      [normalizedNumber, room_name?.trim() || null, normalizedNumber,
       floor ?? null, x ?? null, y ?? null])
    res.status(201).json({ room_id: normalizedNumber })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.put('/api/rooms/:room_id', async (req, res) => {
  const { room_id: currentId } = req.params
  const { room_name, room_number, floor, x, y } = req.body
  try {
    const existing = await q('SELECT room_id FROM rooms WHERE room_id = ?;', [currentId])
    if (!existing.length) return res.status(404).json({ error: 'Room not found' })

    let targetId = existing[0].room_id
    const normalizedNumber = (room_number ?? null) !== null ? String(room_number).trim() : null

    if (normalizedNumber && normalizedNumber !== existing[0].room_id) {
      const conflict = await q('SELECT room_id FROM rooms WHERE room_id = ?;', [normalizedNumber])
      if (conflict.length) return res.status(400).json({ error: 'room_number already exists' })
      await q('UPDATE rooms SET room_id = ?, room_number = ? WHERE room_id = ?;',
        [normalizedNumber, normalizedNumber, existing[0].room_id])
      await q('UPDATE employees SET room_id = ? WHERE room_id = ?;',
        [normalizedNumber, existing[0].room_id])
      targetId = normalizedNumber
    } else if (normalizedNumber) {
      await q('UPDATE rooms SET room_number = ? WHERE room_id = ?;', [normalizedNumber, existing[0].room_id])
    }

    await q(
      'UPDATE rooms SET room_name = COALESCE(?, room_name), floor = COALESCE(?, floor), x = COALESCE(?, x), y = COALESCE(?, y) WHERE room_id = ?;',
      [room_name?.trim() || null, floor ?? null, x ?? null, y ?? null, targetId]
    )
    res.json({ ok: true, room_id: targetId })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.delete('/api/rooms/:room_id', async (req, res) => {
  const { room_id } = req.params
  try {
    await q('UPDATE employees SET room_id = NULL WHERE room_id = ?;', [room_id])
    await q('DELETE FROM rooms WHERE room_id = ?;', [room_id])
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
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
  return res.status(501).json({ error: 'XML import temporarily disabled; use /api/import/employees or /api/import/roles|departments' })
})

  

app.get('/api/export/:table', async (req, res) => {
  const table = String(req.params.table || '').toLowerCase()
  const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_')
  const name = (n) => `${n}-${ts}.json`

  try {
    if (table === 'employees') {
      const rows = await q(`
        SELECT id, name, name_en, role, department, administration, room_id, floor,
               email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password
          FROM employees
         ORDER BY id;`)
      res.setHeader('Content-Disposition', `attachment; filename="${name('employees')}"`)
      return res.type('application/json').send(JSON.stringify(rows, null, 2))
    }
    if (table === 'roles' || table === 'departments') {
      const rows = await q(`SELECT name FROM ${table} ORDER BY name;`)
      res.setHeader('Content-Disposition', `attachment; filename="${name(table)}"`)
      return res.type('application/json').send(JSON.stringify(rows, null, 2))
    }
    res.status(400).json({ error: 'Unsupported table. Allowed values: employees, roles, departments' })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.post('/api/import/:table', async (req, res) => {
  const table = String(req.params.table || '').toLowerCase()
  const payload = Array.isArray(req.body) ? req.body : req.body?.records
  const records = Array.isArray(payload) ? payload : null
  if (!records) return res.status(400).json({ error: 'records array is required' })

  const parseBool = (v) => {
    if (typeof v === 'boolean') return v
    if (v == null) return undefined
    const s = String(v).trim().toLowerCase()
    if (!s) return undefined
    if (['1','true','yes','y'].includes(s)) return true
    if (['0','false','no','n'].includes(s)) return false
    return undefined
  }
  const norm = v => typeof v === 'string' ? (v.trim() || null) : (typeof v === 'number' ? String(v) : null)

  try {
    if (table === 'roles' || table === 'departments') {
      let inserted = 0
      for (const entry of records) {
        const name = norm(typeof entry === 'object' ? (entry?.name ?? Object.values(entry ?? {})[0]) : entry)
        if (!name) continue
        await q(`INSERT OR IGNORE INTO ${table} (name) VALUES (?);`, [name])
        inserted += 1
      }
      return res.json({ ok: true, summary: { inserted } })
    }

    if (table !== 'employees') return res.status(400).json({ error: 'Unsupported table. Allowed: employees, roles, departments' })

    let inserted = 0, updated = 0
    for (const raw of records) {
      const idValue = norm(raw?.id ?? raw?.employee_id)
      const nameValue = norm(raw?.name)
      if (!idValue || !nameValue) continue

      const roleValue  = norm(raw?.role)
      const deptValue  = norm(raw?.department)
      const adminisVal = norm(raw?.administration)
      const roomNum    = norm(raw?.room_id ?? raw?.room_number)
      const roomName   = norm(raw?.room_name)
      const floorVal   = raw?.floor == null ? null : Number(raw.floor)
      const emailVal   = norm(raw?.email)
      const officeVal  = norm(raw?.phone_office)
      const mobileVal  = norm(raw?.phone_mobile)
      const adminEmail = norm(raw?.admin_email)
      const isAdmin    = parseBool(raw?.is_admin)
      const isActive   = parseBool(raw?.is_active)
      const adminPwdRaw= norm(raw?.admin_password)

      if (roleValue) await q('INSERT OR IGNORE INTO roles (name) VALUES (?);', [roleValue])
      if (deptValue) await q('INSERT OR IGNORE INTO departments (name) VALUES (?);', [deptValue])

      if (roomNum) {
        const floorN = Number.isNaN(floorVal) ? null : floorVal
        await q(
          `INSERT INTO rooms (room_id, room_name, room_number, floor, x, y)
           VALUES (?, ?, ?, ?, NULL, NULL)
           ON CONFLICT(room_id) DO UPDATE SET
             room_name = COALESCE(excluded.room_name, rooms.room_name),
             room_number = COALESCE(excluded.room_number, rooms.room_number),
             floor = COALESCE(excluded.floor, rooms.floor);`,
          [roomNum, roomName, roomNum, floorN]
        )
      }

      const existing = await q('SELECT is_active, is_admin, admin_email, admin_password FROM employees WHERE id = ?;', [idValue])
      const prev = existing[0]
      const nextIsActive = isActive === undefined ? (prev ? (prev.is_active ?? 1) : 1) : (isActive ? 1 : 0)
      const nextIsAdmin  = isAdmin  === undefined ? (prev ? prev.is_admin : 0)           : (isAdmin ? 1 : 0)

      let adminPassword = null
      if (adminPwdRaw) {
        adminPassword = /^[0-9a-fA-F]{64}$/.test(adminPwdRaw) ? adminPwdRaw.toLowerCase() : hashPassword(adminPwdRaw)
      }
      const nextAdminEmail    = nextIsAdmin ? (adminEmail ?? prev?.admin_email ?? null) : null
      const nextAdminPassword = nextIsAdmin ? (adminPassword || prev?.admin_password || null) : null

      await q(`
        INSERT INTO employees (id, name, name_en, role, department, administration, room_id, floor,
                               email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          admin_password = COALESCE(excluded.admin_password, employees.admin_password);`,
        [
          idValue, nameValue, norm(raw?.name_en), roleValue, deptValue, adminisVal,
          roomNum || null, (Number.isNaN(floorVal) ? null : floorVal),
          emailVal, officeVal, mobileVal, nextIsActive, nextIsAdmin, nextAdminEmail, nextAdminPassword
        ]
      )
      if (prev) updated++; else inserted++;
    }
    res.json({ ok: true, summary: { employeesInserted: inserted, employeesUpdated: updated } })
  } catch (e) {
    res.status(400).json({ error: String(e) })
  }
})


app.post('/api/employees', async (req, res) => {
  const {
    id, name, name_en, role, department, administration, room_id, floor,
    email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password
  } = req.body

  try {
    const trimmedId = typeof id === 'number' ? String(id).trim() : id ? String(id).trim() : ''
    if (!trimmedId) return res.status(400).json({ error: 'Employee id is required' })
    const isActive = typeof is_active === 'undefined' ? 1 : (is_active ? 1 : 0)
    const isAdmin = is_admin ? 1 : 0
    const adminEmail = isAdmin ? (admin_email?.trim() || null) : null
    const adminPassword = isAdmin && admin_password ? hashPassword(admin_password) : null
    const normalizedRoomId = room_id ? String(room_id).trim() || null : null
    const floorVal = typeof floor === 'number' ? floor : floor ? Number(floor) : null

    await q(`
      INSERT INTO employees (
        id, name, name_en, role, department, administration, room_id, floor,
        email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        trimmedId, name?.trim() || null, name_en?.trim() || null,
        role?.trim() || null, department?.trim() || null, administration?.trim() || null,
        normalizedRoomId, floorVal,
        email?.trim() || null, phone_office?.trim() || null, phone_mobile?.trim() || null,
        isActive, isAdmin, adminEmail, adminPassword
      ]
    )
    res.status(201).json({ id: trimmedId })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params
  const {
    name, name_en, role, department, administration, room_id, floor,
    email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password
  } = req.body

  try {
    const curRows = await q('SELECT * FROM employees WHERE id = ?;', [id])
    if (!curRows.length) return res.status(404).json({ error: 'Employee not found' })
    const cur = curRows[0]

    const nextIsActive = typeof is_active === 'undefined' ? (cur.is_active ?? 1) : (is_active ? 1 : 0)
    const nextIsAdmin  = typeof is_admin  === 'undefined' ?  cur.is_admin      : (is_admin ? 1 : 0)
    let   nextAdminEmail    = cur.admin_email
    let   nextAdminPassword = cur.admin_password
    const normalizedRoomId = typeof room_id === 'undefined'
      ? undefined
      : (String(room_id).trim().length ? String(room_id).trim() : null)

    if (nextIsAdmin) {
      if (typeof admin_email !== 'undefined') nextAdminEmail = admin_email?.trim() || null
      if (typeof admin_password === 'string' && admin_password.length) nextAdminPassword = hashPassword(admin_password)
    } else {
      nextAdminEmail = null
      nextAdminPassword = null
    }

    await q(`
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
       WHERE id = ?;`,
      [
        name?.trim() || null, name_en?.trim() || null, role?.trim() || null, department?.trim() || null,
        administration?.trim() || null, normalizedRoomId,
        (typeof floor === 'number' ? floor : floor ? Number(floor) : null),
        email?.trim() || null, phone_office?.trim() || null, phone_mobile?.trim() || null,
        nextIsActive, nextIsAdmin, nextAdminEmail, nextAdminPassword, id
      ]
    )
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params
  try {
    await q('DELETE FROM employees WHERE id = ?;', [id])
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: String(e) }) }
})


// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  try {
    const cand = await q(
      'SELECT id, name, admin_password FROM employees WHERE is_admin = 1 AND COALESCE(is_active, 1) = 1 AND admin_email = ?;',
      [email]
    )
    if (!cand.length || !cand[0].admin_password) return res.status(401).json({ error: 'Invalid credentials' })
    if (cand[0].admin_password !== hashPassword(password)) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ id: cand[0].id, email, name: cand[0].name })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})


// app.listen(PORT, () => {
//   console.log(`SQLite API listening on :${PORT}`)
// })

app.get('/api/health-db', async (_req, res) => {
  try {
    const [{ c: rooms }]     = await q('SELECT COUNT(*) AS c FROM rooms;')
    const [{ c: employees }] = await q('SELECT COUNT(*) AS c FROM employees;')
    res.json({ ok: true, rooms, employees })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})


app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );
  res.status(err?.status || 500).json({ ok: false, error: err?.message || 'Server error' });
});



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});

