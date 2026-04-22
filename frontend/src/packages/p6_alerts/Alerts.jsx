// Package {P6} Alerts — 4SRS SIBCP v3
// Implements: {O6.1.c} alert detection, {O6.2.c} anomaly detection, {O6.3.c} sensor failure detection
// UC6 – Gerar Alertas e Notificações
// UC6.1 – Detetar Sobrelotação
// UC6.2 – Detetar Anomalias de Procura
// UC6.3 – Detetar Falhas de Leitura / Ausência de Dados
import { useState, useEffect } from 'react'
import { statsApi } from '../../shared/services/api'

function AlertCard({ type, title, description, severity, timestamp, linha }) {
  const cfg = {
    critical: { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', badge: '#DC2626', label: 'Crítico', icon: '🔴' },
    warning:  { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', badge: '#F59E0B', label: 'Atenção', icon: '🟡' },
    info:     { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', badge: '#3B82F6', label: 'Info',    icon: '🔵' },
  }[severity] || { bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF', badge: '#9CA3AF', label: 'Normal', icon: '⚪' }

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10, padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>{title}</span>
            {linha && <span style={{ marginLeft: 8, fontSize: 11, background: '#1A1A1A', color: 'white', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>Linha {linha}</span>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: cfg.badge, color: 'white', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#4B5563', margin: 0 }}>{description}</p>
        {timestamp && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>🕐 {timestamp}</p>}
      </div>
    </div>
  )
}

export default function Alerts() {
  const [alertData, setAlertData] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')

  const now = new Date().toLocaleString('pt-PT', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  })

  const load = () => {
    setLoading(true)
    statsApi.getAlerts()
      .then(r => setAlertData(r.data))
      .catch(() => setAlertData({ total: 0, critical: 0, warning: 0, alerts: [] }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)   // atualiza a cada 15s
    return () => clearInterval(id)
  }, [])

  // Map backend alerts to display format
  const allAlerts = (alertData?.alerts || []).map(a => ({
    type: a.type,
    title: a.type === 'sobrelotacao_critica' ? `Sobrelotação Crítica — ${a.transport_name}`
         : a.type === 'sobrelotacao'         ? `Sobrelotação — ${a.transport_name}`
         : a.type === 'anomalia_procura'     ? `Baixa Procura — ${a.transport_name}`
         : a.transport_name,
    description: a.message,
    severity: a.severity,
    linha: a.line,
    timestamp: now,
  }))

  const filtered = filter === 'all'      ? allAlerts
    : filter === 'critical' ? allAlerts.filter(a => a.severity === 'critical')
    : filter === 'warning'  ? allAlerts.filter(a => a.severity === 'warning')
    : allAlerts.filter(a => a.severity === 'info')

  const counts = {
    all:      allAlerts.length,
    critical: alertData?.critical || 0,
    warning:  alertData?.warning  || 0,
    info:     allAlerts.filter(a => a.severity === 'info').length,
  }

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#F4F6F9', overflowY: 'auto' }} className="animate-fadeIn">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: -0.3 }}>
            Sistema de Alertas
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
            UC6 · Deteção automática de sobrelotação, anomalias e falhas de leitura
          </p>
        </div>
        <button onClick={load} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
          background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          color: '#64748B', fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔄 Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { key: 'all',      label: 'Total',   color: '#1A1A1A', bg: 'white' },
          { key: 'critical', label: 'Críticos', color: '#DC2626', bg: 'white' },
          { key: 'warning',  label: 'Atenção',  color: '#F59E0B', bg: 'white' },
          { key: 'info',     label: 'Info',     color: '#3B82F6', bg: 'white' },
        ].map(({ key, label, color, bg }) => (
          <div key={key} onClick={() => setFilter(key)} style={{
            background: filter === key ? color : bg,
            borderRadius: 12, border: `1.5px solid ${filter === key ? color : '#E2E8F0'}`,
            padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: filter === key ? 'white' : color }}>{counts[key]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: filter === key ? 'rgba(255,255,255,0.8)' : '#6B7280', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Alertas Ativos — {filtered.length} resultado(s)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: loading ? '#F59E0B' : counts.all > 0 ? '#EF4444' : '#10B981',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              {loading ? 'A verificar...' : 'Monitorização ativa'}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>A verificar alertas...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>
              {filter === 'all' ? 'Nenhum alerta ativo — operação normal' : `Nenhum alerta do tipo "${filter}"`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((a, i) => <AlertCard key={i} {...a} />)}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 22px', marginTop: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px' }}>Legenda dos Alertas</h4>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { icon: '🔴', label: 'Sobrelotação Crítica', desc: 'Ocupação ≥ 90% — reforço urgente' },
            { icon: '🟡', label: 'Atenção',              desc: 'Ocupação ≥ 75% — monitorizar' },
            { icon: '🔵', label: 'Anomalia de Procura',  desc: 'Ocupação < 5% — possível erro de leitura' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
