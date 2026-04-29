// Package {P4} Fleet Monitoring — 4SRS SIBCP v3
// Implements: {O4.2.c} real-time bus map
import { useEffect, useRef, useMemo, useState } from 'react'
import { LINE_COLORS } from '../../../shared/services/busService'
import GTFS_ROUTES from '../../../data/gtfs_data'

const CENTER = [41.5503, -8.4200]
const ZOOM = 13

function getLineColor(lineId) {
  if (LINE_COLORS && LINE_COLORS[lineId]) return LINE_COLORS[lineId]
  const colors = [
    '#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6',
    '#1abc9c','#e67e22','#34495e','#e91e63','#00bcd4',
  ]
  let hash = 0
  for (const c of String(lineId)) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

export default function BusMap({ buses = [], activeLines, onSelectBus, selectedBus }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({ routes: [], stops: [], buses: [] })
  const [mapReady, setMapReady] = useState(false)

  // Inicializar mapa Leaflet
  useEffect(() => {
    if (mapInstanceRef.current) return
    const timer = setTimeout(() => {
      const L = window.L
      if (!L || !mapRef.current) return

      const map = L.map(mapRef.current, { center: CENTER, zoom: ZOOM })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    }, 100)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Desenhar rotas e paragens GTFS reais
  useEffect(() => {
    if (!mapReady) return
    const L = window.L
    const map = mapInstanceRef.current

    layersRef.current.routes.forEach(l => map.removeLayer(l))
    layersRef.current.stops.forEach(l => map.removeLayer(l))
    layersRef.current.routes = []
    layersRef.current.stops = []

    // Filtrar rotas pelas linhas ativas (activeLines usa IDs do tipo "2", "3", "42")
    const routesToDraw = activeLines
      ? Object.values(GTFS_ROUTES).filter(r => activeLines.includes(r.short_name))
      : Object.values(GTFS_ROUTES)

    const isSingleLine = activeLines && activeLines.length === 1

    routesToDraw.forEach(route => {
      const color = getLineColor(route.short_name)

      if (route.shape && route.shape.length > 1) {
        const polyline = L.polyline(route.shape, {
          color,
          weight: isSingleLine ? 4 : 2,
          opacity: isSingleLine ? 0.9 : 0.45,
        }).addTo(map)
        polyline.bindTooltip(`Linha ${route.short_name}: ${route.long_name}`, { sticky: true })
        layersRef.current.routes.push(polyline)
      }

      // Paragens só aparecem quando uma linha está selecionada
      if (isSingleLine && route.stops) {
        route.stops.forEach((stop, idx) => {
          const isTerminal = idx === 0 || idx === route.stops.length - 1
          const marker = L.circleMarker([stop.lat, stop.lon], {
            radius: isTerminal ? 8 : 5,
            color: '#fff',
            weight: 2,
            fillColor: color,
            fillOpacity: 0.9,
          }).addTo(map)
          marker.bindPopup(`
            <strong>${stop.name}</strong><br/>
            Linha ${route.short_name}<br/>
            <small>Paragem ${idx + 1} de ${route.stops.length}</small>
          `)
          layersRef.current.stops.push(marker)
        })
      }
    })

    // Zoom para linha selecionada
    if (isSingleLine && layersRef.current.routes.length > 0) {
      const group = L.featureGroup(layersRef.current.routes)
      map.fitBounds(group.getBounds(), { padding: [30, 30] })
    }
  }, [mapReady, activeLines])

  // Atualizar marcadores dos autocarros
  useEffect(() => {
    if (!mapReady) return
    const L = window.L
    const map = mapInstanceRef.current

    layersRef.current.buses.forEach(l => map.removeLayer(l))
    layersRef.current.buses = []

    buses.forEach(bus => {
      // Suporta tanto lat/lng (busService mock) como latitude/longitude (API)
      const lat = bus.lat ?? bus.latitude
      const lng = bus.lng ?? bus.longitude
      if (!lat || !lng) return

      const color = getLineColor(bus.line)
      const occ = bus.occupancy ?? bus.current_occupancy ?? 0
      const cap = bus.capacity ?? 60
      const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0
      const occupancyColor = pct > 80 ? '#e74c3c' : pct > 50 ? '#f39c12' : '#2ecc71'

      const icon = L.divIcon({
        html: `
          <div style="
            background:${color};border:2px solid white;border-radius:6px;
            width:32px;height:32px;display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:10px;font-weight:bold;color:white;
          ">${bus.line}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)
      marker.bindPopup(`
        <strong>${bus.id ?? bus.name}</strong><br/>
        Linha ${bus.line}<br/>
        Ocupação: <span style="color:${occupancyColor};font-weight:bold">${occ}/${cap} (${pct}%)</span><br/>
        Estado: ${(bus.status === 'active' || bus.is_active) ? '🟢 Ativo' : '🔴 Inativo'}
      `)
      if (onSelectBus) marker.on('click', () => onSelectBus(bus))
      layersRef.current.buses.push(marker)
    })
  }, [mapReady, buses, onSelectBus])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#f0f4f8', borderRadius: '8px',
        }}>
          <span>A carregar mapa...</span>
        </div>
      )}
    </div>
  )
}
