import type { MachineComponent } from '../types'

type Props = { placed: MachineComponent[]; contributions: number; onPreview: () => void }

export function ChallengePanel({ placed, contributions, onPreview }: Props) {
  return <div className="challenge-card"><div className="challenge-top"><span className="eyebrow">FINAL CHALLENGE</span><span className="challenge-icon">*</span></div><h2>The Resonance Engine</h2><p>A community-built machine that turns chaotic chat energy into a stable pulse.</p><p className="challenge-instructions"><b>Objective:</b> Place at least five components, reach 70% stability, and survive the final resonance test.</p><div className="challenge-stats"><span><b>{placed.length}</b><small>MODULES</small></span><span><b>{contributions}</b><small>CONTRIBUTIONS</small></span><span><b>{Math.min(100, 48 + placed.length * 7)}%</b><small>STABILITY</small></span></div><button className="challenge-btn" onClick={onPreview}>Preview challenge <span>-&gt;</span></button></div>
}
