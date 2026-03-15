import { useState, useEffect } from 'react'
import { transportsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const TYPE_LABEL = { bus: '🚌 Autocarro', tram: '🚃 Elétrico', metro: '🚇 Metro' }

function OcupBar({ pct }) {
  const color = pct >= 85 ? 'bg-red-500' : pct >= 65 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function Transports() {
  const { user } = useAuth()
  const [transports, setTransports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('lista') // 'lista' | 'adicionar'
  const [form, setForm] = useState({ name: '', type: 'bus', line: '', capacity: 50 })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await transportsApi.list()
      setTransports(r.data)
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar transportes.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const adicionar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await transportsApi.create({ ...form, capacity: parseInt(form.capacity) })
      setMsg({ type: 'success', text: 'Transporte adicionado com sucesso!' })
      setTab('lista')
      setForm({ name: '', type: 'bus', line: '', capacity: 50 })
      await load()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao adicionar transporte.' })
    } finally {
      setSaving(false)
    }
  }

  const filtrados = transports.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.line.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🚌 Transportes</h1>
          <p className="text-sm text-gray-400 mt-1">{transports.length} veículos ativos</p>
        </div>
        {user?.is_admin && (
          <button onClick={() => { setTab('adicionar'); setMsg(null) }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {msg.type === 'success' ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}

      {user?.is_admin && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {['lista', 'adicionar'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'lista' ? 'Lista' : 'Adicionar'}
            </button>
          ))}
        </div>
      )}

      {tab === 'lista' && (
        <>
          <div className="mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Pesquisar por nome ou linha..."
              className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">A carregar transportes...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Nenhum transporte encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map(t => {
                const pct = t.capacity > 0 ? Math.round((t.current_occupancy / t.capacity) * 100) : 0
                const statusColor = pct >= 85 ? 'text-red-600' : pct >= 65 ? 'text-yellow-600' : 'text-green-600'
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800">{t.name}</p>
                        <p className="text-xs text-gray-400">{TYPE_LABEL[t.type]}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">Linha {t.line}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Ocupação</span>
                        <span className={`font-semibold ${statusColor}`}>{pct}% ({t.current_occupancy}/{t.capacity})</span>
                      </div>
                      <OcupBar pct={pct} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'adicionar' && user?.is_admin && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Novo transporte</h2>
            <form onSubmit={adicionar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ex: Autocarro 42"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="bus">Autocarro</option>
                    <option value="tram">Elétrico</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
                  <input required value={form.line} onChange={e => setForm(f => ({ ...f, line: e.target.value }))}
                    placeholder="ex: L3"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (passageiros)</label>
                <input type="number" min="1" required value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
                {saving ? 'A guardar...' : 'Adicionar Transporte'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
