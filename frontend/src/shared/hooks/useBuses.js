// Package Shared — 4SRS SIBCP v3
// Implements: {O4.2.c} real-time location controller
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchBuses, fetchLines } from '../services/busService'
import { initBuses, tickBuses, reconcileBuses } from '../services/busSimulator'

const POLL_INTERVAL = 10_000  // backend refresh for non-positional data (ms)
const SIM_INTERVAL  = 1_000   // simulation position tick (ms)

export function useBuses() {
  const [buses, setBuses]           = useState([])
  const [lines, setLines]           = useState([])
  const [dataSource, setSource]     = useState('loading')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError]           = useState(null)

  // Full sim objects (with _sim instances) live in a ref so interval callbacks
  // always see the latest state without stale closures
  const simBusesRef = useRef([])
  const pollRef     = useRef(null)
  const simRef      = useRef(null)

  // Strip internal sim fields before exposing to React state / consumers
  const publish = useCallback(simBuses => {
    setBuses(simBuses.map(({ _sim, _simulated, ...rest }) => rest))
  }, [])

  // Advance all buses by 1 second and push updated positions to React state
  const tick = useCallback(() => {
    const updated = tickBuses(simBusesRef.current, 1)
    simBusesRef.current = updated
    publish(updated)
  }, [publish])

  // Re-fetch from backend and merge non-positional fields (occupancy, status)
  // without disturbing simulated positions
  const loadBuses = useCallback(async () => {
    try {
      const { buses: data, source } = await fetchBuses()
      const merged = reconcileBuses(data, simBusesRef.current)
      simBusesRef.current = merged
      setSource(source)
      setLastUpdate(new Date())
      setError(null)
      publish(merged)
    } catch (e) {
      setError(e.message)
    }
  }, [publish])

  const loadLines = useCallback(async () => {
    const data = await fetchLines()
    setLines(data)
  }, [])

  useEffect(() => {
    loadLines()

    fetchBuses()
      .then(({ buses: data, source }) => {
        const simBuses = initBuses(data)
        simBusesRef.current = simBuses
        setSource(source)
        setLastUpdate(new Date())
        publish(simBuses)

        // Move buses every second
        simRef.current = setInterval(tick, SIM_INTERVAL)
        // Refresh occupancy / status from backend every 10 s
        pollRef.current = setInterval(loadBuses, POLL_INTERVAL)
      })
      .catch(e => setError(e.message))

    return () => {
      clearInterval(simRef.current)
      clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { buses, lines, dataSource, lastUpdate, error, refresh: loadBuses }
}
