import { useState, useEffect, useCallback } from "react"

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

  const fetchEmployeesFromServer = useCallback(async () => {
    const res = await fetch('/api/employees')
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map(normalizeEmployee).filter(emp => emp.is_active)
  }, [])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEmployeesFromServer()
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }, [fetchEmployeesFromServer])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const addEmployee = async (employeeData) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    })
    if (res.ok) await fetchEmployees()
    return res.ok ? null : await res.json()
  }

  const updateEmployee = async (id, employeeData) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    })
    if (res.ok) await fetchEmployees()
    return res.ok ? null : await res.json()
  }

  const deleteEmployee = async (id) => {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (res.ok) await fetchEmployees()
    return res.ok ? null : await res.json()
  }

  const searchEmployees = async (query = "") => {
    const data = await fetchEmployeesFromServer()
    const trimmed = query.trim().toLowerCase()
    const filtered = trimmed
      ? data.filter(emp =>
          [
            emp.name,
            emp.name_en,
            emp.role,
            emp.department,
            emp.administration,
            emp.room_id,
            emp.email
          ]
            .filter(Boolean)
            .some(value => value.toString().toLowerCase().includes(trimmed))
        )
      : data
    return { data: filtered }
  }

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
    searchEmployees
  }
}

