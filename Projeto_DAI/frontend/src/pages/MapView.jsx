// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/pages/MapView.jsx  (substitui o que já existe)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react'
import BusMap       from '../components/map/BusMap'
import LineFilter   from '../components/map/LineFilter'
import BusInfoPanel from '../components/map/BusInfoPanel'
import StatusBar    from '../components/map/StatusBar'
import { useBuses } from '../hooks/useBuses'
import { LINE_COLORS } from '../services/busService'

export default function MapView() {
  const { buses, lines, dataSource, lastUpdate, error } = useBuses()
  const [selectedBus, setSelectedBus] = useState(null)
  const [activeLines, setActiveLines] = useState(null) // null = todas ativas

  // Quando as linhas chegam pela primeira vez, ativa todas
  const resolvedActiveLines = useMemo(() => {
    if (activeLines !== null) return activeLines
    return lines.map(l => l.id)
  }, [activeLines, lines])

  // Contagem de autocarros por linha (para o LineFilter)
  const busCountByLine = useMemo(() => {
    const counts = {}
    buses.forEach(b => { counts[b.line] = (counts[b.line] || 0) + 1 })
    return counts
  }, [buses])

  const handleToggleLine = (lineId) => {
    setActiveLines(prev => {
      const current = prev ?? lines.map(l => l.id)
      return current.includes(lineId)
        ? current.filter(id => id !== lineId)
        : [...current, lineId]
    })
  }

  const handleSelectBus = (bus) => {
    setSelectedBus({ ...bus, lineColor: LINE_COLORS[bus.line] || '#4A9EFF' })
  }

  const handleMapClick = () => setSelectedBus(null)

  return (
    <>
      {/* Animações CSS necessárias */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');

        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={styles.page}>
        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>🚌</span>
            <div>
              <h1 style={styles.title}>TUB · Mapa em Tempo Real</h1>
              <p style={styles.subtitle}>Transportes Urbanos de Braga</p>
            </div>
          </div>
          <span style={styles.badge}>PGU · Bilhética &amp; Contagem</span>
        </header>

        {/* ── Área do mapa ── */}
        <div style={styles.mapContainer} onClick={handleMapClick}>
          <BusMap
            buses={buses}
            activeLines={resolvedActiveLines}
            onSelectBus={handleSelectBus}
            selectedBus={selectedBus}
          />

          {lines.length > 0 && (
            <LineFilter
              lines={lines}
              activeLines={resolvedActiveLines}
              onToggle={handleToggleLine}
              busCount={busCountByLine}
            />
          )}

          {selectedBus && (
            <BusInfoPanel
              bus={selectedBus}
              onClose={() => setSelectedBus(null)}
            />
          )}

          <StatusBar
            dataSource={dataSource}
            lastUpdate={lastUpdate}
            totalBuses={buses.filter(b => resolvedActiveLines.includes(b.line)).length}
            error={error}
          />
        </div>
      </div>
    </>
  )
}

const styles = {
  page: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0d1117',
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(10,14,23,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { fontSize: 24 },
  title: {
    margin: 0, fontSize: 16, fontWeight: 800,
    color: '#fff', letterSpacing: 0.5,
  },
  subtitle: {
    margin: 0, fontSize: 11, color: '#555',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  badge: {
    background: 'rgba(74,158,255,0.12)',
    border: '1px solid rgba(74,158,255,0.25)',
    color: '#4A9EFF', borderRadius: 20,
    padding: '4px 12px', fontSize: 10,
    fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
  },
  mapContainer: {
    flex: 1, position: 'relative', overflow: 'hidden',
  },
}
