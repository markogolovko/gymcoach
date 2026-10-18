import { z } from 'zod'
import { catalog } from '../lib/catalog'
import type { WorkoutPlan } from '../storage/types'

export const workoutJsonSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    v: { type: 'integer', const: 1 },
    title: { type: 'string', maxLength: 40 },
    est_min: { type: 'integer', minimum: 1, maximum: 300 },
    blocks: { type: 'array', minItems: 1, maxItems: 12, items: {
      type: 'object', additionalProperties: false,
      properties: {
        t: { type: 'string', enum: ['warmup', 'main', 'superset', 'circuit', 'core', 'cardio', 'cooldown'] },
        items: { type: 'array', minItems: 1, maxItems: 10, items: {
          type: 'object', additionalProperties: false,
          properties: {
            ex: { type: 'string', minLength: 1, maxLength: 48 },
            name: { type: ['string', 'null'], maxLength: 48 },
            sets: { type: 'integer', minimum: 1, maximum: 10 },
            tgt: { type: 'integer', minimum: 1, maximum: 600 },
            u: { type: 'string', enum: ['r', 's'] },
            load: { type: ['number', 'null'], minimum: 0, maximum: 1000 },
            rest: { type: 'integer', minimum: 0, maximum: 600 },
            note: { type: ['string', 'null'], maxLength: 60 },
          },
          required: ['ex', 'name', 'sets', 'tgt', 'u', 'load', 'rest', 'note'],
        } },
      }, required: ['t', 'items'],
    } },
    coach: { type: 'string', maxLength: 260 },
    cap_updates: { type: 'array', maxItems: 12, items: {
      type: 'object', additionalProperties: false,
      properties: {
        ex: { type: 'string', minLength: 1, maxLength: 48 },
        max: { type: ['integer', 'null'], minimum: 1, maximum: 600 },
        load: { type: ['number', 'null'], minimum: 0, maximum: 1000 },
        reps: { type: ['integer', 'null'], minimum: 1, maximum: 300 },
      }, required: ['ex', 'max', 'load', 'reps'],
    } },
  },
  required: ['v', 'title', 'est_min', 'blocks', 'coach', 'cap_updates'],
} as const

const itemSchema = z.object({
  ex: z.string().min(1).max(48), name: z.string().max(48).nullable(),
  sets: z.number().int().min(1).max(10), tgt: z.number().int().min(1).max(600),
  u: z.enum(['r', 's']), load: z.number().min(0).max(1000).nullable(),
  rest: z.number().int().min(0).max(600), note: z.string().max(60).nullable(),
}).strict()
const apiPlanSchema = z.object({
  v: z.literal(1), title: z.string().max(40), est_min: z.number().int().min(1).max(300),
  blocks: z.array(z.object({ t: z.enum(['warmup', 'main', 'superset', 'circuit', 'core', 'cardio', 'cooldown']), items: z.array(itemSchema).min(1).max(10) }).strict()).min(1).max(12),
  coach: z.string().max(260),
  cap_updates: z.array(z.object({ ex: z.string().min(1).max(48), max: z.number().int().min(1).max(600).nullable(), load: z.number().min(0).max(1000).nullable(), reps: z.number().int().min(1).max(300).nullable() }).strict()).max(12),
}).strict()

export function validateWorkout(value: unknown, allowedExerciseIds?: Set<string>): WorkoutPlan {
  const parsed = apiPlanSchema.parse(value)
  const itemCount = parsed.blocks.reduce((sum, block) => sum + block.items.length, 0)
  if (itemCount > 32) throw new Error('A workout may contain at most 32 distinct movements.')
  if ((parsed.coach.match(/[.!?](?:\s|$)/g) ?? []).length > 2) throw new Error('The coach field must be at most two sentences.')
  for (const block of parsed.blocks) for (const item of block.items) {
    if (item.ex === 'custom') {
      if (!item.name?.trim()) throw new Error('Custom exercises need a name.')
    } else {
      const exercise = catalog.find(entry => entry.id === item.ex)
      if (!exercise) throw new Error(`Unknown exercise id: ${item.ex}`)
      if (allowedExerciseIds && !allowedExerciseIds.has(item.ex)) throw new Error(`Exercise ${item.ex} is not in the allowed equipment list.`)
      if (exercise.type === 'time' && item.u !== 's') throw new Error(`${item.ex} uses seconds.`)
      if (exercise.type === 'reps' && item.u !== 'r') throw new Error(`${item.ex} uses reps.`)
      if (item.load !== null && !exercise.loadable) throw new Error(`${item.ex} cannot have a load.`)
    }
  }
  for (const update of parsed.cap_updates) {
    if (update.ex !== 'custom' && !catalog.some(entry => entry.id === update.ex)) throw new Error(`Unknown capability exercise: ${update.ex}`)
    if (allowedExerciseIds && !allowedExerciseIds.has(update.ex)) throw new Error(`Capability update ${update.ex} is not in the allowed equipment list.`)
    const bodyweightUpdate = update.max !== null && update.load === null && update.reps === null
    const loadUpdate = update.max === null && update.load !== null && update.reps !== null
    if (!bodyweightUpdate && !loadUpdate) throw new Error(`Capability update for ${update.ex} must contain either max or load and reps.`)
  }
  return {
    ...parsed,
    blocks: parsed.blocks.map(block => ({ ...block, items: block.items.map(item => ({
      ...item, log: Array.from({ length: item.sets }, () => ({ done: false, reps: item.tgt, loadKg: item.load, completedAt: null })), skipped: false,
    })) })),
  }
}

export function validationMessage(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues.map(issue => `${issue.path.join('.') || 'response'}: ${issue.message}`).join('; ')
  return error instanceof Error ? error.message : 'The workout response did not match the expected format.'
}
