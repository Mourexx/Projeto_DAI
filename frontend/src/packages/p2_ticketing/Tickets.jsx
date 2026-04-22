// Package {P2} Ticketing — 4SRS SIBCP v3
// Implements: {O2.1.c} buy ticket, {O2.2.c} list tickets, {O2.3.c} validate ticket
// UC2 – Gerir Bilhetica
import { useState, useEffect } from 'react'
import { ticketsApi, transportsApi } from '../../shared/services/api'
import { useAuth } from '../../shared/Context/AuthContext'
import { CheckCircle, Clock, XCircle, Plus, TicketIcon } from 'lucide-react'

const B = '#005BAC'
const TIPOS = {
  single_1coroa:   { label: 'Bilhete 1 Coroa',       precoFmt: '1,55 €', descricao: '1 zona — válido 60 minutos' },
  single_2coroa:   { label: 'Bilhete 2 Coroas',      precoFmt: '2,00 €', descricao: '2 zonas — válido 90 minutos' },
  transfer_1coroa: { label: 'Transbordo 1 Coroa',    precoFmt: '1,55 €', descricao: '1 zona + transbordo — válido 60 minutos' },
  transfer_2coroa: { label: 'Transbordo 2 Coroas',   precoFmt: '2,00 €', descricao: '2 zonas + transbordo — válido 90 minutos' },
  // Legados — apenas para exibição de bilhetes antigos
  single:   { label: 'Bilhete Simples', precoFmt: '', descricao: 'Válido por 2 horas' },
  daily:    { label: 'Bilhete Diário',  precoFmt: '', descricao: 'Válido por 24 horas' },
  monthly:  { label: 'Passe Mensal',    precoFmt: '', descricao: 'Válido por 30 dias' },
}
const STATUS = {
  active:  { label: 'Ativo',     bg: '#F0FDF4', color: '#16A34A' },
  used:    { label: 'Utilizado', bg: '#F8FAFC', color: '#64748B' },
  expired: { label: 'Expirado', bg: '#FEF2F2', color: '#DC2626' },
}
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TicketCard({ ticket, onValidar, validating }) {
  const tipo = TIPOS[ticket.type] || {}
  const busy = validating === ticket.id
  const s = STATUS[ticket.status] || STATUS['active']
  const isActive = ticket.status === 'active'
  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <TicketIcon size={22} color={isActive ? B : '#94A3B8'} strokeWidth={1.8} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1E293B' }}>{tipo.label}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{tipo.descricao}</div>
        </div>
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{s.label}</span>
      </div>
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: isActive ? B : '#94A3B8' }}>{ticket.price.toFixed(2)} €</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Comprado: {fmt(ticket.purchased_at)}</div>
        {ticket.valid_until && <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>Válido até: {fmt(ticket.valid_until)}</div>}
      </div>
      {isActive ? (
        <button onClick={() => onValidar(ticket.id)} disabled={busy} style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          cursor: busy ? 'not-allowed' : 'pointer',
          background: busy ? '#94A3B8' : B,
          color: 'white', fontWeight: 700, fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <CheckCircle size={14} />
          {busy ? 'A validar...' : 'Validar Bilhete'}
        </button>
      ) : (
        <div style={{
          width: '100%', padding: '10px', borderRadius: 8,
          background: '#F8FAFC', color: '#94A3B8',
          fontWeight: 600, fontSize: 13, textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {ticket.status === 'used' ? <><CheckCircle size={14} /> Já utilizado</> : <><XCircle size={14} /> Expirado</>}
        </div>
      )}
    </div>
  )
}

