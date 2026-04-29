
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/Context/AuthContext.jsx'
import tubLogo from '../../assets/Logo_letra_Vermelha.jpg'
import tubVideo from '../../assets/Video_TUB.mp4'

const B = '#005BAC'
const B2 = '#0072D6'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.email, form.full_name, form.password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Email já registado') setError('Este email já tem conta. Faz login.')
      else if (err.response?.status === 401) setError('Email ou password incorretos.')
      else setError('Ocorreu um erro. Tenta novamente.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Vídeo de fundo em loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src={tubVideo} type="video/mp4" />
      </video>

      {/* Overlay escuro por cima do vídeo para legibilidade */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,40,100,0.72) 0%, rgba(0,20,60,0.80) 100%)',
        zIndex: 1,
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 440,
        margin: '24px',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}>
        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${B}, ${B2}, #00A8E8)` }} />

        <div style={{ padding: '36px 40px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', borderRadius: 16, padding: '10px 18px',
              boxShadow: '0 2px 16px rgba(0,91,172,0.10)',
              border: '1px solid #E2E8F0',
              marginBottom: 14,
            }}>
              <img src={tubLogo} alt="TUB" style={{ height: 48, maxWidth: 160, objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: '0 0 4px', letterSpacing: -0.3 }}>
              Plataforma de Gestao
            </h1>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>
              Transportes Urbanos de Braga
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[['login', 'Iniciar Sessao'], ['register', 'Criar Conta']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '9px', borderRadius: 7, border: 'none',
                background: mode === m ? B : 'transparent',
                color: mode === m ? 'white' : '#64748B',
                fontWeight: mode === m ? 700 : 500, fontSize: 13,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={lbl}>Nome completo</label>
                <input name="full_name" value={form.full_name} onChange={handle}
                  placeholder="Joao Silva" style={inp}
                  onFocus={e => { e.target.style.borderColor = B; e.target.style.boxShadow = `0 0 0 3px ${B}20` }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
              </div>
            )}
            <div>
              <label style={lbl}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                required placeholder="email@exemplo.pt" style={inp}
                onFocus={e => { e.target.style.borderColor = B; e.target.style.boxShadow = `0 0 0 3px ${B}20` }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                required placeholder="••••••••" style={inp}
                onFocus={e => { e.target.style.borderColor = B; e.target.style.boxShadow = `0 0 0 3px ${B}20` }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '13px',
              background: loading ? '#94A3B8' : B,
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: loading ? 'none' : `0 4px 16px ${B}50`,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = B2 }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = B }}
            >
              {loading ? 'A processar...' : mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#CBD5E1', marginTop: 20, marginBottom: 0 }}>
            Demo: admin@tub.pt / admin123
          </p>
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inp = {
  width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '11px 14px', fontSize: 14, outline: 'none',
  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', background: 'white',
  boxSizing: 'border-box',
}
