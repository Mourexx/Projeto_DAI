// Package {P4} Fleet Monitoring — 4SRS SIBCP v3
// Implements: {O4.2.c} real-time location
import { useState, useMemo } from 'react'
import BusMap       from './components/BusMap'
import LineFilter   from './components/LineFilter'
import BusInfoPanel from './components/BusInfoPanel'
import StatusBar    from './components/StatusBar'
import { useBuses } from '../../shared/hooks/useBuses'
import { LINE_COLORS } from '../../shared/services/busService'

export default function MapView() {
  const { buses, lines, dataSource, lastUpdate, error } = useBuses()
  const [selectedBus, setSelectedBus] = useState(null)
  const [activeLines, setActiveLines] = useState(null)

  const resolvedActiveLines = useMemo(() => {
    if (activeLines !== null) return activeLines
    return lines.map(l => l.id)
  }, [activeLines, lines])

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
    setSelectedBus({ ...bus, lineColor: LINE_COLORS[bus.line] || '#005BAC' })
  }

  return (
    // position:relative aqui é o novo contexto de posicionamento para o LineFilter
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* O mapa ocupa todo o espaço disponível */}
      <div
        style={{ position: 'absolute', inset: 0, background: '#0d1117' }}
        onClick={() => setSelectedBus(null)}
      >
        <BusMap
          buses={buses}
          activeLines={resolvedActiveLines}
          onSelectBus={handleSelectBus}
          selectedBus={selectedBus}
        />
        <StatusBar
          dataSource={dataSource}
          lastUpdate={lastUpdate}
          totalBuses={buses.filter(b => resolvedActiveLines.includes(b.line)).length}
          error={error}
        />
      </div>

      {/* LineFilter e BusInfoPanel são irmãos do mapa (não filhos),
          ficam no mesmo contexto de posicionamento mas com z-index superior,
          escapando assim ao overflow:auto do <main> do Layout */}
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
    </div>
  )
}
