import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Transports from './pages/Transports'
import MapView from './pages/MapView'
import Layout from './components/ui/Layout'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/transports" element={<Transports />} />
        <Route path="/map" element={<MapView />} />
      </Routes>
    </Layout>
  )
}
