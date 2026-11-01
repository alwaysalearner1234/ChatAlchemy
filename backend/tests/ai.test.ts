import { describe, expect, it, vi } from 'vitest';
import { generateMachineOutput } from '../src/ai.js';
import type { MachineState } from '../src/engine.js';

const state: MachineState = {
  sessionId: 'session-a', status: 'finalizing', components: [
    { instanceId: 'c1', componentId: 'battery', contributorId: 'viewer', contributorName: 'viewer', timestamp: 1, position: { x: 20, y: 25 } },
    { instanceId: 'c2', componentId: 'gear', contributorId: 'viewer', contributorName: 'viewer', timestamp: 2, position: { x: 35, y: 25 } },
  ], activeCombos: ['Mechanical Power'], buildEndsAt: null, machineName: null, description: null,
  personality: null, challenge: null, revision: 5, mode: 'DEMO', eventIds: [],
};
const valid = {
  machineName: 'Copper Comet', description: 'A battery-powered gear assembly.', personality: 'Curious and steady.',
  challenge: { title: 'Power Check', instructions: 'unsafe arbitrary text is discarded', difficulty: 'medium', challengeType: 'precision' },
};

describe('AI response validation and fallback', () => {
  it('accepts required identity fields and applies an approved challenge template', async () => {
    const request = vi.fn(async () => valid);
    const result = await generateMachineOutput(state, request);
    expect(result.machineName).toBe('Copper Comet');
    expect(result.challenge.instructions).toMatch(/low-risk precision task/i);
    expect(request).toHaveBeenCalledWith({ components: ['Battery', 'Gear'], combinations: ['Mechanical Power'], count: 2 });
  });
  it('accepts the optional personality field when omitted', async () => {
    const result = await generateMachineOutput(state, async () => { const { personality: _personality, ...withoutPersonality } = valid; return withoutPersonality; });
    expect(result.machineName).toBe(valid.machineName);
    expect(result.personality).toBeTruthy();
  });
  it.each([
    { ...valid, description: undefined },
    { ...valid, challenge: { ...valid.challenge, difficulty: 'extreme' } },
    { ...valid, challenge: { ...valid.challenge, challengeType: 'unsafe' } },
    { ...valid, challenge: { ...valid.challenge, title: '' } },
  ])('falls back for invalid structured output', async invalid => {
    const result = await generateMachineOutput(state, async () => invalid);
    expect(result.machineName).toBe('Mechanical Power Mk. 2');
    expect(result.challenge.difficulty).toBe('medium');
  });
  it('falls back for malformed responses and API failures without retrying', async () => {
    const request = vi.fn(async () => { throw new Error('simulated timeout'); });
    const result = await generateMachineOutput(state, request);
    expect(result.description).toContain('Battery, Gear');
    expect(request).toHaveBeenCalledTimes(1);
    const malformed = await generateMachineOutput(state, async () => JSON.parse('{'));
    expect(malformed.machineName).toBe('Mechanical Power Mk. 2');
  });
  it('returns a deterministic fallback when no AI request is configured', async () => {
    const a = await generateMachineOutput(state);
    const b = await generateMachineOutput(state);
    expect(a).toEqual(b);
  });
});
