// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/components/map/LineFilter.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

export default function LineFilter({ lines, activeLines, onToggle, busCount }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={styles.panel}>
      <button style={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
        <span style={styles.panelTitle}>🚌 Linhas</span>
        <span style={styles.chevron}>{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={styles.lineList}>
          {lines.map(line => {
            const active = activeLines.includes(line.id)
            const count  = busCount[line.id] || 0
            return (
              <button
                key={line.id}
                onClick={() => onToggle(line.id)}
                style={{
                  ...styles.lineBtn,
                  borderColor: line.color,
                  backgroundColor: active ? line.color + '22' : 'transparent',
                  opacity: active ? 1 : 0.4,
                }}
              >
                <span style={{ ...styles.lineBadge, backgroundColor: line.color }}>
                  {line.id}
                </span>
                <span style={styles.lineName}>{line.name}</span>
                <span style={{ ...styles.busCount, color: line.color }}>
                  {count} ●
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
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    background: 'rgba(10,14,23,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, minWidth: 220, overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  collapseBtn: {
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', color: '#fff',
  },
  panelTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
  },
  chevron: { fontSize: 10, color: '#888' },
  lineList: {
    display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 10px 10px',
  },
  lineBtn: {
    background: 'transparent', border: '1px solid', borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', transition: 'all 0.2s ease',
    textAlign: 'left', width: '100%',
  },
  lineBadge: {
    color: '#fff', fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, fontWeight: 800, borderRadius: 5,
    padding: '2px 6px', minWidth: 24, textAlign: 'center', flexShrink: 0,
  },
  lineName: { color: '#ccc', fontSize: 12, flex: 1 },
  busCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
}
