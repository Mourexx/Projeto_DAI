// Package {P4} Fleet Monitoring — 4SRS SIBCP v3
import { useState } from 'react'

export default function LineFilter({ lines, activeLines, onToggle, busCount }) {
  const [collapsed, setCollapsed] = useState(false)

  const allActive = lines.every(l => activeLines.includes(l.id))
  const noneActive = lines.every(l => !activeLines.includes(l.id))

  const handleToggleAll = () => {
    if (allActive) {
      // desativar todas
      lines.forEach(l => { if (activeLines.includes(l.id)) onToggle(l.id) })
    } else {
      // ativar todas
      lines.forEach(l => { if (!activeLines.includes(l.id)) onToggle(l.id) })
    }
  }

  return (
    <div style={styles.panel} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>🚌</span>
          <span style={styles.panelTitle}>Linhas</span>
          <span style={styles.badge}>{activeLines.length}/{lines.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Botão Todas / Nenhuma */}
          <button
            onClick={handleToggleAll}
            title={allActive ? 'Desativar todas' : 'Ativar todas'}
            style={{
              ...styles.toggleAllBtn,
              background: allActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: allActive ? '#FCA5A5' : '#86EFAC',
              borderColor: allActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
            }}
          >
            {allActive ? '✕ Ocultar todas' : '✓ Mostrar todas'}
          </button>
          {/* Colapsar */}
          <button style={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            <span style={styles.chevron}>{collapsed ? '▶' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Lista de linhas */}
      {!collapsed && (
        <div style={styles.lineList}>
          {lines.map(line => {
            const active = activeLines.includes(line.id)
            const count  = busCount[line.id] || 0
            return (
              <button
                key={line.id}
                onClick={() => onToggle(line.id)}
                title={active ? `Ocultar ${line.id}` : `Mostrar ${line.id}`}
                style={{
                  ...styles.lineBtn,
                  borderColor: active ? line.color : 'rgba(255,255,255,0.1)',
                  backgroundColor: active ? line.color + '22' : 'rgba(255,255,255,0.03)',
                  opacity: active ? 1 : 0.45,
                }}
              >
                {/* Indicador ativo/inativo */}
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: active ? line.color : 'rgba(255,255,255,0.2)',
                  boxShadow: active ? `0 0 6px ${line.color}` : 'none',
                  transition: 'all 0.2s',
                }} />

                <span style={{ ...styles.lineBadge, backgroundColor: active ? line.color : 'rgba(255,255,255,0.12)' }}>
                  {line.id}
                </span>

                <span style={{ ...styles.lineName, color: active ? '#e2e8f0' : '#666' }}>
                  {line.name}
                </span>

                {/* Contagem de autocarros */}
                <span style={{
                  ...styles.busCount,
                  color: active ? line.color : '#444',
                  background: active ? line.color + '22' : 'transparent',
                  borderRadius: 6, padding: '1px 6px',
                }}>
                  {count} 🚌
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  panel: {
    position: 'absolute', top: 16, left: 16, zIndex: 1500,
    background: 'rgba(10,14,23,0.94)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, minWidth: 240, overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    pointerEvents: 'auto',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 12px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  icon: { fontSize: 15 },
  panelTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.3,
  },
  badge: {
    background: 'rgba(255,255,255,0.1)', color: '#94a3b8',
    fontSize: 11, fontWeight: 700, borderRadius: 20,
    padding: '1px 7px', fontFamily: 'monospace',
  },
  toggleAllBtn: {
    border: '1px solid', borderRadius: 7, cursor: 'pointer',
    fontSize: 10, fontWeight: 700, padding: '3px 8px',
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, cursor: 'pointer', width: 24, height: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chevron: { fontSize: 9, color: '#888' },
  lineList: {
    display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px 10px',
  },
  lineBtn: {
    background: 'transparent', border: '1px solid', borderRadius: 9,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', transition: 'all 0.2s ease',
    textAlign: 'left', width: '100%',
  },
  lineBadge: {
    color: '#fff', fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, fontWeight: 800, borderRadius: 5,
    padding: '2px 7px', minWidth: 28, textAlign: 'center', flexShrink: 0,
    transition: 'all 0.2s',
  },
  lineName: { fontSize: 12, flex: 1, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s' },
  busCount: {
    fontFamily: 'monospace',
    fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s',
  },
}
