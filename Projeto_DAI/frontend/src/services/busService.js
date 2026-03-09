// ─────────────────────────────────────────────────────────────────────────────
// FICHEIRO: frontend/src/services/busService.js
// ─────────────────────────────────────────────────────────────────────────────
import api from './api'   // usa o axios que já existe no projeto

// ─── Cores por linha ──────────────────────────────────────────────────────────
export const LINE_COLORS = {
  '1':  '#FF5C5C',
  '3':  '#4CAF7D',
  '5':  '#4A9EFF',
  '7':  '#FFB347',
  '11': '#C084FC',
}

// ─── Mock Data (8 autocarros simulados em Braga) ──────────────────────────────
const MOCK_BUSES = [
  { id: 'TUB-001', line: '1', lineName: 'Circular Norte',          lat: 41.5503, lng: -8.4200, speed: 32, occupancy: 45, capacity: 60, status: 'active',  lastStop: 'Largo da Sé',      nextStop: 'Rua do Souto',       heading: 90  },
  { id: 'TUB-002', line: '1', lineName: 'Circular Norte',          lat: 41.5580, lng: -8.4080, speed: 0,  occupancy: 12, capacity: 60, status: 'stopped', lastStop: 'Estação CP',        nextStop: 'Av. Central',        heading: 180 },
  { id: 'TUB-003', line: '3', lineName: 'Gualtar / Universidade',  lat: 41.5620, lng: -8.3970, speed: 45, occupancy: 55, capacity: 60, status: 'active',  lastStop: 'Universidade',      nextStop: 'Stª Tecla',          heading: 270 },
  { id: 'TUB-004', line: '3', lineName: 'Gualtar / Universidade',  lat: 41.5450, lng: -8.4350, speed: 28, occupancy: 8,  capacity: 60, status: 'active',  lastStop: 'Fraião',            nextStop: 'Av. da Liberdade',   heading: 45  },
  { id: 'TUB-005', line: '5', lineName: 'Nogueiró / Tenões',       lat: 41.5690, lng: -8.4150, speed: 0,  occupancy: 30, capacity: 60, status: 'stopped', lastStop: 'Estádio',           nextStop: 'Nogueiró',           heading: 135 },
  { id: 'TUB-006', line: '7', lineName: 'Maximinos / Ferreiros',   lat: 41.5360, lng: -8.4280, speed: 38, occupancy: 42, capacity: 60, status: 'active',  lastStop: 'Maximinos',         nextStop: 'Ferreiros',          heading: 60  },
  { id: 'TUB-007', line: '7', lineName: 'Maximinos / Ferreiros',   lat: 41.5520, lng: -8.4420, speed: 22, occupancy: 18, capacity: 60, status: 'active',  lastStop: 'Av. Robert Smith',  nextStop: 'Maximinos',          heading: 200 },
  { id: 'TUB-008', line: '11', lineName: 'Celeirós',               lat: 41.5740, lng: -8.4050, speed: 51, occupancy: 5,  capacity: 60, status: 'active',  lastStop: 'São Victor',        nextStop: 'Celeirós',           heading: 15  },
]

// Simula pequeno movimento nos autocarros ativos
function simulateMovement(buses) {
  return buses.map(bus => {
    if (bus.status === 'stopped') return bus
    const angle = (bus.heading * Math.PI) / 180
    const delta = (bus.speed / 3600) * 0.001
    return {
      ...bus,
      lat: bus.lat + Math.cos(angle) * delta * (0.8 + Math.random() * 0.4),
      lng: bus.lng + Math.sin(angle) * delta * (0.8 + Math.random() * 0.4),
    }
  })
}

let _mockBuses = [...MOCK_BUSES]

// ─── Funções exportadas ───────────────────────────────────────────────────────

export async function fetchBuses() {
  try {
    const res = await api.get('/transports/')
    return { buses: res.data, source: 'api' }
  } catch {
    _mockBuses = simulateMovement(_mockBuses)
    return { buses: _mockBuses, source: 'mock' }
  }
}

export async function fetchLines() {
  try {
    const res = await api.get('/transports/')
    const lines = {}
    res.data.forEach(b => {
      if (b.line) {
        lines[b.line] = {
          id: b.line,
          name: b.lineName || `Linha ${b.line}`,
          color: LINE_COLORS[b.line] || '#4A9EFF',
        }
      }
    })
    return Object.values(lines)
  } catch {
    const lines = {}
    MOCK_BUSES.forEach(b => {
      lines[b.line] = { id: b.line, name: b.lineName, color: LINE_COLORS[b.line] }
    })
    return Object.values(lines)
  }
}
