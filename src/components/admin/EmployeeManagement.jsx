import { api } from '../../api';
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useEmployees } from "../../hooks/useEmployees"
import { useRooms } from "../../hooks/useRooms"
import AppFooter from "../common/AppFooter"

const INITIAL_FORM = {
  employee_id: "",
  name: "",
  name_en: "",
  role: "",
  department: "",
  administration: "",
  room_id: "",
  floor: "",
  email: "",
  phone_office: "",
  phone_mobile: "",
  is_admin: false,
  admin_email: "",
  admin_password: "",
  is_active: true
}

export default function EmployeeManagement() {
  const navigate = useNavigate()
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee, refetch: refetchEmployees } = useEmployees()
  const { rooms, refetch: refetchRooms } = useRooms()

  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [roomInput, setRoomInput] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [directoryFilter, setDirectoryFilter] = useState("")
  const [taxonomyRoles, setTaxonomyRoles] = useState([])
  const [taxonomyDepartments, setTaxonomyDepartments] = useState([])

  const [tableTarget, setTableTarget] = useState('employees')
  const [tableProcessing, setTableProcessing] = useState(false)
  const [tableOperationSummary, setTableOperationSummary] = useState(null)
  const [tableImportError, setTableImportError] = useState('')
  const tableFileInputRef = useRef(null)
  const roleOptions = useMemo(
    () => Array.from(
      new Set([
        ...taxonomyRoles.filter(Boolean),
        ...employees.map(e => e.role).filter(Boolean)
      ])
    ).sort((a, b) => a.localeCompare(b, 'he')),
    [employees, taxonomyRoles]
  )

  const departmentOptions = useMemo(
    () => Array.from(
      new Set([
        ...taxonomyDepartments.filter(Boolean),
        ...employees.map(e => e.department).filter(Boolean)
      ])
    ).sort((a, b) => a.localeCompare(b, 'he')),
    [employees, taxonomyDepartments]
  )

  const administrationOptions = useMemo(
    () => Array.from(new Set(employees.map(e => e.administration).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'he')),
    [employees]
  )

  const roomOptions = useMemo(
    () => rooms
      .map(room => ({
        id: room.room_id,
        number: room.room_number,
        label: `${room.room_number} - ${room.room_name}`,
        floor: room.floor
      }))
      .sort((a, b) => a.number.localeCompare(b.number, 'he')),
    [rooms]
  )

  const tableOptions = useMemo(() => ([
    { value: 'employees', label: 'רשימת עובדים' },
    { value: 'roles', label: 'רשימת תפקידים' },
    { value: 'departments', label: 'רשימת מחלקות' }
  ]), [])
  const tableLabelLookup = useMemo(() => tableOptions.reduce((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {}), [tableOptions])

  useEffect(() => {
    if (!roomInput.trim()) {
      setForm(prev => ({ ...prev, room_id: "", floor: "" }))
      return
    }
    const match = roomOptions.find(opt => opt.number === roomInput.trim())
    if (match) {
      setForm(prev => ({ ...prev, room_id: match.id, floor: match.floor }))
    }
  }, [roomInput, roomOptions])

  const resetForm = () => {
    setForm({ ...INITIAL_FORM })
    setRoomInput("")
    setEditingId(null)
  }

  const fetchTaxonomy = useCallback(async () => {
    try {
      const response = await api('/api/taxonomy')
      if (!response.ok) return
      const data = await response.json()
      if (Array.isArray(data?.roles)) {
        setTaxonomyRoles(data.roles.filter(Boolean))
      }
      if (Array.isArray(data?.departments)) {
        setTaxonomyDepartments(data.departments.filter(Boolean))
      }
    } catch (error) {
      console.error('Failed to fetch taxonomy', error)
    }
  }, [])

  useEffect(() => {
    fetchTaxonomy()
  }, [fetchTaxonomy])

  const handleExportTable = useCallback(async () => {
    if (!tableTarget) {
      setTableImportError('בחר טבלה לייצוא.')
      return
    }
    setTableImportError('')
    setTableOperationSummary(null)
    setTableProcessing(true)
    try {
      const response = await api(`/api/export/${tableTarget}`)
      if (!response.ok) {
        const errorText = await response.text()
        let message = 'הייצוא נכשל.'
        try {
          const json = JSON.parse(errorText)
          message = json?.error || message
        } catch {
          if (errorText.trim().length) message = errorText
        }
        throw new Error(message)
      }
      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition')
      let filename = `export-${tableTarget}-${new Date().toISOString().split('T')[0]}.json`
      if (disposition) {
        const match = disposition.match(/filename\*?="?([^";]+)"?/i)
        if (match?.[1]) {
          filename = match[1]
        }
      }
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setTableOperationSummary({ type: 'export', table: tableTarget, timestamp: new Date().toISOString() })
    } catch (error) {
      setTableImportError(error.message || 'הייצוא נכשל.')
    } finally {
      setTableProcessing(false)
    }
  }, [tableTarget])

  const handleOpenTableImportDialog = useCallback(() => {
    if (!tableTarget) {
      setTableImportError('בחר טבלה לייבוא.')
      return
    }
    setTableImportError('')
    tableFileInputRef.current?.click()
  }, [tableTarget])

  const handleImportTable = useCallback(async (event) => {
    const input = event.target
    const file = input?.files?.[0]
    if (!file) return
    if (!tableTarget) {
      setTableImportError('בחר טבלה לייבוא.')
      if (input) input.value = ''
      return
    }

    setTableImportError('')
    setTableOperationSummary(null)
    setTableProcessing(true)
    try {
      const textContent = await file.text()
      let parsed
      try {
        parsed = JSON.parse(textContent)
      } catch {
        throw new Error('קובץ ה-JSON אינו תקין.')
      }
      const payload = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.records) ? parsed.records : null)
      if (!Array.isArray(payload)) {
        throw new Error('בקובץ חייב להופיע מערך של רשומות או שדה records הכולל מערך.')
      }

      const response = await api(`/api/import/${tableTarget}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: payload })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) {
        const message = result?.error || 'ייבוא הטבלה נכשל.'
        throw new Error(message)
      }

      if (tableTarget === 'employees') {
        await Promise.all([refetchEmployees(), refetchRooms()])
      }
      if (['employees', 'roles', 'departments'].includes(tableTarget)) {
        await fetchTaxonomy()
      }

      setTableOperationSummary({ type: 'import', table: tableTarget, summary: result.summary || {} })
    } catch (error) {
      setTableImportError(error.message || 'אירעה שגיאה בעת הייבוא.')
    } finally {
      setTableProcessing(false)
      if (input) {
        input.value = ''
      }
    }
  }, [tableTarget, fetchTaxonomy, refetchEmployees, refetchRooms])
  const buildPayload = () => {
    const employeeId = form.employee_id.trim()
    const floorValue = typeof form.floor === 'string' ? form.floor.trim() : form.floor
    const payload = {
      id: employeeId,
      name: form.name.trim(),
      name_en: form.name_en.trim() || null,
      role: form.role.trim(),
      department: form.department.trim() || null,
      administration: form.administration.trim() || null,
      room_id: form.room_id ? form.room_id.trim() : null,
      floor: floorValue ? Number(floorValue) : null,
      email: form.email.trim() || null,
      phone_office: form.phone_office.trim() || null,
      phone_mobile: form.phone_mobile.trim() || null,
      is_admin: Boolean(form.is_admin),
      admin_email: form.is_admin ? form.admin_email.trim() || null : null,
      is_active: form.is_active ? 1 : 0
    }

    if (form.is_admin && form.admin_password.trim()) {
      payload.admin_password = form.admin_password.trim()
    }

    return payload
  }

  const validateForm = () => {
    const employeeId = form.employee_id.trim()
    if (!employeeId) {
      alert('נא להזין מספר עובד.')
      return false
    }
    if (!/^\d+$/.test(employeeId)) {
      alert('מספר העובד חייב להכיל ספרות בלבד.')
      return false
    }
    if (!form.name.trim() || !form.role.trim()) {
      alert('נא למלא את כל השדות הנדרשים.')
      return false
    }

    if (form.is_admin) {
      if (!form.admin_email.trim()) {
        alert('נא להזין כתובת מייל למנהל.')
        return false
      }
      if (!editingId && !form.admin_password.trim()) {
        alert('נא להזין סיסמה לפני השמירה.')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    const payload = buildPayload()

    if (editingId) {
      await updateEmployee(editingId, payload)
    } else {
      await addEmployee(payload)
    }
    resetForm()
  }

  const handleEdit = (employee) => {
    setForm({
      employee_id: employee.id ? String(employee.id) : '',
      name: employee.name || '',
      name_en: employee.name_en || '',
      role: employee.role || '',
      department: employee.department || '',
      administration: employee.administration || '',
      room_id: employee.room_id || '',
      floor: employee.floor != null ? String(employee.floor) : '',
      email: employee.email || '',
      phone_office: employee.phone_office || '',
      phone_mobile: employee.phone_mobile || '',
      is_admin: Boolean(employee.is_admin),
      admin_email: employee.admin_email || '',
      admin_password: '',
      is_active: employee.is_active !== false
    })
    const matchedRoom = rooms.find(room => room.room_id === employee.room_id)
    setRoomInput(matchedRoom?.room_number || '')
    setEditingId(employee.id)
  }

  const handleDelete = async (id) => {
    if (window.confirm('האם למחוק את העובד?')) {
      await deleteEmployee(id)
      if (editingId === id) resetForm()
    }
  }

  const filteredEmployees = useMemo(() => {
    const normalized = directoryFilter.trim().toLowerCase()
    if (!normalized) return employees
    return employees.filter(emp =>
      [
        emp.id,
        emp.name,
        emp.name_en,
        emp.role,
        emp.department,
        emp.administration,
        emp.email,
        emp.phone_office,
        emp.phone_mobile
      ]
        .filter(Boolean)
        .some(value => value.toString().toLowerCase().includes(normalized))
    )
  }, [directoryFilter, employees])

  const syncRoomSelection = (value) => {
    setRoomInput(value)
    const match = roomOptions.find(opt => opt.number === value)
    if (match) {
      setForm(prev => ({ ...prev, room_id: match.id, floor: match.floor }))
    } else {
      setForm(prev => ({ ...prev, room_id: '', floor: '' }))
    }
  }

  const tableSummaryMessage = (summary) => {
    if (!summary) return null
    if (tableOperationSummary?.table === 'employees') {
      return (
        <>
          <div>עובדים חדשים: {summary.employeesInserted ?? 0}</div>
          <div>עובדים שעודכנו: {summary.employeesUpdated ?? 0}</div>
        </>
      )
    }
    if (tableOperationSummary?.table === 'roles') {
      return <div>תפקידים שנוספו: {summary.inserted ?? 0}</div>
    }
    if (tableOperationSummary?.table === 'departments') {
      return <div>מחלקות שנוספו: {summary.inserted ?? 0}</div>
    }
    return null
  }
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#05030f] via-[#090523] to-[#05030f] text-[var(--brand-text)]" dir="rtl">
      <header className="border-b border-[#2c2457]/60 bg-black/35 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">ניהול עובדים</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/maps')}
              className="px-4 py-2 rounded-2xl border border-[#3c2f71]/60 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
            >
              ניהול מפות
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 rounded-2xl border border-[#3c2f71]/60 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
            >
              לוח הניהול
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 grid gap-6 xl:grid-cols-[450px,1fr]">

        <section className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 shadow-[0_25px_55px_rgba(12,8,38,0.55)] xl:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-right md:max-w-2xl">
              <h2 className="text-lg font-semibold text-white">ניהול נתונים לפי טבלה</h2>
              <p className="text-sm text-brand-muted">בחר טבלה לייצוא או ייבוא נתונים במבנה JSON.</p>
              <p className="text-xs text-brand-muted">הקובץ חייב לכלול מערך של רשומות. ברשימת עובדים נדרש מזהה עובד (מספר עובד) ושם.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end w-full md:w-auto">
              <label className="flex flex-col gap-2 text-right md:min-w-[220px]">
                <span className="text-sm text-brand-muted">בחר טבלה</span>
                <select
                  className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
                  value={tableTarget}
                  onChange={e => setTableTarget(e.target.value)}
                  disabled={tableProcessing}
                >
                  {tableOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleExportTable}
                  disabled={tableProcessing}
                  className="px-4 py-2 rounded-2xl border border-[#3c2f71]/60 text-sm text-white hover:bg-[#221c48] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {tableProcessing ? 'ממתין...' : 'ייצא טבלה'}
                </button>
                <button
                  type="button"
                  onClick={handleOpenTableImportDialog}
                  disabled={tableProcessing}
                  className="px-4 py-2 rounded-2xl border border-[#3c2f71]/60 text-sm text-white hover:bg-[#221c48] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {tableProcessing ? 'ממתין...' : 'ייבא טבלה'}
                </button>
              </div>
            </div>
          </div>
          <input
            ref={tableFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportTable}
          />
          {tableImportError && (
            <div className="mt-4 border border-[#7c244f]/60 bg-[#2d1227] text-[#ff6fa5] text-sm rounded-2xl px-4 py-3 text-right">
              {tableImportError}
            </div>
          )}
          {tableOperationSummary && tableOperationSummary.type === 'export' && (
            <div className="mt-4 border border-[#245b3b]/60 bg-[#13251b] text-[#5bf2aa] text-sm rounded-2xl px-4 py-3 text-right">
              הייצוא לטבלה {tableLabelLookup[tableOperationSummary.table] || tableOperationSummary.table} הושלם בהצלחה.
            </div>
          )}
          {tableOperationSummary && tableOperationSummary.type === 'import' && (
            <div className="mt-4 border border-[#245b3b]/60 bg-[#13251b] text-[#5bf2aa] text-sm rounded-2xl px-4 py-3 text-right space-y-1">
              <div>הייבוא לטבלה {tableLabelLookup[tableOperationSummary.table] || tableOperationSummary.table} הושלם בהצלחה.</div>
              {tableSummaryMessage(tableOperationSummary.summary)}
            </div>
          )}
        </section>

        <section className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 shadow-[0_25px_55px_rgba(12,8,38,0.55)]">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'עריכת עובד' : 'הוספת עובד חדש'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="מספר עובד"
              value={form.employee_id}
              onChange={e => setForm({ ...form, employee_id: e.target.value })}
              inputMode="numeric"
              disabled={Boolean(editingId)}
            />
            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="שם העובד"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="שם באנגלית (אם קיים)"
              value={form.name_en}
              onChange={e => setForm({ ...form, name_en: e.target.value })}
            />

            <AutocompleteField
              id="role-options"
              placeholder="תפקיד"
              value={form.role}
              onChange={value => setForm({ ...form, role: value })}
              options={roleOptions}
            />

            <AutocompleteField
              id="department-options"
              placeholder="מחלקה"
              value={form.department}
              onChange={value => setForm({ ...form, department: value })}
              options={departmentOptions}
            />

            <AutocompleteField
              id="administration-options"
              placeholder="מנהלה"
              value={form.administration}
              onChange={value => setForm({ ...form, administration: value })}
              options={administrationOptions}
            />

            <AutocompleteField
              id="room-options"
              placeholder="מספר חדר"
              value={roomInput}
              onChange={value => syncRoomSelection(value)}
              options={roomOptions.map(option => option.number)}
            />

            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="קומה"
              value={form.floor}
              onChange={e => setForm({ ...form, floor: e.target.value })}
            />

            <input
              type="email"
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder='דוא"ל'
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="טלפון במשרד"
              value={form.phone_office}
              onChange={e => setForm({ ...form, phone_office: e.target.value })}
            />

            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
              placeholder="טלפון נייד"
              value={form.phone_mobile}
              onChange={e => setForm({ ...form, phone_mobile: e.target.value })}
            />

            <label className="flex items-center justify-between bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-sm">
              <span className="text-brand-muted">עובד פעיל</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
            </label>

            <label className="flex items-center justify-between bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-sm">
              <span className="text-brand-muted">מנהל מערכת</span>
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={e => setForm(prev => ({
                  ...prev,
                  is_admin: e.target.checked,
                  admin_email: e.target.checked ? prev.admin_email : '',
                  admin_password: ''
                }))}
              />
            </label>

            {form.is_admin && (
              <div className="space-y-2 border border-[#3c2f71]/60 bg-[#161335] rounded-2xl px-4 py-4 text-sm">
                <div>
                  <label className="block text-brand-muted mb-1 text-right">דוא"ל מנהל מערכת</label>
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={e => setForm({ ...form, admin_email: e.target.value })}
                    className="w-full bg-[#1b1842] border border-[#443986]/70 rounded-xl px-3 py-2 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-brand-muted mb-1 text-right">
                    {editingId ? 'עדכון סיסמה (לא חובה)' : 'סיסמת מנהל חדשה'}
                  </label>
                  <input
                    type="password"
                    value={form.admin_password}
                    onChange={e => setForm({ ...form, admin_password: e.target.value })}
                    className="w-full bg-[#1b1842] border border-[#443986]/70 rounded-xl px-3 py-2 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff]"
                    placeholder={editingId ? 'השאר ריק כדי שלא לשנות סיסמה קיימת' : 'הקלד סיסמה'}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="submit" className="brand-primary px-5 py-2 text-sm font-semibold rounded-xl">
                {editingId ? 'עדכן' : 'שמור'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="px-5 py-2 rounded-2xl border border-[#3c2f71]/60 text-brand-muted hover:text-white hover:border-[#8c3bff] transition"
                  onClick={resetForm}
                >
                  בטל עריכה
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="surface-card rounded-3xl p-6 border border-[#3a2d6f]/60 shadow-[0_25px_55px_rgba(12,8,38,0.55)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">רשימת העובדים</h2>
            <input
              className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-2 text-right text-sm text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff] max-w-xs"
              placeholder="חפש לפי שם / תפקיד / מחלקה"
              value={directoryFilter}
              onChange={e => setDirectoryFilter(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-brand-muted">טוען...</div>
          ) : (
            <ul className="space-y-3">
              {filteredEmployees.map(emp => (
                <li key={emp.id} className="border border-[#3a2d6f]/60 bg-[#161335] rounded-3xl p-4 flex items-start justify-between gap-3">
                  <div className="text-sm text-brand-muted space-y-1">
                    <div className="font-semibold text-white flex items-center gap-2 justify-end">
                      {emp.name}
                      {emp.name_en && <span className="text-xs text-brand-muted">({emp.name_en})</span>}
                      {emp.is_admin && (
                        <span className="text-xs font-semibold bg-[#2a2553] text-[#8c3bff] px-2 py-0.5 rounded-full">
                          מנהל מערכת
                        </span>
                      )}
                      {!emp.is_active && (
                        <span className="text-xs font-semibold bg-[#3c1a3d] text-[#ff52d9] px-2 py-0.5 rounded-full">
                          לא פעיל
                        </span>
                      )}
                    </div>
                    <div>מספר עובד: {emp.id}</div>
                    <div>{emp.role}</div>
                    <div>{emp.department || 'ללא מחלקה'}{emp.administration ? ` | ${emp.administration}` : ''}</div>
                    <div>חדר: {roomOptions.find(r => r.id === emp.room_id)?.number || 'ללא חדר'} | קומה: {emp.floor ?? 'לא ידועה'}</div>
                    <div>דוא"ל: {emp.email || '-'}</div>
                    <div>טלפון משרד: {emp.phone_office || '-'}</div>
                    <div>טלפון נייד: {emp.phone_mobile || '-'}</div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[110px]">
                    <button
                      className="px-3 py-2 rounded-xl border border-[#3c2f71]/60 text-sm text-white hover:bg-[#221c48] transition"
                      onClick={() => handleEdit(emp)}
                    >
                      ערוך
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border border-[#7c244f]/60 text-sm text-[#ff6fa5] hover:bg-[#2d1227] transition"
                      onClick={() => handleDelete(emp.id)}
                    >
                      מחק
                    </button>
                  </div>
                </li>
              ))}
              {!filteredEmployees.length && (
                <li className="text-brand-muted text-sm text-center py-6 border border-dashed border-[#3a2d6f]/60 rounded-3xl">
                  לא נמצאו תוצאות העונות לסינון הנוכחי.
                </li>
              )}
            </ul>
          )}
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
function AutocompleteField({ id, placeholder, value, onChange, options }) {
  return (
    <div>
      <input
        list={id}
        className="bg-[#161335] border border-[#3a2d6f]/60 rounded-2xl px-4 py-3 text-right text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-[#8c3bff] w-full"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <datalist id={id}>
        {options.map(option => (
          <option key={option} value={typeof option === 'string' ? option : option.label || option}>
            {typeof option === 'string' ? option : option.label || option}
          </option>
        ))}
      </datalist>
    </div>
  )
}
