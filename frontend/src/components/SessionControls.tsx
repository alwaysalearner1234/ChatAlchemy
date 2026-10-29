import type { SessionStatus } from '../types'

type Props = { status: SessionStatus; onStart: () => void; onPause: () => void; onResume: () => void; onFinish: () => void; onReset: () => void }

export function SessionControls({ status, onStart, onPause, onResume, onFinish, onReset }: Props) {
  const live = status === 'running'
  return <div className="panel control-panel"><div className="panel-heading"><div><span className="eyebrow">SESSION CONTROL</span><h2>Keep it moving</h2></div><span className={`live-pill ${status === 'finished' ? 'finished' : ''}`}>LIVE</span></div><div className="control-row"><span>Session status</span><b className="control-value">{status === 'ready' ? 'Ready to start' : status === 'finished' ? 'Challenge unlocked' : live ? 'Receiving builders' : 'Paused'}</b></div><div className="session-buttons">{status === 'ready' && <button className="primary-btn" onClick={onStart}>Start</button>}{status === 'running' && <button className="pause-btn" onClick={onPause}>Pause</button>}{status === 'paused' && <button className="primary-btn" onClick={onResume}>Resume</button>}{status !== 'finished' && <button className="end-btn" onClick={onFinish}>Finish</button>}<button className="ghost-btn" onClick={onReset}>Reset</button></div></div>
}
