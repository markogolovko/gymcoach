import type { AppSettings, Capability, WorkoutPlan, WorkoutSession } from '../storage/types'
import { exerciseById } from './catalog'
import { makePromptPayload, estimateTokens, SYSTEM_PROMPT, type GenerateInput } from './prompt'
import { validateWorkout, validationMessage, workoutJsonSchema } from './workout-schema'

export class CoachError extends Error {
  public kind: 'key' | 'rate' | 'network' | 'invalid' | 'generic'
  constructor(kind: 'key' | 'rate' | 'network' | 'invalid' | 'generic', message?: string) {
    super(message ?? kind)
    this.kind = kind
    this.name = 'CoachError'
  }
}

export interface GenerationResult {
  workout: WorkoutPlan
  usage: { estimatedTokens: number; promptTokens: number; completionTokens: number }
}

export async function generateWorkout(input: GenerateInput, settings: AppSettings, capabilities: Capability[], sessions: WorkoutSession[]): Promise<GenerationResult> {
  if (!settings.apiKey.trim()) throw new CoachError('key')
  const { payload, allowedIds } = makePromptPayload(input, settings, capabilities, sessions)
  const estimatedTokens = estimateTokens(payload)
  let correction = ''
  let promptTokens = 0, completionTokens = 0
  let lastValidation: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
        body: JSON.stringify({
          model: settings.model.trim() || 'gpt-5.4-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `${JSON.stringify(payload)}${correction}` },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'gym_workout_v1', strict: true, schema: workoutJsonSchema } },
          max_completion_tokens: 2500,
        }),
      })
    } catch {
      throw new CoachError('network')
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new CoachError('key')
      if (response.status === 429) throw new CoachError('rate')
      if (response.status >= 500) throw new CoachError('network')
      const err = await response.json().catch(() => null) as { error?: { message?: string } } | null
      throw new CoachError('generic', err?.error?.message ?? `OpenAI request failed (${response.status}).`)
    }
    const result = await response.json() as {
      choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    promptTokens += result.usage?.prompt_tokens ?? 0
    completionTokens += result.usage?.completion_tokens ?? 0
    const message = result.choices?.[0]?.message
    if (message?.refusal) throw new CoachError('generic', message.refusal)
    try {
      if (!message?.content) throw new Error('The response did not contain a workout.')
      const output = JSON.parse(message.content)
      const workout = validateWorkout(output, allowedIds)
      for (const block of workout.blocks) for (const item of block.items) {
        const capability = capabilities.find(value => value.exerciseId === item.ex)
        if (item.load === null && capability?.loadKg !== null && capability?.loadKg !== undefined && exerciseById.get(item.ex)?.loadable) {
          item.load = capability.loadKg
          item.log = item.log.map(set => ({ ...set, loadKg: capability.loadKg }))
        }
      }
      return {
        workout,
        usage: { estimatedTokens, promptTokens, completionTokens },
      }
    } catch (error) {
      lastValidation = error
      if (attempt === 0) correction = `\n\nThe previous result failed validation: ${validationMessage(error)}. Return a corrected workout using only allowed IDs.`
    }
  }
  throw new CoachError('invalid', validationMessage(lastValidation))
}
