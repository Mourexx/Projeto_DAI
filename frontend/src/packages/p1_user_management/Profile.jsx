// Package {P1} User Management — 4SRS SIBCP v3
// Implements: {O1.3.c} profile management
import { useState } from 'react'
import { useAuth } from '../../shared/Context/AuthContext'
import api from '../../shared/services/api'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', password: '', confirm: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (form.password && form.password !== form.confirm) {
      setMsg({ type: 'error', text: 'As passwords não coincidem.' })
      return
    }
    setLoading(true)
    try {
      const payload = { full_name: form.full_name }
      if (form.password) payload.password = form.password
      await api.patch('/users/me', payload)
      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso.' })
      setForm(f => ({ ...f, password: '', confirm: '' }))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erro ao atualizar.' })
    } finally {
      setLoading(false)
    }
  }

  const initials = (user?.full_name || user?.email || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>O Meu Perfil</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>UC1.3 · Consultar e editar informações da conta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Info card */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '28px 24px', textAlign: 'center', height: 'fit-content' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #005BAC, #005BAC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'white', fontWeight: 800,
          }}>{initials}</div>
          <p style={{ fontWeight: 800, fontSize: 17, color: '#1A1A1A', margin: '0 0 4px' }}>{user?.full_name || 'Sem nome'}</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px', wordBreak: 'break-all' }}>{user?.email}</p>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: user?.is_admin ? '#EDE9FE' : '#EBF4FF',
            color: user?.is_admin ? '#7C3AED' : '#005BAC',
          }}>
            {user?.is_admin ? 'Administrador' : 'Utilizador'}
          </span>

          <div style={{ marginTop: 24, padding: '14px', background: '#F9FAFB', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Estado da Conta</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} className="pulse-dot" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Ativa</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px 28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 22px' }}>Editar Dados</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input disabled value={user?.email || ''} style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>O email não pode ser alterado.</p>
            </div>
            <div>
              <label style={labelStyle}>Nome Completo</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#005BAC'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </div>

            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 18 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: '0 0 14px' }}>
                Alterar Password <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nova Password</label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#005BAC'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
                <div>
                  <label style={labelStyle}>Confirmar Password</label>
                  <input type="password" value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#005BAC'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
              </div>
            </div>

            {msg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                color: msg.type === 'success' ? '#10B981' : '#DC2626',
                fontWeight: 600,
              }}>
                {msg.type === 'success' ? '' : ''}{msg.text}
              </div>
            )}

            <div>
              <button type="submit" disabled={loading} style={{
                padding: '11px 24px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #005BAC, #005BAC)',
                color: 'white', fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}>
                {loading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle = {
  width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '10px 14px', fontSize: 14, outline: 'none',
  fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s', background: 'white',
}
