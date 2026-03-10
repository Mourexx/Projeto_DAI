// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/components/map/BusMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import { LINE_COLORS } from '../../services/busService'

// Estilo escuro para o mapa
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.stroke',      stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill',        stylers: [{ color: '#4a5568' }] },
  { featureType: 'administrative',          elementType: 'geometry',            stylers: [{ color: '#1a2035' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill',    stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi',                     elementType: 'labels.text.fill',    stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park',                elementType: 'geometry',            stylers: [{ color: '#121b2b' }] },
  { featureType: 'road',                    elementType: 'geometry',            stylers: [{ color: '#1c2333' }] },
  { featureType: 'road.highway',            elementType: 'geometry',            stylers: [{ color: '#2a3550' }] },
  { featureType: 'road.highway',            elementType: 'labels.text.fill',    stylers: [{ color: '#f3d19c' }] },
  { featureType: 'road.local',              elementType: 'labels.text.fill',    stylers: [{ color: '#424242' }] },
  { featureType: 'transit',                 elementType: 'labels.text.fill',    stylers: [{ color: '#757575' }] },
  { featureType: 'water',                   elementType: 'geometry',            stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',                   elementType: 'labels.text.fill',    stylers: [{ color: '#3d5a70' }] },
]

const MAP_OPTIONS = {
  styles: DARK_MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
}

const CENTER_BRAGA = { lat: 41.5503, lng: -8.4200 }

// ─── Marcador individual de autocarro ────────────────────────────────────────
function BusMarker({ bus, isSelected, onClick }) {
  const color    = LINE_COLORS[bus.line] || '#4A9EFF'
  const isMoving = bus.status === 'active'

  return (
    <div
      onClick={() => onClick(bus)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.35)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none',
      }}
    >
      {/* Anel animado quando em movimento */}
      {isMoving && !isSelected && (
        <span style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0.4,
          animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Círculo principal */}
      <div style={{
        width: 32, height: 32,
        borderRadius: '50%',
        backgroundColor: color,
        border: isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
        boxShadow: `0 2px 10px ${color}66`,
        position: 'relative', zIndex: 1,
      }}>
        🚌
      </div>

      {/* Badge com número da linha */}
      <div style={{
        position: 'absolute', top: -6, right: -6,
        background: color, color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, fontWeight: 900,
        borderRadius: 4, padding: '1px 4px',
        border: '1.5px solid #0d1117',
        zIndex: 2,
      }}>
        {bus.line}
      </div>

      {/* Ponto laranja quando parado */}
      {!isMoving && (
        <div style={{
          position: 'absolute', bottom: -2,
          left: '50%', transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: '#FFB347',
          border: '1px solid #0d1117', zIndex: 2,
        }} />
      )}
    </div>
  )
}

// ─── Componente principal BusMap ─────────────────────────────────────────────
export default function BusMap({ buses, activeLines, onSelectBus, selectedBus }) {
  const [, setMap] = useState(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script',
  })

  const onLoad     = useCallback(m => setMap(m), [])
  const onUnmount  = useCallback(() => setMap(null), [])

  const visibleBuses = useMemo(
    () => buses.filter(b => activeLines.includes(b.line)),
    [buses, activeLines]
  )

  if (loadError) return (
    <div style={styles.errorBox}>
      <p>❌ Erro a carregar o Google Maps.</p>
      <p style={{ fontSize: 12, color: '#888' }}>
        Verifica a variável <code>VITE_GOOGLE_MAPS_API_KEY</code> no ficheiro <code>.env</code>
      </p>
    </div>
  )

  if (!isLoaded) return (
    <div style={styles.loadingBox}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>A carregar mapa…</p>
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={CENTER_BRAGA}
      zoom={14}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {visibleBuses.map(bus => (
        <OverlayView
          key={bus.id}
          position={{ lat: bus.lat, lng: bus.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={() => ({ x: -16, y: -16 })}
        >
          <BusMarker
            bus={bus}
            isSelected={selectedBus?.id === bus.id}
            onClick={onSelectBus}
          />
        </OverlayView>
      ))}
    </GoogleMap>
  )
}

const styles = {
  errorBox: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0d1117', color: '#FF5C5C',
    fontFamily: 'monospace', gap: 8, textAlign: 'center', padding: 24,
  },
  loadingBox: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0d1117', gap: 16,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #4A9EFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    color: '#555', fontSize: 13,
  },
}
