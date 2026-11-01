import 'dotenv/config';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import OpenAI from 'openai';
import tmi from 'tmi.js';
import { isAuthorizedController } from './authorization.js';
import { generateMachineOutput } from './ai.js';
import { assembly, catalog, componentsForCombo, position, type MachineState } from './engine.js';
const requestedMode = process.env.APP_MODE || 'DEMO';
if (requestedMode !== 'DEMO' && requestedMode !== 'LIVE')
    throw new Error('APP_MODE must be explicitly set to DEMO or LIVE.');
const mode = requestedMode;
if (mode === 'LIVE' && (!process.env.TWITCH_CHANNEL || !process.env.TWITCH_USERNAME || !process.env.TWITCH_ACCESS_TOKEN || !process.env.TWITCH_STREAMER_LOGIN))
    throw new Error('LIVE mode requires TWITCH_CHANNEL, TWITCH_USERNAME, TWITCH_ACCESS_TOKEN and TWITCH_STREAMER_LOGIN.');
function positiveInt(value: string | undefined, fallback: number, name: string): number { const parsed = Number(value ?? fallback); if (!Number.isSafeInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer.`); return parsed; }
const duration = positiveInt(process.env.BUILD_DURATION_SECONDS, 45, 'BUILD_DURATION_SECONDS'), maxComponents = positiveInt(process.env.MAX_COMPONENTS, 30, 'MAX_COMPONENTS'), cooldownMs = positiveInt(process.env.VIEWER_COOLDOWN_SECONDS, 3, 'VIEWER_COOLDOWN_SECONDS') * 1000;
const specialEventCooldownMs = positiveInt(process.env.SPECIAL_EVENT_COOLDOWN_SECONDS, 30, 'SPECIAL_EVENT_COOLDOWN_SECONDS') * 1000;
let state: MachineState = fresh();
const clients = new Set<WebSocket>(), cooldowns = new Map<string, number>(), recentEvents = new Set<string>();
const httpLimits = new Map<string, { start: number; count: number }>();
let timer: NodeJS.Timeout | undefined;
let twitchClient: tmi.Client | undefined;
let pausedRemainingMs = duration * 1000;
let lastSpecialEventAt = 0;
function fresh(revision = 0): MachineState { return { sessionId: randomUUID(), status: 'idle', components: [], activeCombos: [], buildEndsAt: null, machineName: null, description: null, personality: null, challenge: null, revision, mode, eventIds: [] }; }
type WireEvent = { type: string; revision: number; [key: string]: unknown };
function send(ws: WebSocket, event: WireEvent) { if (ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify(event)); }
function publish(type: string, data: Record<string, unknown> = {}) { state.revision++; const event = { type, revision: state.revision, ...data }; for (const ws of clients)
    send(ws, event); }
function snapshot(ws: WebSocket) { send(ws, { type: 'state.snapshot', revision: state.revision, state: uiState() }); }
function update() { state.revision++; const event = { type: 'session.updated', revision: state.revision, state: uiState() }; for (const ws of clients)
    send(ws, event); }
function deriveUiStatus() { return state.status === 'idle' ? 'ready' : state.status === 'building' ? 'running' : state.status === 'revealed' ? 'finished' : state.status === 'finalizing' ? 'finished' : 'paused'; }
function uiState() { return { ...state, status: deriveUiStatus(), remainingSeconds: state.buildEndsAt ? Math.max(0, Math.ceil((state.buildEndsAt - Date.now()) / 1000)) : state.status === 'paused' ? Math.ceil(pausedRemainingMs / 1000) : duration, contributions: state.components.length, buildersOnline: mode === 'DEMO' ? new Set(state.components.map(component => component.contributorId)).size : clients.size, components: state.components.map(component => { const definition = catalog.find(item => item.id === component.componentId)!; return { id: definition.id, name: definition.name, kind: definition.category, icon: { gear: '\u2699\uFE0F', laser: '\uD83D\uDD34', portal: '\uD83C\uDF00', battery: '\uD83D\uDD0B', duck: '\uD83E\uDD86', 'black-hole': '\uD83C\uDF11', spring: '\uD83E\uDEA7', fan: '\uD83C\uDF2C\uFE0F', magnet: '\uD83E\uDDF2', prism: '\uD83D\uDD2E' }[definition.id], color: { gear: 'orange', laser: 'red', portal: 'violet', battery: 'gold', duck: 'yellow', 'black-hole': 'indigo', spring: 'green', fan: 'cyan', magnet: 'pink', prism: 'teal' }[definition.id], description: definition.effects.join(', '), instanceId: component.instanceId, addedAt: new Date(component.timestamp).toISOString(), addedBy: component.contributorName }; }), machineName: state.machineName, description: state.description, personality: state.personality ?? undefined, challenge: state.challenge ? { name: state.challenge.title, description: state.challenge.instructions, instructions: state.challenge.instructions, difficulty: state.challenge.difficulty, type: state.challenge.challengeType } : undefined, activeCombos: state.activeCombos, maxComponents, mode }; }
const commandSchema = z.object({ type: z.string(), componentId: z.string().optional(), eventId: z.string().optional() });
function add(componentId: string, userId: string, userName: string, eventId: string = randomUUID()): { ok: true } | { ok: false; reason: string } { if (state.status !== 'building')
    return { ok: false, reason: 'The build session is not accepting contributions.' }; if (recentEvents.has(eventId))
    return { ok: false, reason: 'This contribution was already processed.' }; const last = cooldowns.get(userId) ?? 0; if (Date.now() - last < cooldownMs)
    return { ok: false, reason: 'Please wait for your contribution cooldown.' }; if (state.components.length >= maxComponents)
    return { ok: false, reason: 'The machine has reached its component limit.' }; const def = catalog.find(c => c.id === componentId); if (!def)
    return { ok: false, reason: 'Unknown component command.' }; recentEvents.add(eventId); if (recentEvents.size > 5000)
    recentEvents.delete(recentEvents.values().next().value!); cooldowns.set(userId, Date.now()); const component = { instanceId: randomUUID(), componentId, contributorId: userId, contributorName: userName, timestamp: Date.now(), position: position(state.components.length) }; state.components.push(component); state.eventIds.push(eventId); publish('component.added', { component: uiState().components.at(-1), contributions: state.components.length }); const combos = assembly(state.components.map(c => c.componentId)); for (const combo of combos)
    if (!state.activeCombos.includes(combo)) {
        state.activeCombos.push(combo);
        publish('combination.activated', { componentIds: state.components.filter(c => componentsForCombo(combo).includes(c.componentId)).map(c => c.componentId), effect: combo === 'Portal Laser' ? 'beam' : combo === 'Anomaly' ? 'orbit' : 'pulse', name: combo });
    } return { ok: true }; }
async function finish(): Promise<void> { if (state.status === 'revealed' || state.status === 'finalizing' || state.status === 'idle')
    return; clearTimeout(timer); state.status = 'finalizing'; state.buildEndsAt = null; update(); void generate(); }
async function generate(): Promise<void> {
  const stable: MachineState = { ...state, components: [...state.components], activeCombos: [...state.activeCombos] };
  const apiKey = process.env.OPENAI_API_KEY;
  const request = apiKey ? async (context: { components: string[]; combinations: string[]; count: number }) => {
    const client = new OpenAI({ apiKey, timeout: positiveInt(process.env.OPENAI_TIMEOUT_MS, 10000, 'OPENAI_TIMEOUT_MS'), maxRetries: 0 });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return JSON with machineName, description, personality, and challenge {title,instructions,difficulty,challengeType}. Use only supplied component names and combinations. Challenge instructions are replaced with approved safe templates; choose a fitting type and difficulty.' },
        { role: 'user', content: JSON.stringify(context) },
      ],
    });
    return JSON.parse(response.choices[0]?.message.content || 'null') as unknown;
  } : undefined;
  const result = await generateMachineOutput(stable, request);
  if (state.sessionId !== stable.sessionId || state.status !== 'finalizing') return;
  state.machineName = result.machineName;
  state.description = result.description;
  state.personality = result.personality;
  state.challenge = result.challenge;
  state.status = 'revealed';
  publish('machine.generated', { machineName: state.machineName, description: state.description, personality: state.personality });
  publish('challenge.revealed', { challenge: state.challenge });
  update();
}
function triggerSpecialEvent(): { ok: true } | { ok: false; reason: string } {
    if (state.status !== 'building') return { ok: false, reason: 'A special event requires an active build.' };
    if (Date.now() - lastSpecialEventAt < specialEventCooldownMs) return { ok: false, reason: 'Special event cooldown is active.' };
    const result = add('duck', 'special-event', 'ChatAlchemy event', `event:${state.sessionId}:${Date.now()}`);
    if (!result.ok) return result;
    lastSpecialEventAt = Date.now();
    publish('event.triggered', { name: 'Wildcard surge' });
    return { ok: true };
}
function control(type: string) { switch (type) {
    case 'session.start':
        state = fresh(state.revision);
        state.status = 'building';
        pausedRemainingMs = duration * 1000;
        state.buildEndsAt = Date.now() + pausedRemainingMs;
        update();
        clearTimeout(timer);
        timer = setTimeout(() => void finish(), pausedRemainingMs);
        break;
    case 'session.pause':
        if (state.status === 'building') {
            pausedRemainingMs = Math.max(0, (state.buildEndsAt || Date.now()) - Date.now());
            clearTimeout(timer);
            state.buildEndsAt = null;
            state.status = 'paused';
            update();
        }
        break;
    case 'session.resume':
        if (state.status === 'paused') {
            const left = pausedRemainingMs;
            state.status = 'building';
            state.buildEndsAt = Date.now() + left;
            update();
            timer = setTimeout(() => void finish(), left);
        }
        break;
    case 'session.finish':
        void finish();
        break;
    case 'event.trigger':
        triggerSpecialEvent();
        break;
    case 'session.reset':
        clearTimeout(timer);
        state = fresh(state.revision);
        pausedRemainingMs = duration * 1000;
        update();
        break;
} }
function allowHttpRequest(req: IncomingMessage, res: ServerResponse): boolean {
    const now = Date.now();
    const key = req.socket.remoteAddress ?? 'unknown';
    const bucket = httpLimits.get(key);
    if (!bucket || now - bucket.start >= 60_000) httpLimits.set(key, { start: now, count: 1 });
    else if (++bucket.count > 120) {
        res.writeHead(429, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Request rate limit exceeded.' }));
        return false;
    }
    if (httpLimits.size > 1000) for (const [address, value] of httpLimits) if (now - value.start >= 60_000) httpLimits.delete(address);
    return true;
}
const server = createServer((req, res) => { if (!allowHttpRequest(req, res)) return; res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'http://localhost:5173'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
} if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, mode }));
    return;
} if (req.url === '/api/state') {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(uiState()));
    return;
} if (req.url === '/api/demo-command' && req.method === 'POST' && mode === 'DEMO') {
    let body = '';
    let tooLarge = false;
    req.on('data', chunk => { if (Buffer.byteLength(body) + chunk.length > 4096) { tooLarge = true; res.writeHead(413).end('Request body too large.'); req.destroy(); return; } body += chunk.toString(); });
    req.on('end', () => { if (tooLarge) return; try {
        const data = z.object({ command: z.string(), username: z.string().min(1).max(40).optional(), eventId: z.string().optional() }).parse(JSON.parse(body));
        const def = catalog.find(c => c.command === data.command.trim().toLowerCase());
        const result = def ? add(def.id, `demo:${data.username || 'viewer'}`, data.username || 'viewer', data.eventId) : { ok: false, reason: 'Unknown component command.' };
        res.writeHead(result.ok ? 200 : 400, { 'content-type': 'application/json' }).end(JSON.stringify(result));
    }
    catch {
        res.writeHead(400).end('Invalid request.');
    } });
    return;
} res.writeHead(404).end('Not found'); });
const wss = new WebSocketServer({ server, maxPayload: 8192 });
wss.on('connection', ws => { clients.add(ws); snapshot(ws); let messageWindowStart = Date.now(), messageCount = 0; ws.on('message', raw => { const now = Date.now(); if (now - messageWindowStart >= 10_000) { messageWindowStart = now; messageCount = 0; } if (++messageCount > 50) { send(ws, { type: 'error', revision: state.revision, message: 'WebSocket rate limit exceeded.' }); ws.close(1008, 'Rate limit exceeded'); return; } try {
    const msg = commandSchema.parse(JSON.parse(raw.toString()));
    if (msg.type === 'state.request') {
        snapshot(ws);
        return;
    }
    if (mode === 'DEMO' && msg.type.startsWith('session.')) {
        control(msg.type);
        return;
    }
    if (mode === 'DEMO' && msg.type === 'event.trigger') {
        const result = triggerSpecialEvent();
        if (!result.ok)
            send(ws, { type: 'component.rejected', revision: state.revision, reason: result.reason });
        return;
    }
    if (mode === 'DEMO' && msg.type === 'component.add' && msg.componentId) {
        const result = add(msg.componentId, 'control:browser', 'you', msg.eventId);
        if (!result.ok)
            send(ws, { type: 'component.rejected', revision: state.revision, reason: result.reason });
    }
}
catch {
    send(ws, { type: 'error', revision: state.revision, message: 'Invalid command payload.' });
} }); ws.on('close', () => clients.delete(ws)); });
if (mode === 'LIVE') {
    const client = new tmi.Client({ options: { debug: false }, connection: { reconnect: true, secure: true }, identity: { username: process.env.TWITCH_USERNAME, password: `oauth:${process.env.TWITCH_ACCESS_TOKEN!.replace(/^oauth:/, '')}` }, channels: [process.env.TWITCH_CHANNEL!] });
    twitchClient = client;
    client.on('connected', () => console.info('Twitch chat connected.'));
    client.on('reconnect', () => console.info('Twitch chat reconnecting.'));
    client.on('disconnected', () => console.warn('Twitch chat disconnected; reconnect is enabled.'));
    client.on('notice', (_channel, msgid) => {
        if (String(msgid) === 'login_authentication_failed') {
            console.error('Twitch authentication failed; verify the backend bot credentials.');
            void client.disconnect();
        }
    });
    client.on('message', (channel, tags, message, self) => { if (self)
        return; const def = catalog.find(c => c.command === message.trim().toLowerCase()); if (def)
        add(def.id, tags['user-id'] || tags.username || 'unknown', tags['display-name'] || tags.username || 'viewer', tags.id || randomUUID());
    else if (message.trim().toLowerCase() === '!machine' && tags.username)
        client.say(channel, `Machine: ${state.components.length} modules, ${state.activeCombos.length} combinations, ${state.status}.`); if (isAuthorizedController(tags.username, { broadcaster: tags.badges?.broadcaster === '1', moderator: tags.mod === true }, process.env.TWITCH_STREAMER_LOGIN, (process.env.TWITCH_MODERATOR_LOGINS || '').split(','))) {
        const controls: Record<string, string> = { '!start': 'session.start', '!pause': 'session.pause', '!resume': 'session.resume', '!finish': 'session.finish', '!reset': 'session.reset', '!event': 'event.trigger' };
        if (controls[message.trim().toLowerCase()])
            control(controls[message.trim().toLowerCase()]);
    } });
    client.connect().catch(() => console.error('Twitch chat connection failed; configured credentials were not logged.'));
}
server.listen(Number(process.env.PORT || 8080), '0.0.0.0', () => console.log(`ChatAlchemy ${mode} backend listening on ${process.env.PORT || 8080}`));

function shutdown() {
    clearTimeout(timer);
    for (const client of clients) client.close(1001, 'Server shutting down');
    void twitchClient?.disconnect();
    wss.close();
    server.close(() => process.exit(0));
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
