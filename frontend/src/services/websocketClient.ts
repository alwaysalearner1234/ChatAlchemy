import type { ClientCommand, MachineEvent } from '../types'

const eventTypes = new Set(['state.snapshot', 'component.added', 'component.rejected', 'session.updated', 'machine.generated', 'challenge.revealed', 'combination.activated', 'error', 'event.triggered'])

function isMachineEvent(value: unknown): value is MachineEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  if (typeof event.type !== 'string' || !eventTypes.has(event.type)) return false
  if (event.revision !== undefined && (!Number.isInteger(event.revision) || (event.revision as number) < 0)) return false
  if (event.type === 'state.snapshot') return Boolean(event.state && typeof event.state === 'object')
  if (event.type === 'component.added') return Boolean(event.component && typeof event.component === 'object' && typeof event.contributions === 'number')
  if (event.type === 'component.rejected') return typeof event.reason === 'string'
  if (event.type === 'session.updated') return event.state === undefined || Boolean(event.state && typeof event.state === 'object')
  if (event.type === 'machine.generated') return typeof event.machineName === 'string' && typeof event.description === 'string'
  if (event.type === 'challenge.revealed') return Boolean(event.challenge && typeof event.challenge === 'object')
  if (event.type === 'combination.activated') return Array.isArray(event.componentIds) && typeof event.effect === 'string'
  if (event.type === 'error') return typeof event.message === 'string'
  return typeof event.name === 'string'
}

export type WebSocketHandlers = {
  onEvent: (event: MachineEvent) => void
  onOpen: () => void
  onClose: () => void
  onError: () => void
}

export class MachineWebSocket {
  private socket: WebSocket | null = null
  private readonly url: string
  private readonly handlers: WebSocketHandlers

  constructor(url: string, handlers: WebSocketHandlers) {
    this.url = url
    this.handlers = handlers
  }

  connect() {
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('open', this.handlers.onOpen)
    this.socket.addEventListener('close', this.handlers.onClose)
    this.socket.addEventListener('error', this.handlers.onError)
    this.socket.addEventListener('message', (message) => {
      try {
        const parsed: unknown = JSON.parse(message.data)
        if (!isMachineEvent(parsed)) throw new Error('Invalid event')
        this.handlers.onEvent(parsed)
      } catch {
        this.handlers.onEvent({ type: 'error', message: 'Received an invalid machine event.' })
      }
    })
  }

  send(command: ClientCommand) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(command))
  }

  close() {
    this.socket?.close()
    this.socket = null
  }
}
