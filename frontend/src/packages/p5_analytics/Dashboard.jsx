// Package {P5} Analytics — 4SRS SIBCP v3
// Implements: {O5.1.c} KPIs, {O5.2.c} dashboard
import { useState, useEffect } from 'react'
import { statsApi } from '../../shared/services/api'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/Context/AuthContext'
import { Ticket, TrendingUp, Bus, MapPin, AlertTriangle, ChevronRight, Activity } from 'lucide-react'

const B = '#005BAC'
const R = '#E3001B'

function KPI({ title, value, sub, Icon, accent, trend }) {
  return (
    <div className="hover-card" style={{
      background: 'white', borderRadius: 14, border: '1px solid #E2E8F0',
      padding: '22px', overflow: 'hidden', position: 'relative',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: accent + '08' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#1E293B', letterSpacing: -1, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 4 }}>{title}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{sub}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={accent} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

function AlertRow({ linha, name, descricao, estado }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, marginBottom: 8,
      background: estado === 'critical' ? '#FEF2F2' : '#FFFBEB',
      borderLeft: `3px solid ${estado === 'critical' ? R : '#F59E0B'}`,
      border: `1px solid ${estado === 'critical' ? '#FECACA' : '#FDE68A'}`,
      borderLeftWidth: 3,
    }}>
      <AlertTriangle size={15} color={estado === 'critical' ? R : '#F59E0B'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>Linha {linha} — {name}</div>
        <div style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{descricao}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: estado === 'critical' ? R : '#F59E0B', color: 'white', textTransform: 'uppercase', flexShrink: 0 }}>
        {estado === 'critical' ? 'Crítico' : 'Atenção'}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [occupancy, setOccupancy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const agora = new Date().toLocaleString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    Promise.all([statsApi.getOverview(), statsApi.getOccupancy()])
      .then(([overRes, occRes]) => {
        setStats(overRes.data)
        setOccupancy(occRes.data)
        setAlerts(occRes.data.filter(t => t.occupancy_pct >= 75).map(t => ({
          linha: t.line, name: t.name,
          descricao: `Ocupação de ${t.occupancy_pct}% (${t.current_occupancy}/${t.capacity} passageiros)`,
          estado: t.occupancy_pct >= 90 ? 'critical' : 'warning',
        })))
      })
      .catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  const top5 = [...occupancy].sort((a, b) => b.occupancy_pct - a.occupancy_pct).slice(0, 5)

  if (error) return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#DC2626', textAlign: 'center', padding: 60, background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA' }}>
        Erro ao carregar o dashboard. Tenta novamente mais tarde.
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: '0 0 4px', letterSpacing: -0.5 }}>
            Bom dia{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, textTransform: 'capitalize' }}>{agora}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/alerts" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${B}`, cursor: 'pointer', background: 'white', color: B, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> Alertas {alerts.length > 0 && <span style={{ background: R, color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{alerts.length}</span>}
            </button>
          </Link>
          <Link to="/map" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: B, color: 'white', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 8px ${B}40` }}>
              <MapPin size={14} /> Mapa ao Vivo
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {loading ? [...Array(4)].map((_, i) => <div key={i} style={{ background: 'white', borderRadius: 14, height: 100, border: '1px solid #E2E8F0', opacity: 0.4 }} />)
        : <>
          <KPI title="Total de Bilhetes" value={stats?.total_tickets ?? '—'} sub={`${stats?.active_tickets ?? 0} ativos`} Icon={Ticket} accent={B} />
          <KPI title="Receita Total" value={`${(stats?.total_revenue ?? 0).toFixed(2)} €`} sub="Acumulado" Icon={TrendingUp} accent="#10B981" />
          <KPI title="Transportes Ativos" value={stats?.active_transports ?? '—'} sub="Em operação" Icon={Bus} accent="#F59E0B" />
          <KPI title="Viagens em Curso" value={stats?.viagens_em_curso ?? '—'} sub="Neste momento" Icon={Activity} accent="#8B5CF6" />
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Alertas */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color={R} /> Alertas Ativos
              {alerts.length > 0 && <span style={{ background: R, color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>{alerts.length}</span>}
            </h3>
            <Link to="/alerts" style={{ fontSize: 12, color: B, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>Ver todos <ChevronRight size={13} /></Link>
          </div>
          {alerts.length === 0
            ? <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: 13 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <Activity size={18} color="#10B981" />
                </div>
                Operação normal — sem alertas
              </div>
            : alerts.slice(0, 4).map((a, i) => <AlertRow key={i} {...a} />)
          }
        </div>

        {/* Ocupacao */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bus size={16} color={B} /> Ocupação da Frota
            </h3>
            <Link to="/transports" style={{ fontSize: 12, color: B, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>Ver todos <ChevronRight size={13} /></Link>
          </div>
          {top5.length === 0
            ? <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '28px 0' }}>A carregar...</div>
            : top5.map(t => {
              const color = t.occupancy_pct >= 90 ? R : t.occupancy_pct >= 70 ? '#F59E0B' : '#10B981'
              return (
                <div key={t.id} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{t.name}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>Linha {t.line}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color, background: color + '15', padding: '1px 8px', borderRadius: 20 }}>{t.occupancy_pct}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${Math.min(t.occupancy_pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>{t.current_occupancy}/{t.capacity} passageiros</div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Acesso Rapido */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Acesso Rápido</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { to: '/tickets', Icon: Ticket, label: 'Comprar Bilhete', sub: 'Adquirir título de transporte', color: B },
            { to: '/map', Icon: MapPin, label: 'Mapa em Tempo Real', sub: 'Ver localização dos veículos', color: '#10B981' },
            { to: '/analytics', Icon: TrendingUp, label: 'Análise de Dados', sub: 'Dashboards e estatísticas', color: '#8B5CF6' },
            { to: '/transports', Icon: Bus, label: 'Gestão da Frota', sub: 'Gerir transportes ativos', color: '#F59E0B' },
          ].map(({ to, Icon, label, sub, color }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '18px 16px', borderRadius: 12, border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '08'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
