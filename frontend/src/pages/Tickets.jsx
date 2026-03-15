import { useState, useEffect } from 'react'
import { ticketsApi, transportsApi } from '../services/api'
import { useAuth } from '../Context/AuthContext'

const TIPOS = {
  single:  { label: 'Bilhete Simples',  preco: '1,50 €', descricao: 'Válido por 2 horas', icone: '🎫' },
  daily:   { label: 'Bilhete Diário',   preco: '5,00 €', descricao: 'Válido por 24 horas', icone: '📅' },
  monthly: { label: 'Passe Mensal',     preco: '40,00 €', descricao: 'Válido por 30 dias', icone: '🗓️' },
}

const STATUS_BADGE = {
  active:  { label: 'Ativo',     cls: 'bg-green-100 text-green-700' },
  used:    { label: 'Utilizado', cls: 'bg-gray-100 text-gray-500' },
  expired: { label: 'Expirado', cls: 'bg-red-100 text-red-600' },
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Tickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [validating, setValidating] = useState(null)
  const [form, setForm] = useState({ type: 'single', transport_id: '' })
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('bilhetes')

  const load = async () => {
    try {
      const [tRes, trRes] = await Promise.all([
        ticketsApi.getMyTickets(),
        transportsApi.list(),
      ])
      setTickets(tRes.data)
      setTransports(trRes.data)
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar bilhetes.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const comprar = async (e) => {
    e.preventDefault()
    setBuying(true)
    setMsg(null)
    try {
      await ticketsApi.buy({
        type: form.type,
        transport_id: form.transport_id ? parseInt(form.transport_id) : null,
      })
      setMsg({ type: 'success', text: 'Bilhete comprado com sucesso!' })
      setTab('bilhetes')
      await load()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao comprar bilhete. Tenta novamente.' })
    } finally {
      setBuying(false)
    }
  }

  const validar = async (ticketId) => {
    setValidating(ticketId)
    setMsg(null)
    try {
      await ticketsApi.validate(ticketId)
      setMsg({ type: 'success', text: 'Bilhete validado com sucesso!' })
      await load()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erro ao validar bilhete.'
      setMsg({ type: 'error', text: detail })
    } finally {
      setValidating(null)
    }
  }

  const ativos = tickets.filter(t => t.status === 'active')
  const historico = tickets.filter(t => t.status !== 'active')

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎫 Bilhetes</h1>
          <p className="text-sm text-gray-400 mt-1">Olá, {user?.full_name || user?.email}</p>
        </div>
        <button
          onClick={() => { setTab('comprar'); setMsg(null) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + Comprar Bilhete
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          msg.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {msg.type === 'success' ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {['bilhetes', 'comprar'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'bilhetes' ? `Os meus bilhetes (${tickets.length})` : 'Comprar'}
          </button>
        ))}
      </div>

      {tab === 'bilhetes' && (
        loading ? (
          <div className="text-center py-16 text-gray-400">A carregar bilhetes...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎫</div>
            <p className="text-gray-500 font-medium">Ainda não tens bilhetes.</p>
            <button onClick={() => setTab('comprar')} className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
              Comprar o primeiro bilhete →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {ativos.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bilhetes Ativos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ativos.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} onValidar={validar} validating={validating} />
                  ))}
                </div>
              </div>
            )}
            {historico.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h2>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">Tipo</th>
                        <th className="px-5 py-3 text-left">Preço</th>
                        <th className="px-5 py-3 text-left">Comprado em</th>
                        <th className="px-5 py-3 text-left">Válido até</th>
                        <th className="px-5 py-3 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {historico.map(t => {
                        const tipo = TIPOS[t.type] || {}
                        const badge = STATUS_BADGE[t.status] || {}
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-medium">{tipo.icone} {tipo.label}</td>
                            <td className="px-5 py-3">{t.price.toFixed(2)} €</td>
                            <td className="px-5 py-3 text-gray-400">{fmt(t.purchased_at)}</td>
                            <td className="px-5 py-3 text-gray-400">{fmt(t.valid_until)}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
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

      {tab === 'comprar' && (
        <div className="max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Comprar novo bilhete</h2>
            <form onSubmit={comprar} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de bilhete</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(TIPOS).map(([key, info]) => (
                    <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.type === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="type" value={key} checked={form.type === key}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="hidden" />
                      <span className="text-2xl">{info.icone}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{info.label}</p>
                        <p className="text-xs text-gray-400">{info.descricao}</p>
                      </div>
                      <span className="font-bold text-blue-600">{info.preco}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transporte <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select value={form.transport_id} onChange={e => setForm(f => ({ ...f, transport_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">— Sem transporte específico —</option>
                  {transports.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — Linha {t.line}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={buying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
                {buying ? 'A processar...' : `Comprar — ${TIPOS[form.type]?.preco}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TicketCard({ ticket, onValidar, validating }) {
  const tipo = TIPOS[ticket.type] || {}
  const isValidating = validating === ticket.id
  return (
    <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-3xl">{tipo.icone}</span>
          <p className="font-bold text-gray-800 mt-1">{tipo.label}</p>
          <p className="text-xs text-gray-400">{tipo.descricao}</p>
        </div>
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Ativo</span>
      </div>
      <div className="space-y-1 text-xs text-gray-400 mb-4">
        <p>Comprado: {new Date(ticket.purchased_at).toLocaleString('pt-PT')}</p>
        {ticket.valid_until && (
          <p>Válido até: <span className="text-gray-600 font-medium">{new Date(ticket.valid_until).toLocaleString('pt-PT')}</span></p>
        )}
        <p className="text-base font-bold text-blue-600 mt-2">{ticket.price.toFixed(2)} €</p>
      </div>
      <button onClick={() => onValidar(ticket.id)} disabled={isValidating}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
        {isValidating ? 'A validar...' : '✅ Validar Bilhete'}
      </button>
    </div>
  )
}
