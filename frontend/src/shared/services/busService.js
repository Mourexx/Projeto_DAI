// Package Shared — 4SRS SIBCP v3

import api from './api'   // usa o axios que já existe no projeto

export const LINE_COLORS = {
  // Linhas reais TUB (IDs numéricos do GTFS)
  '2':   '#10B981', '3':   '#F59E0B', '5':   '#8B5CF6',
  '7':   '#EF4444', '8':   '#06B6D4', '9':   '#84CC16',
  '12':  '#3B82F6', '13':  '#F97316', '14':  '#EC4899',
  '18':  '#14B8A6', '19':  '#A855F7', '20':  '#EAB308',
  '21':  '#64748B', '23':  '#0EA5E9', '24':  '#10B981',
  '31':  '#EF4444', '32':  '#8B5CF6', '33':  '#F59E0B',
  '40':  '#3B82F6', '41':  '#EC4899', '42':  '#06B6D4',
  '43':  '#F97316', '74':  '#14B8A6', '87':  '#A855F7',
  // Legado (mock data)
  'L1':  '#3B82F6', 'L2':  '#10B981', 'L3':  '#F59E0B',
  'L5':  '#8B5CF6', 'L7':  '#EF4444', 'L8':  '#06B6D4',
}

const MOCK_BUSES = [
  { id: 'TUB-001', line: '42', lat: 41.540798, lng: -8.408466, speed: 0,  occupancy: 12, capacity: 60, status: 'stopped', routeLine: '42', routeIdx: 3  },
  { id: 'TUB-002', line: '42', lat: 41.541254, lng: -8.406142, speed: 45, occupancy: 55, capacity: 60, status: 'active',  routeLine: '42', routeIdx: 6  },
  { id: 'TUB-003', line: '2',  lat: 41.585380, lng: -8.455420, speed: 28, occupancy: 8,  capacity: 60, status: 'active',  routeLine: '2',  routeIdx: 10 },
  { id: 'TUB-004', line: '3',  lat: 41.563328, lng: -8.417568, speed: 0,  occupancy: 30, capacity: 60, status: 'stopped', routeLine: '3',  routeIdx: 25 },
  { id: 'TUB-005', line: '40', lat: 41.552170, lng: -8.427270, speed: 38, occupancy: 42, capacity: 60, status: 'active',  routeLine: '40', routeIdx: 15 },
  { id: 'TUB-006', line: '5',  lat: 41.574310, lng: -8.437940, speed: 22, occupancy: 18, capacity: 60, status: 'active',  routeLine: '5',  routeIdx: 10 },
  { id: 'TUB-007', line: '74', lat: 41.554462, lng: -8.381193, speed: 51, occupancy: 5,  capacity: 60, status: 'active',  routeLine: '74', routeIdx: 20 },
  { id: 'TUB-008', line: '87', lat: 41.551570, lng: -8.409610, speed: 32, occupancy: 45, capacity: 60, status: 'active',  routeLine: '87', routeIdx: 5  },
]

let _mockBuses = [...MOCK_BUSES]

export async function fetchBuses() {
  try {
    const res = await api.get('/transports/')
    const raw = res.data.filter(t => t.latitude && t.longitude)
    if (raw.length === 0) throw new Error('No coords')
    return {
      buses: raw.map(t => ({
        id: t.name || String(t.id),
        line: String(t.line),
        latitude: parseFloat(t.latitude),
        longitude: parseFloat(t.longitude),
        occupancy: t.current_occupancy ?? 0,
        current_occupancy: t.current_occupancy ?? 0,
        capacity: t.capacity ?? 60,
        is_active: t.is_active,
        status: t.is_active ? 'active' : 'stopped',
        name: t.name,
      })),
      source: 'api',
    }
  } catch {
    return { buses: _mockBuses, source: 'mock' }
  }
}

export async function fetchLines() {
  try {
    const res = await api.get('/linhas/')
    if (!res.data || res.data.length === 0) throw new Error('No lines')
    return res.data.map(l => ({
      id: l.codigo,
      name: `${l.codigo} — ${l.nome}`,
      color: LINE_COLORS[l.codigo] || '#005BAC',
    }))
  } catch {
    return [
      { id: '2',  name: '2 — PONTE DE PRADO - BOM JESUS',                color: LINE_COLORS['2']  },
      { id: '3',  name: '3 — AVENIDA CENTRAL - RUÃES',                   color: LINE_COLORS['3']  },
      { id: '5',  name: '5 — DUME - QUINTA DA CAPELA',                   color: LINE_COLORS['5']  },
      { id: '7',  name: "7 — S. MAMEDE D'ESTE - CELEIRÓS",               color: LINE_COLORS['7']  },
      { id: '8',  name: '8 — RUA 25 DE ABRIL - SETE FONTES',             color: LINE_COLORS['8']  },
      { id: '40', name: '40 — CIRCUITO URBANO I',                        color: LINE_COLORS['40'] },
      { id: '42', name: '42 — RESIDÊNCIA UNIVERSITÁRIA - UNIV. MINHO',   color: LINE_COLORS['42'] },
      { id: '74', name: '74 — CAMÉLIAS - HOSPITAL',                      color: LINE_COLORS['74'] },
      { id: '87', name: '87 — ESTAÇÃO CF - HOSPITAL',                    color: LINE_COLORS['87'] },
    ]
  }
}
