type ChatMessage = { name: string; text: string; tone: string }

type Props = { messages: ChatMessage[]; command: string; onCommandChange: (value: string) => void; onSubmit: () => void }

export function ChatPanel({ messages, command, onCommandChange, onSubmit }: Props) {
  return <div className="chat-panel panel">
    <div className="panel-heading"><div><span className="eyebrow">LIVE CHAT</span><h2>Build channel</h2></div><span className="live-pill">2.4K</span></div>
    <div className="chat-messages">{messages.slice(-6).map((message, index) => <div className="chat-message" key={`${message.name}-${index}`}><span className={`chat-avatar ${message.tone}`}>{message.name[0]}</span><span><b>{message.name}</b><small>{message.text}</small></span></div>)}</div>
    <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); onSubmit() }}><input aria-label="Chat command" value={command} onChange={(event) => onCommandChange(event.target.value)} placeholder="Try !gear or !portal" /><button type="submit">Send</button></form>
  </div>
}
