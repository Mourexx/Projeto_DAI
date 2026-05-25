// Package Shared — 4SRS SIBCP v3
// Bus movement simulator — follows real GTFS shapes for demo mode.
// Position is derived exclusively from arc-length interpolation along shape
// waypoints, so buses are always on the route and never jump off it.

import GTFS_ROUTES from '../../data/gtfs_data'

// ─── Geometry helpers ────────────────────────────────────────────────────────

// Haversine distance in metres between two shape points [lat, lng]
function haversine(p1, p2) {
  const R = 6_371_000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(p2[0] - p1[0])
  const dLng = toRad(p2[1] - p1[1])
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1[0])) * Math.cos(toRad(p2[0])) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Geographic bearing in degrees (0–360) from p1 to p2
function bearing(p1, p2) {
  const toRad = d => d * Math.PI / 180
  const dLng = toRad(p2[1] - p1[1])
  const lat1 = toRad(p1[0])
  const lat2 = toRad(p2[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

// ─── SimulatedBus ─────────────────────────────────────────────────────────────

// Moves a bus along a GTFS shape using arc-length interpolation.
// Position is stored as a single scalar `arcPos` (metres from the first
// waypoint). The bus always travels forward; when it reaches the end of the
// route it wraps back to the start and continues in the same direction.
class SimulatedBus {
  constructor(shape, speedKmh) {
    this.shape   = shape
    this.speedMs = speedKmh / 3.6

    // Precompute cumulative arc lengths so position lookup is O(n) with early exit
    this.cumDist = [0]
    for (let i = 1; i < shape.length; i++) {
      this.cumDist.push(this.cumDist[i - 1] + haversine(shape[i - 1], shape[i]))
    }
    this.totalLen = this.cumDist[this.cumDist.length - 1]

    // Start at a random position between 5 % and 95 % of the route so that
    // buses are spread out and don't all pile up at the terminus on load
    this.arcPos = this.totalLen * (0.05 + Math.random() * 0.9)

    this._computePosition()
  }

  // Resolve lat/lng/heading from current arcPos via linear interpolation
  _computePosition() {
    const t = Math.max(0, Math.min(this.totalLen, this.arcPos))

    // Find the last waypoint index i where cumDist[i] <= t.
    // cumDist is monotonically non-decreasing, so early-exit is safe.
    let i = 0
    for (let j = 0; j < this.shape.length - 1; j++) {
      if (this.cumDist[j] <= t) i = j
      else break
    }

    const segLen = this.cumDist[i + 1] - this.cumDist[i]
    // frac ∈ [0,1]: how far along segment i → i+1 we are
    const frac = segLen > 0 ? (t - this.cumDist[i]) / segLen : 0

    const p1 = this.shape[i]
    const p2 = this.shape[i + 1]

    this.latitude  = p1[0] + frac * (p2[0] - p1[0])
    this.longitude = p1[1] + frac * (p2[1] - p1[1])
    this.heading   = bearing(p1, p2)
  }

  // Advance the bus by deltaSeconds of simulated time (always forward)
  step(deltaSeconds) {
    this.arcPos += this.speedMs * deltaSeconds

    // Wrap to the start of the route when the end is reached
    if (this.totalLen > 0 && this.arcPos >= this.totalLen) {
      this.arcPos = this.arcPos % this.totalLen
    }

    this._computePosition()
  }

  getState() {
    return { latitude: this.latitude, longitude: this.longitude, heading: this.heading }
  }
}

// ─── Internal factory ────────────────────────────────────────────────────────

// busBase must already have lat/lng stripped; position comes entirely from shape
function _attachSim(busBase, shape, speedKmh) {
  const sim = new SimulatedBus(shape, speedKmh)
  const { latitude, longitude, heading } = sim.getState()
  return { ...busBase, latitude, longitude, heading, _simulated: true, _sim: sim }
}

// ─── Public API ──────────────────────────────────────────────────────────────

// Convert raw API/mock buses to simulated buses anchored on real GTFS shapes.
// Legacy `lat`/`lng` fields are stripped so BusMap always uses the simulated
// `latitude`/`longitude` values and never displays the old static coordinates.
export function initBuses(busesFromApi) {
  return busesFromApi.map(bus => {
    // Destructure out both legacy naming variants so neither leaks through
    // eslint-disable-next-line no-unused-vars
    const { lat: _l, lng: _g, ...busBase } = bus
    const shape = GTFS_ROUTES[String(bus.line)]?.shape
    if (!shape || shape.length < 2) {
      // Line has no GTFS shape — keep original data, mark as not simulated
      return { ...bus, _simulated: false }
    }
    const speedKmh = 25 + Math.floor(Math.random() * 26)  // 25–50 km/h
    return _attachSim(busBase, shape, speedKmh)
  })
}

// Advance every simulated bus by deltaSeconds and return updated bus list.
// Returns the same array shape as the frontend already consumes.
export function tickBuses(simBuses, deltaSeconds) {
  return simBuses.map(bus => {
    if (!bus._simulated || !bus._sim) return bus
    bus._sim.step(deltaSeconds)
    const { latitude, longitude, heading } = bus._sim.getState()
    return { ...bus, latitude, longitude, heading }
  })
}

// Merge fresh API data (occupancy, status) into the existing simulated array
// without disturbing sim instances or their arc positions — buses never teleport.
export function reconcileBuses(newApiData, existingSimBuses) {
  const byId = new Map(existingSimBuses.map(b => [String(b.id), b]))

  return newApiData.map(bus => {
    const id = String(bus.id ?? bus.name)
    const existing = byId.get(id)

    if (existing?._simulated) {
      // Keep sim position; only refresh live operational fields
      return {
        ...existing,
        occupancy:         bus.occupancy         ?? existing.occupancy,
        current_occupancy: bus.current_occupancy ?? existing.current_occupancy,
        status:            bus.status            ?? existing.status,
        capacity:          bus.capacity          ?? existing.capacity,
        is_active:         bus.is_active         ?? existing.is_active,
      }
    }

    // New or non-simulated bus — initialise a fresh SimulatedBus for it
    // eslint-disable-next-line no-unused-vars
    const { lat: _l, lng: _g, ...busBase } = bus
    const shape = GTFS_ROUTES[String(bus.line)]?.shape
    if (!shape || shape.length < 2) return { ...bus, _simulated: false }
    const speedKmh = 25 + Math.floor(Math.random() * 26)
    return _attachSim(busBase, shape, speedKmh)
  })
}
