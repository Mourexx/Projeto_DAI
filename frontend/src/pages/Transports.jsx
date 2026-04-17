import { useState, useEffect } from 'react'
import { transportsApi } from '../services/api'
import { useAuth } from '../Context/AuthContext'

const TYPE_LABEL = { bus: 'Autocarro', tram: '🚃 Elétrico', metro: 'Metro' }

export default function Transports() {
  const { user } = useAuth()
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('lista')
  const [form, setForm] = useState({ name: '', type: 'bus', line: '', capacity: 50 })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('occupancy')

  const load = async () => {
    try {
      const r = await transportsApi.list()
      setTransports(r.data)
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar transportes.' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const adicionar = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      await transportsApi.create({ ...form, capacity: parseInt(form.capacity) })
      setMsg({ type: 'success', text: 'Transporte adicionado!' })
      setTab('lista')
      setForm({ name: '', type: 'bus', line: '', capacity: 50 })
      await load()
    } catch { setMsg({ type: 'error', text: 'Erro ao adicionar transporte.' }) }
    finally { setSaving(false) }
  }

  let filtrados = transports.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.line.toLowerCase().includes(search.toLowerCase())
  )

  if (sortBy === 'occupancy') filtrados = [...filtrados].sort((a, b) => {
    const pa = a.capacity > 0 ? (a.current_occupancy / a.capacity) : 0
    const pb = b.capacity > 0 ? (b.current_occupancy / b.capacity) : 0
    return pb - pa
  })

  const avgOcc = transports.length > 0
    ? Math.round(transports.reduce((acc, t) => acc + (t.capacity > 0 ? (t.current_occupancy / t.capacity) * 100 : 0), 0) / transports.length)
    : 0
  const overloaded = transports.filter(t => t.capacity > 0 && (t.current_occupancy / t.capacity) >= 0.85).length

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
            🚌 Transportes
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{transports.length} veículos ativos</p>
        </div>
        {user?.is_admin && (
          <button onClick={() => { setTab('adicionar'); setMsg(null) }} style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #005BAC, #005BAC)',
            color: 'white', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          }}>+ Adicionar</button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Frota Ativa', value: transports.length, icon: '🚌', color: '#005BAC' },
          { label: 'Ocupação Média', value: `${avgOcc}%`, icon: '📊', color: '#005BAC' },
          { label: 'Com Sobrelotação', value: overloaded, icon: '', color: '#F59E0B' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{item.label}</div>
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

      {user?.is_admin && (
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0', width: 'fit-content', marginBottom: 20 }}>
          {[['lista', 'Lista'], ['adicionar', '+ Adicionar']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t ? '#005BAC' : 'transparent',
              color: tab === t ? 'white' : '#6B7280',
              fontWeight: tab === t ? 700 : 500, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      {tab === 'lista' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Pesquisar por nome ou linha..."
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 14px', fontSize: 13,
                outline: 'none', fontFamily: "'DM Sans', sans-serif", background: 'white', width: 280,
              }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 14px', fontSize: 13,
              outline: 'none', fontFamily: "'DM Sans', sans-serif", background: 'white',
            }}>
              <option value="occupancy">Ordenar por Ocupação</option>
              <option value="default">Padrão</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>A carregar transportes...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Nenhum transporte encontrado.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {filtrados.map(t => {
                const pct = t.capacity > 0 ? Math.round((t.current_occupancy / t.capacity) * 100) : 0
                const color = pct >= 85 ? '#005BAC' : pct >= 65 ? '#F59E0B' : '#10B981'
                return (
                  <div key={t.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{TYPE_LABEL[t.type]}</div>
                      </div>
                      <span style={{ background: '#EBF4FF', color: '#005BAC', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        Linha {t.line}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Ocupação</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{t.current_occupancy}/{t.capacity} passageiros</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'adicionar' && user?.is_admin && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px 26px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 22px' }}>Novo transporte</h2>
            <form onSubmit={adicionar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Nome</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ex: TUB-009" style={inp}
                  onFocus={e => e.target.style.borderColor = '#005BAC'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                    <option value="bus">Autocarro</option>
                    <option value="tram">Elétrico</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Linha</label>
                  <input required value={form.line} onChange={e => setForm(f => ({ ...f, line: e.target.value }))}
                    placeholder="ex: L3" style={inp}
                    onFocus={e => e.target.style.borderColor = '#005BAC'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
              </div>
              <div>
                <label style={lbl}>Capacidade</label>
                <input type="number" min="1" required value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} style={inp}
                  onFocus={e => e.target.style.borderColor = '#005BAC'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <button type="submit" disabled={saving} style={{
                padding: '12px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #005BAC, #005BAC)',
                color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              }}>
                {saving ? 'A guardar...' : 'Adicionar Transporte'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inp = {
  width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '10px 14px', fontSize: 14, outline: 'none',
  fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s', background: 'white',
}
