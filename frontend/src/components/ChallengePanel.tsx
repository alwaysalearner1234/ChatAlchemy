import type { MachineComponent } from '../types'

type Props = { placed: MachineComponent[]; contributions: number; challenge?: { name: string; description: string; instructions: string; difficulty?: string }; onPreview: () => void }

export function ChallengePanel({ placed, contributions, challenge, onPreview }: Props) {
  return <div className="challenge-card"><div className="challenge-top"><span className="eyebrow">FINAL CHALLENGE</span><span className="challenge-icon">*</span></div><h2>{challenge?.name ?? 'Challenge pending'}</h2><p>{challenge?.description ?? 'Finish the build to generate a challenge from the machine.'}</p><p className="challenge-instructions"><b>{challenge?.difficulty ? `${challenge.difficulty} objective:` : 'Objective:'}</b> {challenge?.instructions ?? 'Your final machine will determine the challenge.'}</p><div className="challenge-stats"><span><b>{placed.length}</b><small>MODULES</small></span><span><b>{contributions}</b><small>CONTRIBUTIONS</small></span><span><b>{Math.min(100, 48 + placed.length * 7)}%</b><small>STABILITY</small></span></div><button className="challenge-btn" onClick={onPreview}>Preview challenge <span>-&gt;</span></button></div>
}
