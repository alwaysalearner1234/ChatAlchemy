import type { MachineComponent } from '../types'

export const MOCK_DURATION_SECONDS = 17 * 60 + 42

export const mockComponents: MachineComponent[] = [
  { id: 'gear', name: 'Gear', kind: 'Mechanism', icon: '⚙️', color: 'orange', description: 'Transfers motion through the machine.' },
  { id: 'laser', name: 'Laser', kind: 'Energy', icon: '🔴', color: 'red', description: 'Cuts through obstacles with precision.' },
  { id: 'portal', name: 'Portal', kind: 'Transport', icon: '🌀', color: 'violet', description: 'Bends space between two points.' },
  { id: 'battery', name: 'Battery', kind: 'Storage', icon: '🔋', color: 'gold', description: 'Stores energy for the final challenge.' },
  { id: 'duck', name: 'Duck', kind: 'Wildcard', icon: '🦆', color: 'yellow', description: 'A mysterious source of quack-powered energy.' },
  { id: 'black-hole', name: 'Black Hole', kind: 'Gravity', icon: '🌑', color: 'indigo', description: 'Pulls nearby matter into a tiny orbit.' },
  { id: 'spring', name: 'Spring', kind: 'Motion', icon: '🪀', color: 'green', description: 'Bounces the machine into action.' },
  { id: 'fan', name: 'Fan', kind: 'Force', icon: '🌀', color: 'cyan', description: 'Pushes air and momentum around.' },
  { id: 'magnet', name: 'Magnet', kind: 'Field', icon: '🧲', color: 'pink', description: 'Attracts the right pieces together.' },
  { id: 'prism', name: 'Prism', kind: 'Optics', icon: '🔮', color: 'teal', description: 'Splits energy into unexpected colors.' },
]

export const mockActivity = [['Mira', 'added a Gear', '2s'], ['PixelPusher', 'voted for Prism', '18s'], ['neon_nate', 'joined the build', '31s'], ['AdaLovelace', 'added a Battery', '45s']]

export const mockChallenge = {
  name: 'The Resonance Engine',
  description: 'A community-built machine that turns chaotic chat energy into a stable pulse.',
  instructions: 'Place at least five components, reach 70% stability, and survive the final resonance test when the timer expires.',
}
