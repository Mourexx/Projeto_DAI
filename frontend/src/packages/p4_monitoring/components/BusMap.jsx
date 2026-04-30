// Package {P4} Fleet Monitoring — 4SRS SIBCP v3
// Implements: {O4.2.c} real-time bus map
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LINE_COLORS } from '../../../shared/services/busService'
import GTFS_ROUTES from '../../../data/gtfs_data'

// Fix ícones padrão do Leaflet com Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow })

const CENTER = [41.5503, -8.4200]
const ZOOM = 13

function getLineColor(lineId) {
  if (LINE_COLORS && LINE_COLORS[String(lineId)]) return LINE_COLORS[String(lineId)]
  const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e']
  let hash = 0
  for (const c of String(lineId)) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

export default function BusMap({ buses = [], activeLines, onSelectBus }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({ routes: [], stops: [], buses: [] })
  const [mapReady, setMapReady] = useState(false)

  // Inicializar mapa
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const map = L.map(mapRef.current, { center: CENTER, zoom: ZOOM })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, [])

  // Desenhar rotas GTFS reais
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    layersRef.current.routes.forEach(l => map.removeLayer(l))
    layersRef.current.stops.forEach(l => map.removeLayer(l))
    layersRef.current.routes = []
    layersRef.current.stops = []

    const activeSet = activeLines ? new Set(activeLines.map(String)) : null
    const routesToDraw = Object.values(GTFS_ROUTES).filter(r =>
      !activeSet || activeSet.has(String(r.short_name))
    )
    const isSingleLine = activeLines && activeLines.length === 1

    routesToDraw.forEach(route => {
      const color = getLineColor(route.short_name)

      if (route.shape && route.shape.length > 1) {
        const outline = L.polyline(route.shape, {
          color: '#ffffff',
          weight: isSingleLine ? 8 : 6,
          opacity: 0.9,
        }).addTo(map)
        layersRef.current.routes.push(outline)

        const polyline = L.polyline(route.shape, {
          color,
          weight: isSingleLine ? 5 : 4,
          opacity: 0.95,
        }).addTo(map)
        polyline.bindTooltip(`Linha ${route.short_name}: ${route.long_name}`, { sticky: true })
        layersRef.current.routes.push(polyline)
      }

      if (isSingleLine && route.stops) {
        route.stops.forEach((stop, idx) => {
          const isTerminal = idx === 0 || idx === route.stops.length - 1
          const marker = L.circleMarker([stop.lat, stop.lon], {
            radius: isTerminal ? 8 : 5,
            color: '#fff', weight: 2,
            fillColor: color, fillOpacity: 0.9,
          }).addTo(map)
          marker.bindPopup(`<strong>${stop.name}</strong><br/>Linha ${route.short_name}<br/><small>Paragem ${idx + 1} de ${route.stops.length}</small>`)
          layersRef.current.stops.push(marker)
        })
      }
    })

    if (isSingleLine && layersRef.current.routes.length > 0) {
      const group = L.featureGroup(layersRef.current.routes)
      map.fitBounds(group.getBounds(), { padding: [30, 30] })
    }
  }, [mapReady, activeLines])

  // Atualizar marcadores dos autocarros
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    layersRef.current.buses.forEach(l => map.removeLayer(l))
    layersRef.current.buses = []

    buses.forEach(bus => {
      const lat = bus.lat ?? bus.latitude
      const lng = bus.lng ?? bus.longitude
      if (!lat || !lng) return

      const color = getLineColor(bus.line)
      const occ = bus.occupancy ?? bus.current_occupancy ?? 0
      const cap = bus.capacity ?? 60
      const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0
      const occColor = pct > 80 ? '#e74c3c' : pct > 50 ? '#f39c12' : '#2ecc71'

      const icon = L.divIcon({
        html: `
          <div style="
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
            font-size: 13px;
            font-weight: 800;
            color: white;
            font-family: 'DM Sans', sans-serif;
          ">${bus.line}</div>
        `,
        iconSize: [38, 38], iconAnchor: [19, 19], className: '',
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)
      marker.bindPopup(`
        <strong>${bus.id ?? bus.name}</strong><br/>
        Linha ${bus.line}<br/>
        Ocupação: <span style="color:${occColor};font-weight:bold">${occ}/${cap} (${pct}%)</span><br/>
        ${(bus.status === 'active' || bus.is_active) ? '🟢 Ativo' : '🔴 Inativo'}
      `)
      if (onSelectBus) marker.on('click', () => onSelectBus(bus))
      layersRef.current.buses.push(marker)
    })
  }, [mapReady, buses, onSelectBus])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', borderRadius: '8px' }}>
          <span>A carregar mapa...</span>
        </div>
      )}
    </div>
  )
}
