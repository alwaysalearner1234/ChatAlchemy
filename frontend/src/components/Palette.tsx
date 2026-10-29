import type { MachineComponent } from '../types'

type Props = { components: MachineComponent[]; placed: string[]; selected: string | null; onSelect: (id: string) => void }

export function Palette({ components, placed, selected, onSelect }: Props) {
  return <aside className="panel inventory-panel"><div className="panel-heading"><div><span className="eyebrow">AVAILABLE MODULES</span><h2>Component palette</h2></div><span className="count-badge">{components.length}</span></div><p className="panel-copy">Click any module to place it in the machine. Every choice changes the build.</p><div className="component-list">{components.map((item) => <button key={item.id} className={`component-item ${selected === item.id ? 'selected' : ''} ${placed.includes(item.id) ? 'placed' : ''}`} onClick={() => onSelect(item.id)}><span className={`component-icon ${item.color}`}>{item.icon}</span><span className="component-info"><b>{item.name}</b><small>{item.kind}</small></span>{placed.includes(item.id) ? <span className="check">OK</span> : <span className="plus">+</span>}</button>)}</div><div className="library-footer"><span><i className="legend-dot violet" /> Placed</span><span><i className="legend-dot" /> Available</span></div></aside>
}
