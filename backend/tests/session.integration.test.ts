import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

const port = 18934;
const httpUrl = `http://127.0.0.1:${port}`;
let backend: ChildProcess;

async function connect() {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  const backlog: Record<string, unknown>[] = [];
  const waiters = new Map<string, ((value: Record<string, unknown>) => void)[]>();
  socket.on('message', raw => {
    const event = JSON.parse(raw.toString()) as Record<string, unknown>;
    const listeners = waiters.get(String(event.type));
    if (listeners?.length) listeners.shift()?.(event); else backlog.push(event);
  });
  return {
    socket,
    next(type: string) {
      const index = backlog.findIndex(event => event.type === type);
      if (index >= 0) return Promise.resolve(backlog.splice(index, 1)[0]);
      return new Promise<Record<string, unknown>>(resolve => waiters.set(type, [...(waiters.get(type) ?? []), resolve]));
    },
    send(type: string) { socket.send(JSON.stringify({ type })); }
  };
}

async function contribute(username: string, command: string, eventId?: string) {
  const response = await fetch(`${httpUrl}/api/demo-command`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, command, eventId }) });
  return { status: response.status, body: await response.json() as { ok: boolean; reason?: string } };
}

describe('DEMO session integration', () => {
  beforeAll(async () => {
    backend = spawn(process.execPath, ['dist/server.js'], { cwd: process.cwd(), env: { ...process.env, APP_MODE: 'DEMO', PORT: String(port), BUILD_DURATION_SECONDS: '3', VIEWER_COOLDOWN_SECONDS: '1' }, stdio: 'ignore' });
    for (let attempt = 0; attempt < 40; attempt++) {
      try { if ((await fetch(`${httpUrl}/health`)).ok) return; } catch { /* wait for startup */ }
      await delay(100);
    }
    throw new Error('DEMO backend did not start for integration test.');
  }, 10000);

  afterAll(() => { backend?.kill(); });

  it('synchronizes session transitions and validates contribution cooldowns and duplicate events', async () => {
    const client = await connect();
    const initial = await client.next('state.snapshot');
    const initialState = initial.state as { sessionId: string; revision: number };

    client.send('session.start');
    const started = await client.next('session.updated');
    expect((started.state as { status: string }).status).toBe('running');
    client.send('session.pause');
    expect(((await client.next('session.updated')).state as { status: string }).status).toBe('paused');
    expect((await contribute('viewer-a', '!gear')).status).toBe(400);

    client.send('session.resume');
    expect(((await client.next('session.updated')).state as { status: string }).status).toBe('running');
    expect((await contribute('viewer-a', '!gear', 'event-1')).body.ok).toBe(true);
    expect((await contribute('viewer-a', '!laser')).status).toBe(400);
    expect((await contribute('viewer-b', '!gear', 'event-1')).body.reason).toContain('already processed');
    await delay(1050);
    expect((await contribute('viewer-a', '!laser', 'event-2')).body.ok).toBe(true);
    const component = await client.next('component.added');
    expect(component.component).toMatchObject({ id: 'gear', addedBy: 'viewer-a' });

    client.send('session.finish');
    await client.next('challenge.revealed');
    await client.next('session.updated');
    await client.next('session.updated');
    const beforeReset = await fetch(`${httpUrl}/api/state`).then(response => response.json()) as { revision: number; sessionId: string; status: string; machineName?: string; description?: string };
    expect(beforeReset.status).toBe('finished');
    expect(beforeReset.machineName).toBeTruthy();
    expect(beforeReset.description).toBeTruthy();
    client.send('session.reset');
    const reset = await client.next('session.updated');
    const resetState = reset.state as { revision: number; sessionId: string; status: string };
    expect(resetState.status).toBe('ready');
    expect(resetState.sessionId).not.toBe(initialState.sessionId);
    expect(resetState.revision).toBeGreaterThan(beforeReset.revision);
    client.socket.close();
  }, 15000);

  it('closes contributions and reveals a fallback challenge when the server timer expires', async () => {
    const client = await connect();
    await client.next('state.snapshot');
    client.send('session.start');
    await client.next('session.updated');
    const reveal = await client.next('challenge.revealed');
    expect(reveal.challenge).toBeTruthy();
    const state = await fetch(`${httpUrl}/api/state`).then(response => response.json()) as { status: string };
    expect(state.status).toBe('finished');
    expect((await contribute('timer-viewer', '!gear')).status).toBe(400);
    client.socket.close();
  }, 8000);
});
