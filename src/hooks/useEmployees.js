// src/hooks/useEmployees.js
import { useState, useEffect, useCallback } from "react"
import { api } from "../api"  // ודא שהנתיב נכון יחסית למיקום הקובץ

const normalizeEmployee = (emp) => ({
  ...emp,
  is_admin: Boolean(emp.is_admin),
  admin_email: emp.admin_email || '',
  email: emp.email || '',
  phone_office: emp.phone_office || '',
  phone_mobile: emp.phone_mobile || '',
  name_en: emp.name_en || '',
  administration: emp.administration || '',
  is_active: emp.is_active !== 0
})

export function useEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEmployeesFromServer = useCallback(async () => {
    const data = await api('/api/employees')            // api() מחזיר JSON
    if (!Array.isArray(data)) return []
    return data.map(normalizeEmployee).filter(emp => emp.is_active)
  }, [])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEmployeesFromServer()
      setEmployees(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [fetchEmployeesFromServer])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const addEmployee = async (employeeData) => {
    try {
      const data = await api('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      })
      await fetchEmployees()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const updateEmployee = async (id, employeeData) => {
    try {
      const data = await api(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      })
      await fetchEmployees()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const deleteEmployee = async (id) => {
    try {
      const data = await api(`/api/employees/${id}`, { method: 'DELETE' })
      await fetchEmployees()
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const searchEmployees = async (query = "") => {
    const data = await fetchEmployeesFromServer()
    const trimmed = query.trim().toLowerCase()
    const filtered = trimmed
      ? data.filter(emp =>
          [emp.name, emp.name_en, emp.role, emp.department, emp.administration, emp.room_id, emp.email]
            .filter(Boolean)
            .some(v => v.toString().toLowerCase().includes(trimmed))
        )
      : data
    return { data: filtered }
  }

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
    searchEmployees,
  }
}
