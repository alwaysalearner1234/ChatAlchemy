export type MachineComponent = {
  id: string
  name: string
  kind: string
  icon: string
  color: string
  description: string
}

export type SessionStatus = 'ready' | 'running' | 'paused' | 'finished'

export type ConnectionStatus = 'demo' | 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error'

export type PlacedComponent = MachineComponent & {
  instanceId: string
  addedAt: string
  addedBy?: string
}

export type Challenge = {
  name: string
  description: string
  instructions: string
  difficulty?: string
}

export type MachineState = {
  sessionId: string
  status: SessionStatus
  remainingSeconds: number
  contributions: number
  buildersOnline: number
  components: PlacedComponent[]
  machineName?: string
  description?: string
  challenge?: Challenge
}

export type MachineEvent =
  | { type: 'state.snapshot'; state: MachineState }
  | { type: 'component.added'; component: PlacedComponent; contributions: number }
  | { type: 'component.rejected'; reason: string }
  | { type: 'session.updated'; status: SessionStatus; remainingSeconds: number }
  | { type: 'machine.generated'; machineName: string; description: string }
  | { type: 'challenge.revealed'; challenge: Challenge }
  | { type: 'combination.activated'; componentIds: string[]; effect: 'pulse' | 'beam' | 'orbit' | 'shake' }
  | { type: 'error'; message: string }

export type ClientCommand =
  | { type: 'session.start' }
  | { type: 'session.pause' }
  | { type: 'session.resume' }
  | { type: 'session.finish' }
  | { type: 'session.reset' }
  | { type: 'component.add'; componentId: string }
  | { type: 'state.request' }
