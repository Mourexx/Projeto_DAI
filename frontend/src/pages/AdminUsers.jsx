// UC1.4 – Gerir Permissões (Admin)
import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [search, setSearch] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/users/')
      .then(res => setUsers(res.data))
      .catch(() => setMsg({ type: 'error', text: 'Erro ao carregar utilizadores.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleAdmin = async (user) => {
    try {
      await api.patch(`/users/${user.id}/permissions?is_admin=${!user.is_admin}`)
      setMsg({ type: 'success', text: `Permissões de ${user.email} atualizadas.` })
      fetchUsers()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao atualizar permissões.' })
    }
  }

  const deactivate = async (user) => {
    if (!confirm(`Desativar a conta de ${user.email}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      setMsg({ type: 'success', text: 'Conta desativada.' })
      fetchUsers()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao desativar conta.' })
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(u => u.is_admin).length
  const ativos = filtered.filter(u => u.is_active).length

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
          Gestão de Utilizadores
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          UC1.4 · Gerir permissões e contas — apenas administradores
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Utilizadores', value: users.length, icon: '👥', color: '#1A1A1A' },
          { label: 'Administradores', value: admins, icon: '🛡️', color: '#7C3AED' },
          { label: 'Contas Ativas', value: ativos, icon: '', color: '#10B981' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 22 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: msg.type === 'success' ? '#F0FDF4' : '#EBF4FF',
          border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: msg.type === 'success' ? '#10B981' : '#005BAC',
        }}>
          {msg.type === 'success' ? '' : ''}{msg.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>Utilizadores Registados</h2>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Pesquisar..."
            style={{
              border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px',
              fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", width: 200,
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>A carregar utilizadores...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F0F0F0' }}>
                {['Utilizador', 'Email', 'Papel', 'Estado', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 22px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '13px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #005BAC, #005BAC)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0,
                      }}>
                        {(u.full_name || u.email)[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{u.full_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 22px', color: '#6B7280' }}>{u.email}</td>
                  <td style={{ padding: '13px 22px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: u.is_admin ? '#EDE9FE' : '#F3F4F6',
                      color: u.is_admin ? '#7C3AED' : '#6B7280',
                    }}>
                      {u.is_admin ? 'Admin' : 'Utilizador'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: u.is_active ? '#10B981' : '#005BAC' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: u.is_active ? '#10B981' : '#005BAC' }}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 22px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleAdmin(u)} style={{
                        fontSize: 12, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: '#EDE9FE', color: '#7C3AED', fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s',
                      }}>
                        {u.is_admin ? 'Retirar Admin' : 'Tornar Admin'}
                      </button>
                      {u.is_active && (
                        <button onClick={() => deactivate(u)} style={{
                          fontSize: 12, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                          background: '#EBF4FF', color: '#005BAC', fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'background 0.15s',
                        }}>
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
