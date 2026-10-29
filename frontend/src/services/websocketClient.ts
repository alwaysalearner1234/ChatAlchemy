import type { ClientCommand, MachineEvent } from '../types'

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
        this.handlers.onEvent(JSON.parse(message.data) as MachineEvent)
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