export default function Tickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [validating, setValidating] = useState(null)
  const [form, setForm] = useState({ type: 'single_1coroa', transport_id: '' })
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('bilhetes')

  const load = async () => {
    try {
      const [tRes, trRes] = await Promise.all([ticketsApi.getMyTickets(), transportsApi.list()])
      setTickets(tRes.data)
      setTransports(trRes.data)
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar bilhetes.' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const comprar = async (e) => {
    e.preventDefault()
    setBuying(true); setMsg(null)
    try {
      await ticketsApi.buy({ type: form.type, transport_id: form.transport_id ? parseInt(form.transport_id) : null })
      setMsg({ type: 'success', text: 'Bilhete comprado com sucesso!' })
      setTab('bilhetes')
      await load()
    } catch { setMsg({ type: 'error', text: 'Erro ao comprar bilhete.' }) }
    finally { setBuying(false) }
  }

  const validar = async (ticketId) => {
    setValidating(ticketId); setMsg(null)
    try {
      await ticketsApi.validate(ticketId)
      setMsg({ type: 'success', text: 'Bilhete validado com sucesso!' })
      await load()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Bilhete expirado') {
        setMsg({ type: 'error', text: 'Este bilhete já expirou e não pode ser validado.' })
      } else if (detail === 'Bilhete já foi utilizado') {
        setMsg({ type: 'error', text: 'Este bilhete já foi utilizado anteriormente.' })
      } else if (detail === 'Bilhete não encontrado') {
        setMsg({ type: 'error', text: 'Bilhete não encontrado.' })
      } else {
        setMsg({ type: 'error', text: detail || 'Erro ao validar bilhete. Tenta novamente.' })
      }
      await load() // recarrega para atualizar estado (ex: passou a expirado)
    } finally { setValidating(null) }
  }

  const ativos = tickets.filter(t => t.status === 'active')
  const historico = tickets.filter(t => t.status !== 'active')

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: '0 0 4px', letterSpacing: -0.3 }}>Bilhetes</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Olá, {user?.full_name?.split(' ')[0] || user?.email}</p>
        </div>
        <button onClick={() => { setTab('comprar'); setMsg(null) }} style={{
          padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: B, color: 'white', fontWeight: 600, fontSize: 13,
          fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} /> Comprar Bilhete
        </button>
      </div>

      {msg && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: msg.type === 'success' ? '#16A34A' : '#DC2626',
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0', width: 'fit-content', marginBottom: 24 }}>
        {[['bilhetes', `Os meus bilhetes (${tickets.length})`], ['comprar', 'Comprar']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t ? B : 'transparent',
            color: tab === t ? 'white' : '#64748B',
            fontWeight: tab === t ? 700 : 500, fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'bilhetes' && (
        loading ? <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>A carregar bilhetes...</div>
        : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <TicketIcon size={40} color="#CBD5E1" strokeWidth={1.2} style={{ marginBottom: 12 }} />
            <p style={{ color: '#64748B', fontWeight: 600, fontSize: 15, margin: '0 0 12px' }}>Ainda nao tens bilhetes.</p>
            <button onClick={() => setTab('comprar')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: B, color: 'white', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              Comprar o primeiro
            </button>
          </div>
        ) : (
          <div>
            {ativos.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Bilhetes Ativos ({ativos.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {ativos.map(t => <TicketCard key={t.id} ticket={t} onValidar={validar} validating={validating} />)}
                </div>
              </div>
            )}
            {historico.length > 0 && (
              <div>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Historico ({historico.length})</h2>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        {['Tipo', 'Preco', 'Comprado em', 'Valido ate', 'Estado'].map(h => (
                          <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map(t => {
                        const tipo = TIPOS[t.type] || {}
                        const s = STATUS[t.status] || {}
                        return (
                          <tr key={t.id} className="hover-row" style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '12px 20px', fontWeight: 600 }}>{tipo.label}</td>
                            <td style={{ padding: '12px 20px' }}>{t.price.toFixed(2)} €</td>
                            <td style={{ padding: '12px 20px', color: '#94A3B8' }}>{fmt(t.purchased_at)}</td>
                            <td style={{ padding: '12px 20px', color: '#94A3B8' }}>{fmt(t.valid_until)}</td>
                            <td style={{ padding: '12px 20px' }}>
                              <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{s.label}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* UC2.1 – Comprar Bilhete */}
      {tab === 'comprar' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px 26px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: '0 0 22px' }}>Comprar novo bilhete</h2>
            <form onSubmit={comprar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>Tipo de bilhete</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(TIPOS).filter(([key]) => !['single','daily','monthly'].includes(key)).map(([key, info]) => (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: 10, border: `2px solid ${form.type === key ? B : '#E2E8F0'}`,
                      background: form.type === key ? '#EBF4FF' : 'white', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="type" value={key} checked={form.type === key}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ display: 'none' }} />
                      <TicketIcon size={20} color={form.type === key ? B : '#CBD5E1'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{info.label}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{info.descricao}</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: B }}>{info.precoFmt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Transporte <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opcional)</span></label>
                <select value={form.transport_id} onChange={e => setForm(f => ({ ...f, transport_id: e.target.value }))} style={{ ...inp }}>
                  <option value="">Sem transporte especifico</option>
                  {transports.map(t => <option key={t.id} value={t.id}>{t.name} — Linha {t.line}</option>)}
                </select>
              </div>
              <button type="submit" disabled={buying} style={{
                padding: '12px', borderRadius: 8, border: 'none', cursor: buying ? 'not-allowed' : 'pointer',
                background: buying ? '#94A3B8' : B,
                color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
              }}>
                {buying ? 'A processar...' : `Comprar — ${TIPOS[form.type]?.precoFmt}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inp = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: 'white' }
