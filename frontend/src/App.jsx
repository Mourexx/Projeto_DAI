import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './Context/AuthContext'
import AuthPage    from './pages/AuthPage'
import Dashboard   from './pages/Dashboard'
import Tickets     from './pages/Tickets'
import Transports  from './pages/Transports'
import MapView     from './pages/MapView'
import Profile     from './pages/Profile'
import AdminUsers  from './pages/AdminUsers'
import Layout      from './components/ui/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">A carregar...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">A carregar...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route path="/" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      } />
      <Route path="/tickets" element={
        <PrivateRoute><Layout><Tickets /></Layout></PrivateRoute>
      } />
      <Route path="/transports" element={
        <PrivateRoute><Layout><Transports /></Layout></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><Layout><Profile /></Layout></PrivateRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute><Layout><AdminUsers /></Layout></AdminRoute>
      } />
      <Route path="/map" element={
        <PrivateRoute><MapView /></PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
