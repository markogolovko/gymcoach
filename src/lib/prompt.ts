import type { AppSettings, Capability, Equipment, WorkoutSession } from '../storage/types'
import { exerciseById, filterCatalog } from './catalog'
import { summarizeHistory } from './history'
import { workoutJsonSchema } from './workout-schema'

export const SYSTEM_PROMPT = 'You are a careful strength coach. Build a safe, balanced workout using only supplied exercise IDs and equipment. IDs in allowed.r are rep-based and must use u:"r"; IDs in allowed.s are time-based and must use u:"s". Only IDs in allowed.load may have a non-null load. Return only the requested compact JSON. Respect capability and recent training data; suggest conservative progression. Do not invent catalog IDs. Custom movements are allowed only when no listed ID fits. Write coach and notes in the requested language, each coach field at most two short sentences.'

export interface GenerateInput { duration: number; focus: string; feel: string; equipment: Equipment[] }

export function makePromptPayload(input: GenerateInput, settings: AppSettings, capabilities: Capability[], sessions: WorkoutSession[]) {
  const highestKnownLevel = Math.max(0, ...capabilities.map(cap => exerciseById.get(cap.exerciseId)?.level ?? 0))
  const maxLevel = highestKnownLevel ? Math.min(5, highestKnownLevel + 1) : 3
  const allowed = filterCatalog(input.equipment, maxLevel)
  const allowedIds = new Set(allowed.map(exercise => exercise.id))
  const caps = Object.fromEntries(capabilities.filter(cap => allowedIds.has(cap.exerciseId)).map(cap => [cap.exerciseId, cap.max !== null ? cap.max : [cap.loadKg, cap.reps]]))
  const profile = Object.fromEntries(Object.entries({ sex: settings.profile.sex || undefined, age: settings.profile.age ?? undefined, heightCm: settings.profile.heightCm ?? undefined, weightKg: settings.profile.weightKg ?? undefined }).filter(([, value]) => value !== undefined))
  const history = summarizeHistory(sessions)
  history.exercise = Object.fromEntries(Object.entries(history.exercise).filter(([id]) => allowedIds.has(id)))
  const payload = {
    profile,
    capabilities: caps,
    style: settings.style.slice(0, 500),
    request: { duration: input.duration, focus: input.focus.slice(0, 120), feel: input.feel.slice(0, 160), equipment: input.equipment, language: 'en' },
    history,
    allowed: {
      r: allowed.filter(exercise => exercise.type === 'reps').map(exercise => exercise.id),
      s: allowed.filter(exercise => exercise.type === 'time').map(exercise => exercise.id),
      load: allowed.filter(exercise => exercise.loadable).map(exercise => exercise.id),
    },
  }
  return { payload, allowedIds: new Set(allowed.map(exercise => exercise.id)) }
}

export function estimateTokens(payload: unknown): number {
  const chars = SYSTEM_PROMPT.length + JSON.stringify(payload).length + JSON.stringify(workoutJsonSchema).length
  return Math.ceil(chars / 3.6)
}
