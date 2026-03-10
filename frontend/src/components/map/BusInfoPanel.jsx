// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/components/map/BusInfoPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
export default function BusInfoPanel({ bus, onClose }) {
  if (!bus) return null

  const occupancyPct   = Math.round((bus.occupancy / bus.capacity) * 100)
  const occupancyColor = occupancyPct > 85 ? '#FF5C5C' : occupancyPct > 60 ? '#FFB347' : '#4CAF7D'
  const statusLabel    = bus.status === 'active' ? '🟢 Em circulação' : '🟡 Parado'

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <span style={styles.busId}>{bus.id}</span>
          <span style={styles.status}>{statusLabel}</span>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={styles.lineBadgeRow}>
        <span style={{ ...styles.lineBadge, backgroundColor: bus.lineColor || '#4A9EFF' }}>
          Linha {bus.line}
        </span>
        <span style={styles.lineName}>{bus.lineName}</span>
      </div>

      <div style={styles.divider} />

      <div style={styles.row}>
        <span style={styles.label}>Última paragem</span>
        <span style={styles.value}>📍 {bus.lastStop}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Próxima paragem</span>
        <span style={styles.value}>➡️ {bus.nextStop}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Velocidade</span>
        <span style={styles.value}>{bus.speed} km/h</span>
      </div>

      <div style={styles.divider} />

      <div style={styles.occupancyLabel}>
        <span style={styles.label}>Ocupação</span>
        <span style={{ ...styles.occupancyPct, color: occupancyColor }}>
          {bus.occupancy}/{bus.capacity} — {occupancyPct}%
        </span>
      </div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${occupancyPct}%`, backgroundColor: occupancyColor }} />
      </div>

      <div style={styles.coords}>
        {bus.lat?.toFixed(5)}° N &nbsp;|&nbsp; {Math.abs(bus.lng)?.toFixed(5)}° W
      </div>
    </div>
  )
}

const styles = {
  panel: {
    position: 'absolute', bottom: 24, right: 16, zIndex: 10,
    background: 'rgba(10,14,23,0.95)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '16px 18px',
    minWidth: 260, maxWidth: 300,
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    animation: 'slideUp 0.2s ease',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  busId: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16, fontWeight: 800, color: '#fff', display: 'block',
  },
  status: { fontSize: 11, color: '#aaa', marginTop: 2, display: 'block' },
  closeBtn: {
    background: 'none', border: 'none', color: '#666',
    cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
  },
  lineBadgeRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  lineBadge: {
    color: '#fff', fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '3px 8px',
  },
  lineName: { color: '#bbb', fontSize: 12 },
  divider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '10px 0' },
  row: {
    display: 'flex', justifyContent: 'space-between',
    marginBottom: 7, alignItems: 'center',
  },
  label: {
    color: '#666', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.5,
    fontFamily: "'JetBrains Mono', monospace",
  },
  value: { color: '#ddd', fontSize: 12, maxWidth: 160, textAlign: 'right' },
  occupancyLabel: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  occupancyPct: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, fontWeight: 700,
  },
  barTrack: {
    height: 6, borderRadius: 3,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden', marginBottom: 12,
  },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  coords: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: '#444', textAlign: 'center', marginTop: 4,
  },
}
