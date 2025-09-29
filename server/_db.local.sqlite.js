import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockData } from './mockData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'app.db')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS floors (
    floor_number INTEGER PRIMARY KEY,
    floor_name TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT,
    room_number TEXT,
    floor INTEGER,
    x REAL,
    y REAL,
    FOREIGN KEY (floor) REFERENCES floors(floor_number) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT,
    name_en TEXT,
    role TEXT,
    department TEXT,
    administration TEXT,
    room_id TEXT,
    floor INTEGER,
    email TEXT,
    phone_office TEXT,
    phone_mobile TEXT,
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    admin_email TEXT,
    admin_password TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE SET NULL,
    FOREIGN KEY (floor) REFERENCES floors(floor_number) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS departments (
    name TEXT PRIMARY KEY
  );
`)

const ensureColumn = (table, column, def) => {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!existing.some(col => col.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`).run()
  }
}

ensureColumn('floors', 'floor_name', 'TEXT')
ensureColumn('employees', 'name_en', 'TEXT')
ensureColumn('employees', 'administration', 'TEXT')
ensureColumn('employees', 'is_admin', 'INTEGER DEFAULT 0')
ensureColumn('employees', 'admin_email', 'TEXT')
ensureColumn('employees', 'admin_password', 'TEXT')
ensureColumn('employees', 'email', 'TEXT')
ensureColumn('employees', 'phone_office', 'TEXT')
ensureColumn('employees', 'phone_mobile', 'TEXT')
ensureColumn('employees', 'is_active', 'INTEGER DEFAULT 1')
db.prepare('UPDATE employees SET is_active = 1 WHERE is_active IS NULL').run()

const hasFloors = db.prepare('SELECT COUNT(*) as c FROM floors').get().c > 0
if (!hasFloors) {
  const insertFloor = db.prepare('INSERT INTO floors (floor_number, floor_name, image_url) VALUES (?, ?, ?)')
  const insertRoom = db.prepare('INSERT INTO rooms (room_id, room_name, room_number, floor, x, y) VALUES (?, ?, ?, ?, ?, ?)')
  const insertEmp = db.prepare('INSERT INTO employees (id, name, name_en, role, department, administration, room_id, floor, email, phone_office, phone_mobile, is_active, is_admin, admin_email, admin_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)')
  const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)')
  const tx = db.transaction(() => {
    for (const f of mockData.floors) insertFloor.run(f.floor_number, f.floor_name || null, f.image_url)
    for (const r of mockData.rooms) insertRoom.run(r.room_id, r.room_name, r.room_number, r.floor, r.x, r.y)
    for (const e of mockData.employees) {
      if (e.role) insertRole.run(e.role)
      if (e.department) insertDepartment.run(e.department)
      insertEmp.run(
        e.id,
        e.name,
        e.name_en || null,
        e.role,
        e.department,
        e.administration || null,
        e.room_id,
        e.floor,
        e.email || null,
        e.phone_office || null,
        e.phone_mobile || null,
        e.is_active === false ? 0 : 1,
        e.is_admin ? 1 : 0,
        e.admin_email || null,
        e.admin_password || null
      )
    }
  })
  tx()
}


