import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, Bus, Map, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/',           label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/tickets',    label: 'Bilhetes',    icon: Ticket },
  { path: '/transports', label: 'Transportes', icon: Bus },
  { path: '/map',        label: 'Mapa',        icon: Map },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-600">🚌 TUB — PGU</h2>
          <p className="text-xs text-gray-400 mt-0.5">Plataforma de Gestão Urbana</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user?.full_name || 'Utilizador'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.is_admin ? 'Administrador' : 'Utilizador'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
          >
            <LogOut size={16} />
            Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
