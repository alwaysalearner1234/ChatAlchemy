import { useMemo, useState } from 'react'
import './App.css'
import { ChallengePanel } from './components/ChallengePanel'
import { ChatPanel } from './components/ChatPanel'
import { MachineCanvas } from './components/MachineCanvas'
import { NarratorPanel } from './components/NarratorPanel'
import { Palette } from './components/Palette'
import { SessionControls } from './components/SessionControls'
import { mockActivity, mockComponents, MOCK_DURATION_SECONDS } from './data/mockData'
import { useMachineSocket } from './hooks/useMachineSocket'

function App() {
  const { state, connection, error, activeCombination, clearError, send } = useMachineSocket()
  const [selected, setSelected] = useState<string | null>(null)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState('Mira')
  const [profileDraft, setProfileDraft] = useState('Mira')
  const [command, setCommand] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { name: 'PixelPanda', text: '!gear', tone: 'orange' },
    { name: 'starlit_ryu', text: '!laser', tone: 'pink' },
    { name: 'mello_cat', text: '!portal', tone: 'blue' },
    { name: 'krishplays', text: '!battery', tone: 'green' },
  ])
  const minutes = String(Math.floor(state.remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(state.remainingSeconds % 60).padStart(2, '0')
  const progress = Math.round((state.components.length / mockComponents.length) * 100)
  const selectedComponents = useMemo(() => state.components.map((item) => item.id), [state.components])
  const sessionStatus = state.status === 'ready' ? 'READY SESSION' : state.status === 'finished' ? 'CHALLENGE READY' : state.status === 'paused' ? 'SESSION PAUSED' : 'LIVE SESSION'
  const addComponent = (id: string, author = 'demo-viewer') => { setSelected(id); send({ type: 'component.add', componentId: id }); const item = mockComponents.find((component) => component.id === id); if (item) setChatMessages((current) => [...current, { name: author, text: `!${id}`, tone: item.color }]) }
  const submitCommand = () => { const id = command.trim().toLowerCase().replace(/^!/, ''); if (mockComponents.some((item) => item.id === id)) addComponent(id, 'you'); setCommand('') }
  const reset = () => { setSelected(null); send({ type: 'session.reset' }) }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><img src="/logo-mark.svg" alt="ChatAlchemy logo" /></div><div><strong><span className="brand-chat">Chat</span><span className="brand-alchemy">Alchemy</span></strong><small>CHAT BUILDS · AI BRINGS IT TO LIFE</small></div></div><div className="session-status"><i className={`live-dot ${state.status === 'paused' || state.status === 'finished' ? 'paused' : ''}`} /><span>{sessionStatus}</span><b>-</b><span className="muted">#machine-lab-04</span></div><div className="top-actions"><span className={`connection-badge ${connection}`}>{connection === 'demo' ? 'DEMO MODE' : connection.toUpperCase()}</span><div className="profile-wrap"><button className="profile-pill" onClick={() => { setProfileDraft(profileName); setProfileOpen((open) => !open) }} aria-expanded={profileOpen}><div className="avatar">{profileName.charAt(0).toUpperCase()}</div><span className="user-name">{profileName}</span><span className="profile-caret">⌄</span></button>{profileOpen && <form className="profile-menu" onSubmit={(event) => { event.preventDefault(); setProfileName(profileDraft.trim() || 'Mira'); setProfileOpen(false) }}><span className="eyebrow">STREAMER PROFILE</span><label>Display name<input value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} autoFocus /></label><button className="primary-btn" type="submit">Save profile</button></form>}</div></div></header>
    {error && <div className="connection-alert" role="alert"><span>{error}</span><button onClick={clearError}>x</button></div>}
    <section className="stats-row"><div className="stat-card"><div className="stat-icon spark">*</div><div><span>CONTRIBUTIONS</span><strong>{state.contributions}</strong></div><small className="trend">{connection === 'demo' ? 'MOCK DATA' : 'LIVE STATE'}</small></div><div className="stat-card"><div className="stat-icon users">+</div><div><span>BUILDERS ONLINE</span><strong>{state.buildersOnline}</strong></div><small className="trend">LIVE</small></div><div className="stat-card timer-card"><div className="stat-icon clock">O</div><div><span>TIME REMAINING</span><strong>{minutes}:{seconds}</strong></div><div className="timer-progress"><i style={{ width: `${(state.remainingSeconds / MOCK_DURATION_SECONDS) * 100}%` }} /></div></div><div className="stat-card goal-card"><div><span>BUILD PROGRESS</span><strong>{progress}%</strong></div><div className="goal-bar"><i style={{ width: `${progress}%` }} /></div><small>{state.components.length} of 10 modules placed</small></div></section>
    <div className="workspace"><div className="left-rail"><ChatPanel messages={chatMessages} command={command} onCommandChange={setCommand} onSubmit={submitCommand} /><Palette components={mockComponents} placed={selectedComponents} selected={selected} onSelect={(id) => addComponent(id, 'you')} /></div><section className="build-zone"><div className="build-heading"><div><span className="eyebrow">LIVE BUILD / PHASE 01</span><h1><span className="machine-title">THE CHAOS ENGINE</span></h1><p>{state.description ?? 'Chat builds. AI brings it to life.'}</p></div><button className="share-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share build</button></div><MachineCanvas components={state.components} placed={selectedComponents} selected={selected} activeCombination={activeCombination} onSelect={setSelected} /><div className="activity-feed"><div className="feed-heading"><span className="eyebrow">COMMUNITY ACTIVITY</span><button>View all</button></div>{mockActivity.map(([name, action, time]) => <div className="activity-row" key={name}><div className="mini-avatar">{name[0]}</div><p><b>{name}</b> {action}</p><time>{time}</time></div>)}</div></section><aside className="right-rail"><NarratorPanel placed={state.components} description={state.description} /><ChallengePanel placed={state.components} contributions={state.contributions} onPreview={() => setChallengeOpen(true)} /><SessionControls status={state.status} onStart={() => send({ type: 'session.start' })} onPause={() => send({ type: 'session.pause' })} onResume={() => send({ type: 'session.resume' })} onFinish={() => send({ type: 'session.finish' })} onReset={reset} /><div className="tip-card"><span>*</span><p><b>Builder tip</b><br />Try combining different module categories for unexpected results.</p></div></aside></div>
    <footer className="footer"><span>CHAT<span>ALCHEMY</span> <b>-</b> HACK THE FUTURE</span><span>WebSocket-ready {connection === 'demo' ? 'mock session' : 'live session'} <i className="status-dot" /> All systems nominal</span></footer>
    {challengeOpen && <div className="modal-backdrop" onClick={() => setChallengeOpen(false)}><div className="challenge-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setChallengeOpen(false)}>x</button><span className="challenge-icon large">*</span><span className="eyebrow">FINAL CHALLENGE</span><h2>{state.challenge?.name ?? 'Final Challenge'}</h2><p>{state.challenge?.description ?? 'The final machine challenge is being prepared.'}</p><p><b>Instructions:</b> {state.challenge?.instructions ?? 'Wait for the challenge event from the server.'}</p><button className="primary-btn" onClick={() => setChallengeOpen(false)}>Back to build</button></div></div>}
  </main>
}

export default App
