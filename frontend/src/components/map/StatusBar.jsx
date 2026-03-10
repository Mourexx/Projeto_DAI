// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/components/map/StatusBar.jsx
// ─────────────────────────────────────────────────────────────────────────────
export default function StatusBar({ dataSource, lastUpdate, totalBuses, error }) {
  const isLive    = dataSource === 'api'
  const isMock    = dataSource === 'mock'
  const isLoading = dataSource === 'loading'

  const timeStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  return (
    <div style={styles.bar}>
      <div style={styles.group}>
        <span style={{
          ...styles.dot,
          backgroundColor: error ? '#FF5C5C' : isLive ? '#4CAF7D' : isMock ? '#FFB347' : '#555',
          boxShadow: isLive && !error ? '0 0 6px #4CAF7D88' : 'none',
          animation: (isLive || isMock) && !error ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={styles.sourceLabel}>
          {isLoading ? 'A ligar…' : error ? 'Erro API' : isLive ? 'API em direto' : 'Dados simulados'}
        </span>
      </div>

      <div style={styles.divider} />

      <div style={styles.group}>
        <span style={styles.icon}>🚌</span>
        <span style={styles.count}>{totalBuses}</span>
        <span style={styles.countLabel}>autocarros</span>
      </div>

      <div style={styles.divider} />

      <div style={styles.group}>
        <span style={styles.icon}>🕐</span>
        <span style={styles.time}>{timeStr}</span>
      </div>
    </div>
  )
}

const styles = {
  bar: {
    position: 'absolute', bottom: 24, left: '50%',
    transform: 'translateX(-50%)', zIndex: 10,
    background: 'rgba(10,14,23,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 30, padding: '8px 18px',
    display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  group: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  sourceLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: '#aaa', letterSpacing: 0.3,
  },
  divider: { width: 1, height: 14, background: 'rgba(255,255,255,0.1)' },
  icon: { fontSize: 12 },
  count: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, fontWeight: 800, color: '#fff',
  },
  countLabel: { fontSize: 11, color: '#888' },
  time: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: '#aaa',
  },
}
