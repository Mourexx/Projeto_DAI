// Package Shared — 4SRS SIBCP v3
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, Bus, Map, LogOut, User, Users, BarChart2, Bell, ChevronRight, Server, Download } from 'lucide-react'
import { useAuth } from '../../Context/AuthContext'
import tubLogo from '../../../assets/Logo_letra_Vermelha.jpg'

const B = '#005BAC'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navGroups = [
    {
      label: 'Principal',
      items: [
        { path: '/',           label: 'Dashboard',         icon: LayoutDashboard },
        { path: '/analytics',  label: 'Análise',           icon: BarChart2 },
        { path: '/alerts',     label: 'Alertas',           icon: Bell },
      ]
    },
    {
      label: 'Operação',
      items: [
        { path: '/map',        label: 'Mapa em Tempo Real', icon: Map },
        { path: '/transports', label: 'Transportes',        icon: Bus },
        ...(user?.is_admin ? [
          { path: '/devices', label: 'Dispositivos', icon: Server },
          { path: '/export',  label: 'Exportação',   icon: Download },
        ] : []),
      ]
    },
    {
      label: 'Bilhética',
      items: [
        { path: '/tickets',    label: 'Bilhetes',           icon: Ticket },
        ...(user?.is_admin ? [{ path: '/admin/users', label: 'Utilizadores', icon: Users }] : []),
      ]
    },
  ]

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F4F6F9', fontFamily: "'DM Sans', sans-serif" }}>
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={tubLogo} alt="TUB" style={{ width: 110, height: 44, objectFit: 'contain' }} />
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.3 }}>Gestão Urbana</div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>
                {group.label}
              </div>
              {group.items.map(({ path, label, icon: Icon }) => {
                const active = isActive(path)
                return (
                  <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, marginBottom: 2, position: 'relative', cursor: 'pointer',
                      background: active ? '#EBF4FF' : 'transparent',
                      color: active ? B : '#475569',
                      fontWeight: active ? 600 : 400, fontSize: 14,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = B } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' } }}
                    >
                      {active && <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, background: B, borderRadius: '0 2px 2px 0' }} />}
                      <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                      <span style={{ flex: 1 }}>{label}</span>
                      {active && <ChevronRight size={13} style={{ opacity: 0.4 }} />}
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #F1F5F9' }}>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: B, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Utilizador'}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{user?.is_admin ? 'Administrador' : 'Utilizador'}</div>
              </div>
            </div>
          </Link>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B' }}
          >
            <LogOut size={15} /> Terminar Sessão
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</main>
    </div>
  )
}
