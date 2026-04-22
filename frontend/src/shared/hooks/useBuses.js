// Package Shared — 4SRS SIBCP v3
// Implements: {O4.2.c} real-time location controller
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchBuses, fetchLines } from '../services/busService'

const POLL_INTERVAL = 1000 // atualiza a cada 1 segundo

export function useBuses() {
  const [buses, setBuses]           = useState([])
  const [lines, setLines]           = useState([])
  const [dataSource, setSource]     = useState('loading')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError]           = useState(null)
  const intervalRef = useRef(null)

  const loadBuses = useCallback(async () => {
    try {
      const { buses: data, source } = await fetchBuses()
      setBuses(data)
      setSource(source)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const loadLines = useCallback(async () => {
    const data = await fetchLines()
    setLines(data)
  }, [])

  useEffect(() => {
    loadLines()
    loadBuses()
    intervalRef.current = setInterval(loadBuses, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { buses, lines, dataSource, lastUpdate, error, refresh: loadBuses }
}
