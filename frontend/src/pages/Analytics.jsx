// UC5 – Analisar Dados e Estatísticas
// UC5.1 – Visualizar KPIs
// UC5.2 – Visualizar Dashboard Analítico
// UC5.3 – Analisar Ocupação dos Veículos
// UC5.4 – Analisar Validações e Bilhetes
// UC5.5 – Analisar Histórico de Dados
import { useState, useEffect } from 'react'
import { statsApi } from '../services/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#005BAC', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#EF4444']

const KPI = ({ title, value, sub, icon, accent }) => (
  <div style={{
    background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
    padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
      background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', marginTop: 1 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
    </div>
  </div>
)

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [occupancy, setOccupancy] = useState([])
  const [viagens, setViagens] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      statsApi.getTicketsByType(),
      statsApi.getOccupancy(),
      statsApi.getViagens(),
    ]).then(([ov, tt, occ, vg]) => {
      setOverview(ov.data)
      setTicketTypes(tt.data.map(t => ({
        name: { single: 'Simples', daily: 'Diário', monthly: 'Mensal' }[t.type] || t.type,
        value: t.count,
      })))
      setOccupancy(occ.data.map(t => ({
        name: t.name,
        linha: t.line,
        pct: t.occupancy_pct,
        atual: t.current_occupancy,
        cap: t.capacity,
      })))
      setViagens(vg.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'tickets', label: 'Bilhetes' },
    { id: 'occupancy', label: 'Ocupação' },
    { id: 'trips', label: 'Viagens' },
  ]

  if (loading) {
    return (
      <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 60 }}>A carregar dados analíticos...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
          Análise de Dados
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          Dashboard analítico — UC5 · Estatísticas, KPIs e histórico
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0', width: 'fit-content', marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? '#005BAC' : 'transparent',
            color: activeTab === t.id ? 'white' : '#6B7280',
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview Tab — UC5.1 */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <KPI title="Total Bilhetes" value={overview?.total_tickets ?? '—'} sub={`${overview?.active_tickets ?? 0} ativos`} icon="🎫" accent="#005BAC" />
            <KPI title="Receita Total" value={`${(overview?.total_revenue ?? 0).toFixed(2)} €`} sub="Acumulado" icon="💶" accent="#10B981" />
            <KPI title="Transportes" value={overview?.active_transports ?? '—'} sub="Em operação" icon="🚌" accent="#005BAC" />
            <KPI title="Viagens em Curso" value={overview?.viagens_em_curso ?? '—'} sub="Neste momento" icon="📍" accent="#8B5CF6" />
          </div>

          {viagens && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              <KPI title="Total Viagens" value={viagens.total_viagens} sub="Registadas" icon="" accent="#3B82F6" />
              <KPI title="Total Entradas" value={viagens.total_entradas} sub="Passageiros embarcados" icon="" accent="#10B981" />
              <KPI title="Total Saídas" value={viagens.total_saidas} sub="Passageiros desembarcados" icon="" accent="#F59E0B" />
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Ocupação Atual por Veículo</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={occupancy.slice(0, 8)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Ocupação']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
                <Bar dataKey="pct" fill="#005BAC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tickets Tab — UC5.4 */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Bilhetes por Tipo</h3>
            {ticketTypes.length === 0 ? (
              <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>Sem dados de bilhetes</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ticketTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ticketTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Resumo de Bilhetes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#EBF4FF', borderRadius: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>🎫 Total de Bilhetes</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#005BAC' }}>{overview?.total_tickets ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#F0FDF4', borderRadius: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Bilhetes Ativos</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#10B981' }}>{overview?.active_tickets ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#EBF4FF', borderRadius: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>💶 Receita Acumulada</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#005BAC' }}>{(overview?.total_revenue ?? 0).toFixed(2)} €</span>
              </div>
              {ticketTypes.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                    {t.name}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Occupancy Tab — UC5.3 */}
      {activeTab === 'occupancy' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Ocupação por Veículo — Todos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {occupancy.map((t, i) => {
                const color = t.pct >= 90 ? '#005BAC' : t.pct >= 70 ? '#F59E0B' : '#10B981'
                return (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Linha {t.linha}</div>
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 800, color,
                        background: color + '18', padding: '4px 10px', borderRadius: 8,
                      }}>{t.pct}%</div>
                    </div>
                    <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(t.pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{t.atual}/{t.cap} passageiros</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trips Tab — UC5.5 */}
      {activeTab === 'trips' && viagens && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Histórico de Viagens</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total de Viagens', value: viagens.total_viagens, icon: '', color: '#3B82F6' },
                { label: 'Viagens em Curso', value: viagens.viagens_em_curso, icon: '', color: '#10B981' },
                { label: 'Viagens Concluídas', value: viagens.total_viagens - viagens.viagens_em_curso, icon: '', color: '#6B7280' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: item.color + '10', borderRadius: 10 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px' }}>Contagem de Passageiros</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Entradas', value: viagens.total_entradas },
                { name: 'Saídas', value: viagens.total_saidas },
                { name: 'Saldo', value: viagens.total_entradas - viagens.total_saidas },
              ]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="value" fill="#005BAC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
