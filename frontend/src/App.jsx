import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage    from './pages/AuthPage'
import Dashboard   from './pages/Dashboard'
import Tickets     from './pages/Tickets'
import Transports  from './pages/Transports'
import MapView     from './pages/MapView'
import Layout      from './components/ui/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">A carregar...</div>
  if (!user) return <Navigate to="/login" replace />
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
      <Route path="/map" element={
        <PrivateRoute><MapView /></PrivateRoute>
      } />
    </Routes>
  )
}
