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
  title?: string
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
  personality?: string
  challenge?: Challenge
  revision?: number
  mode?: 'DEMO' | 'LIVE'
  activeCombos?: string[]
}

export type MachineEvent =
  | { type: 'state.snapshot'; state: MachineState; revision?: number }
  | { type: 'component.added'; component: PlacedComponent; contributions: number; revision?: number }
  | { type: 'component.rejected'; reason: string }
  | { type: 'session.updated'; status?: SessionStatus; remainingSeconds?: number; state?: Partial<MachineState>; revision?: number }
  | { type: 'machine.generated'; machineName: string; description: string; personality?: string; revision?: number }
  | { type: 'challenge.revealed'; challenge: Challenge; revision?: number }
  | { type: 'combination.activated'; componentIds: string[]; effect: 'pulse' | 'beam' | 'orbit' | 'shake'; name?: string; revision?: number }
  | { type: 'error'; message: string }
  | { type: 'event.triggered'; name: string }

export type ClientCommand =
  | { type: 'session.start' }
  | { type: 'session.pause' }
  | { type: 'session.resume' }
  | { type: 'session.finish' }
  | { type: 'session.reset' }
  | { type: 'event.trigger' }
  | { type: 'component.add'; componentId: string }
  | { type: 'state.request' }
