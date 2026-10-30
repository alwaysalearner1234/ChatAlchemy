import { useCallback, useEffect, useRef, useState } from 'react'
import { MOCK_DURATION_SECONDS, mockChallenge } from '../data/mockData'
import { MachineWebSocket } from '../services/websocketClient'
import type { ClientCommand, ConnectionStatus, MachineEvent, MachineState } from '../types'

const initialState: MachineState = { sessionId: 'connecting', status: 'ready', remainingSeconds: MOCK_DURATION_SECONDS, contributions: 0, buildersOnline: 0, components: [], challenge: mockChallenge, mode: 'DEMO', revision: 0 }
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

export function useMachineSocket() {
  const [state, setState] = useState<MachineState>(initialState)
  const [connection, setConnection] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [activeCombination, setActiveCombination] = useState<{ componentIds: string[]; effect: string } | null>(null)
  const socket = useRef<MachineWebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const revision = useRef(0)

  const applyEvent = useCallback((event: MachineEvent) => {
    const eventRevision = 'revision' in event ? event.revision : undefined
    if (typeof eventRevision === 'number' && event.type !== 'state.snapshot' && eventRevision <= revision.current) return
    if (typeof eventRevision === 'number') revision.current = eventRevision
    if (event.type === 'state.snapshot') { revision.current = event.revision ?? 0; setState(event.state); return }
    if (event.type === 'component.added') setState((current) => ({ ...current, components: [...current.components.filter((item) => item.instanceId !== event.component.instanceId), event.component], contributions: event.contributions, revision: eventRevision ?? current.revision }))
    if (event.type === 'session.updated') setState((current) => ({ ...current, ...(event.state as Partial<MachineState>), status: (event.state as MachineState)?.status ?? event.status ?? current.status, remainingSeconds: (event.state as MachineState)?.remainingSeconds ?? event.remainingSeconds ?? current.remainingSeconds, revision: eventRevision ?? current.revision }))
    if (event.type === 'machine.generated') setState((current) => ({ ...current, machineName: event.machineName, description: event.description, personality: event.personality, revision: eventRevision ?? current.revision }))
    if (event.type === 'challenge.revealed') setState((current) => ({ ...current, challenge: { name: event.challenge.title ?? event.challenge.name, description: event.challenge.instructions, instructions: event.challenge.instructions, difficulty: event.challenge.difficulty }, revision: eventRevision ?? current.revision }))
    if (event.type === 'combination.activated') { setState((current) => ({ ...current, activeCombos: [...new Set([...(current.activeCombos ?? []), ...(event.name ? [event.name] : [])])], revision: eventRevision ?? current.revision })); setActiveCombination(event); window.setTimeout(() => setActiveCombination(null), 900) }
    if (event.type === 'component.rejected') setError(event.reason)
    if (event.type === 'error') setError(event.message)
  }, [])

  const send = useCallback((command: ClientCommand) => socket.current?.send(command), [])
  useEffect(() => {
    let disposed = false
    const connect = () => {
      if (disposed) return
      setConnection((current) => current === 'connected' ? 'reconnecting' : 'connecting')
      const client = new MachineWebSocket(wsUrl, { onEvent: applyEvent, onOpen: () => { setConnection('connected'); setError(null); client.send({ type: 'state.request' }) }, onClose: () => { setConnection('reconnecting'); if (!disposed) reconnectTimer.current = window.setTimeout(connect, 2000) }, onError: () => { setConnection('error'); setError('Unable to connect to ChatAlchemy. Start the backend, then retry.') } })
      socket.current = client
      try { client.connect() } catch { setConnection('error'); reconnectTimer.current = window.setTimeout(connect, 2000) }
    }
    connect()
    return () => { disposed = true; if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current); socket.current?.close() }
  }, [applyEvent])

  useEffect(() => {
    if (state.status !== 'running') return
    const timer = window.setInterval(() => setState((current) => ({ ...current, remainingSeconds: Math.max(0, current.remainingSeconds - 1) })), 1000)
    return () => window.clearInterval(timer)
  }, [state.status, state.sessionId])

  return { state, connection, error, activeCombination, clearError: () => setError(null), send }
}
