import { useAuth } from '../../hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/admin" replace state={{ from: location }} />
  }

  return children
}
