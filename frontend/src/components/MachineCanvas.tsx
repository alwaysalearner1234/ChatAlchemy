import type { MachineComponent } from '../types'

type Props = { components: MachineComponent[]; placed: string[]; selected: string | null; onSelect: (id: string) => void; activeCombination?: { componentIds: string[]; effect: string } | null }

export function MachineCanvas({ components, placed, selected, onSelect, activeCombination }: Props) {
  return <div className={`machine-card ${activeCombination ? `combination-${activeCombination.effect}` : ''}`}>
    <div className="machine-toolbar"><span><i className="status-dot" /> MACHINE CORE <b>·</b> ONLINE</span><span className="toolbar-hint">Community assembly in progress</span></div>
    <div className="machine-canvas">
      <img className="machine-hero" src="/machine-hero.svg" alt="The Chaos Engine machine" />
      <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
      <div className="machine-grid">{[...Array(9)].map((_, index) => { const itemId = placed[index]; const item = components.find((component) => component.id === itemId); const isComboTarget = Boolean(itemId && activeCombination?.componentIds.includes(itemId)); return <button key={index} className={`machine-slot ${item ? `filled ${item.color} newly-added` : ''} ${selected === itemId ? 'active' : ''} ${isComboTarget ? 'combination-target' : ''}`} onClick={() => item && onSelect(item.id)} aria-label={item ? `Select ${item.name}` : 'Empty machine slot'}>{item ? <><span>{item.icon}</span><small>{item.name}</small></> : <span className="slot-plus">+</span>}</button> })}</div>
      <div className="machine-core"><div className="core-ring"><div>*</div></div><span>CORE STABILITY <b>{Math.min(100, 48 + placed.length * 7)}%</b></span></div>
    </div>
  </div>
}
