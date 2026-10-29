import type { PlacedComponent } from '../types'

type Props = { placed: PlacedComponent[]; description?: string }

export function NarratorPanel({ placed, description }: Props) {
  const recent = [...placed].reverse().slice(0, 3)
  return <>
    <div className="narrator-card panel"><div className="narrator-bot">✦</div><div><span className="eyebrow">AI NARRATOR</span><p>{description ?? (placed.length ? `The machine is waking up with ${placed.length} community-built module${placed.length === 1 ? '' : 's'} online. Keep feeding the chaos.` : 'The core is waiting for its first spark. Type a command and bring the machine to life.')}</p></div></div>
    <div className="recent-card panel"><div className="panel-heading"><div><span className="eyebrow">RECENT COMPONENTS</span><h2>Latest sparks</h2></div><span className="count-badge">{placed.length}</span></div>{recent.length ? recent.map((item) => <div className="recent-row" key={item.instanceId}><span className={`component-icon small ${item.color}`}>{item.icon}</span><span><b>{item.name}</b><small>{item.addedBy ?? 'community'} added a module</small></span><time>NOW</time></div>) : <p className="panel-copy">Accepted contributions will appear here.</p>}</div>
  </>
}
