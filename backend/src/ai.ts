import { z } from 'zod';
import { approvedInstructions, catalog, fallback, type MachineState } from './engine.js';

const responseSchema = z.object({
  machineName: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(500),
  personality: z.string().trim().max(200).optional(),
  challenge: z.object({
    title: z.string().trim().min(1).max(80),
    instructions: z.string().trim().min(1).max(500),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    challengeType: z.enum(['precision', 'reaction', 'creativity', 'movement']),
  }).strict(),
}).strict();

export type MachineGeneration = ReturnType<typeof fallback>;
export type GenerationContext = { components: string[]; combinations: string[]; count: number };
export type GenerationRequest = (context: GenerationContext) => Promise<unknown>;

export async function generateMachineOutput(state: MachineState, request?: GenerationRequest): Promise<MachineGeneration> {
  const safeFallback = fallback(state);
  if (!request) return safeFallback;
  const context: GenerationContext = {
    components: state.components.map(component => catalog.find(item => item.id === component.componentId)?.name ?? component.componentId),
    combinations: [...state.activeCombos],
    count: state.components.length,
  };
  try {
    const parsed = responseSchema.safeParse(await request(context));
    if (!parsed.success) return safeFallback;
    const value = parsed.data;
    return {
      machineName: value.machineName,
      description: value.description,
      personality: value.personality || 'Curious, inventive, and slightly unpredictable.',
      challenge: {
        title: value.challenge.title,
        instructions: approvedInstructions(value.challenge.challengeType),
        difficulty: value.challenge.difficulty,
        challengeType: value.challenge.challengeType,
      },
    };
  } catch {
    return safeFallback;
  }
}
