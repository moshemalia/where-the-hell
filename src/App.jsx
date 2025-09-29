import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import SplashScreen from './components/app/SplashScreen'
import HomeScreen from './components/app/HomeScreen'
import SearchResults from './components/app/SearchResults'
import Contact from './components/app/Contact'

import Login from './components/admin/Login'
import Dashboard from './components/admin/Dashboard'
import MapManagement from './components/admin/MapManagement'
import EmployeeManagement from './components/admin/EmployeeManagement'

import ProtectedRoute from './components/common/ProtectedRoute'

import { ROUTES } from './lib/constants'

function App() {
  return (
    <Router>
      <div className="App" dir="rtl">
        <Routes>
          <Route path={ROUTES.SPLASH} element={<SplashScreen />} />
          <Route path={ROUTES.HOME} element={<HomeScreen />} />
          <Route path={ROUTES.SEARCH_RESULTS} element={<SearchResults />} />
          <Route path={ROUTES.CONTACT} element={<Contact />} />

          <Route path={ROUTES.ADMIN_LOGIN} element={<Login />} />
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_MAPS}
            element={
              <ProtectedRoute>
                <MapManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_EMPLOYEES}
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_LOGIN} replace />} />

          <Route path="*" element={<Navigate to={ROUTES.SPLASH} replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
