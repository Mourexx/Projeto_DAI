import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './shared/Context/AuthContext'
import AuthPage    from './packages/p1_user_management/AuthPage'
import Dashboard   from './packages/p5_analytics/Dashboard'
import Tickets     from './packages/p2_ticketing/Tickets'
import Transports  from './packages/p4_monitoring/Transports'
import MapView     from './packages/p4_monitoring/MapView'
import Profile     from './packages/p1_user_management/Profile'
import AdminUsers  from './packages/p1_user_management/AdminUsers'
import Analytics   from './packages/p5_analytics/Analytics'
import Alerts      from './packages/p6_alerts/Alerts'
import Layout      from './shared/components/ui/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#94A3B8', fontSize: 14 }}>
      A carregar...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94A3B8' }}>A carregar...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      {/* Mapa DENTRO do Layout — menu sempre visível */}
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute><Layout><Tickets /></Layout></PrivateRoute>} />
      <Route path="/transports" element={<PrivateRoute><Layout><Transports /></Layout></PrivateRoute>} />
      <Route path="/map" element={<PrivateRoute><Layout><MapView /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Layout><Alerts /></Layout></PrivateRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Layout><AdminUsers /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
