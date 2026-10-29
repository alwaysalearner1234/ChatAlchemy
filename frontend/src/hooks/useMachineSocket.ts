import { useCallback, useEffect, useRef, useState } from 'react'
import { MOCK_DURATION_SECONDS, mockChallenge, mockComponents } from '../data/mockData'
import { MachineWebSocket } from '../services/websocketClient'
import type { ClientCommand, ConnectionStatus, MachineEvent, MachineState, SessionStatus } from '../types'

const initialState: MachineState = { sessionId: 'demo-machine-lab-04', status: 'ready', remainingSeconds: MOCK_DURATION_SECONDS, contributions: 0, buildersOnline: 24, components: [], challenge: mockChallenge }

export function useMachineSocket() {
  const [state, setState] = useState<MachineState>(initialState)
  const [connection, setConnection] = useState<ConnectionStatus>('demo')
  const [error, setError] = useState<string | null>(null)
  const [activeCombination, setActiveCombination] = useState<{ componentIds: string[]; effect: string } | null>(null)
  const socket = useRef<MachineWebSocket | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const isDemo = !import.meta.env.VITE_WS_URL

  const applyEvent = useCallback((event: MachineEvent) => {
    if (event.type === 'state.snapshot') setState(event.state)
    if (event.type === 'component.added') setState((current) => ({ ...current, components: [...current.components, event.component], contributions: event.contributions }))
    if (event.type === 'session.updated') setState((current) => ({ ...current, status: event.status, remainingSeconds: event.remainingSeconds }))
    if (event.type === 'machine.generated') setState((current) => ({ ...current, machineName: event.machineName, description: event.description }))
    if (event.type === 'challenge.revealed') setState((current) => ({ ...current, challenge: event.challenge }))
    if (event.type === 'combination.activated') { setActiveCombination(event); window.setTimeout(() => setActiveCombination(null), 900) }
    if (event.type === 'component.rejected') setError(event.reason)
    if (event.type === 'error') setError(event.message)
  }, [])

  const send = useCallback((command: ClientCommand) => {
    if (!isDemo) { socket.current?.send(command); return }
    if (command.type.startsWith('session.')) {
      const status: SessionStatus = command.type === 'session.start' || command.type === 'session.resume' ? 'running' : command.type === 'session.pause' ? 'paused' : command.type === 'session.finish' ? 'finished' : 'ready'
      setState((current) => ({ ...current, status, remainingSeconds: command.type === 'session.reset' ? MOCK_DURATION_SECONDS : current.remainingSeconds, components: command.type === 'session.reset' ? [] : current.components, contributions: command.type === 'session.reset' ? 0 : current.contributions }))
    }
    if (command.type === 'component.add') {
      const component = mockComponents.find((item) => item.id === command.componentId)
      if (!component || state.components.length >= 10 || state.status === 'finished') return
      const nextComponents = [...state.components, { ...component, instanceId: `${component.id}-${Date.now()}`, addedAt: new Date().toISOString(), addedBy: 'demo-viewer' }]
      applyEvent({ type: 'component.added', component: nextComponents[nextComponents.length - 1], contributions: state.contributions + 1 })
      const ids = nextComponents.map((item) => item.id)
      const combo = ids.includes('laser') && ids.includes('portal') ? { componentIds: ['laser', 'portal'], effect: 'beam' as const } : ids.filter((id) => id === 'gear').length >= 2 && ids.includes('battery') ? { componentIds: ['gear', 'battery'], effect: 'pulse' as const } : ids.includes('black-hole') && ids.includes('portal') ? { componentIds: ['black-hole', 'portal'], effect: 'orbit' as const } : null
      if (combo) applyEvent({ type: 'combination.activated', ...combo })
    }
  }, [applyEvent, isDemo, state.components, state.contributions])

  useEffect(() => {
    if (isDemo) return
    let disposed = false
    const connect = () => {
      if (disposed) return
      setConnection((current) => current === 'connected' ? 'reconnecting' : 'connecting')
      const client = new MachineWebSocket(import.meta.env.VITE_WS_URL, { onEvent: applyEvent, onOpen: () => { setConnection('connected'); setError(null); client.send({ type: 'state.request' }) }, onClose: () => { setConnection('reconnecting'); if (!disposed) reconnectTimer.current = window.setTimeout(connect, 2000) }, onError: () => { setConnection('error'); setError('Unable to connect to the machine session.') } })
      socket.current = client
      client.connect()
    }
    connect()
    return () => { disposed = true; if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current); socket.current?.close() }
  }, [applyEvent, isDemo])

  useEffect(() => { if (isDemo && state.status === 'running' && state.remainingSeconds > 0) { const timer = window.setInterval(() => setState((current) => ({ ...current, remainingSeconds: Math.max(0, current.remainingSeconds - 1), status: current.remainingSeconds <= 1 ? 'finished' : current.status })), 1000); return () => window.clearInterval(timer) } }, [isDemo, state.status, state.remainingSeconds])

  return { state, connection, error, activeCombination, clearError: () => setError(null), send }
}
