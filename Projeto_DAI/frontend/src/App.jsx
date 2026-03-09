import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Transports from './pages/Transports'
import MapView from './pages/MapView'
import Layout from './components/ui/Layout'

export default function App() {
  return (
    <Routes>
      {/* Páginas com navegação normal */}
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/tickets" element={<Layout><Tickets /></Layout>} />
      <Route path="/transports" element={<Layout><Transports /></Layout>} />

      {/* Mapa ocupa o ecrã todo, sem Layout */}
      <Route path="/map" element={<MapView />} />
    </Routes>
  )
}