import { catalog, exerciseById, filterCatalog, nameFor, starterLoadKg } from './catalog'
import type { Capability, Equipment, ExercisePattern, TrainingProgram, WorkoutItem, WorkoutPlan, WorkoutSession } from '../storage/types'

export interface LocalProgramInput {
  duration: number
  focus: string
  feel: string
  equipment: Equipment[]
  sessionsPerWeek: number
}

function id() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` }

export function weekKey(date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function focusPattern(focus: string): ExercisePattern | null {
  const value = focus.toLowerCase()
  if (/chest|push|shoulder|tricep/.test(value)) return 'push'
  if (/back|pull|bicep|lat/.test(value)) return 'pull'
  if (/leg|lower|squat|glute|hamstring/.test(value)) return 'legs'
  if (/core|ab|midsection/.test(value)) return 'core'
  if (/cardio|conditioning|endurance|run/.test(value)) return 'cardio'
  if (/mobility|stretch|flexibility/.test(value)) return 'mobility'
  return null
}

function patternsForSlot(slotIndex: number, sessionsPerWeek: number, focus: ExercisePattern | null): ExercisePattern[] {
  const base: ExercisePattern[] = sessionsPerWeek >= 4
    ? (slotIndex % 2 === 0 ? ['push', 'pull', 'core'] : ['legs', 'core', 'pull'])
    : ['push', 'pull', 'legs', 'core']
  if (focus === 'cardio') base.push('cardio')
  if (focus && focus !== 'mobility') {
    const index = base.indexOf(focus)
    if (index > 0) base.unshift(...base.splice(index, 1))
    else if (index < 0 && focus === 'cardio') base.unshift('cardio')
  }
  if (sessionsPerWeek >= 5 && slotIndex === sessionsPerWeek - 1) return ['push', 'pull', 'legs', 'core']
  return base
}

function slotTitle(index: number, sessionsPerWeek: number): string {
  if (sessionsPerWeek >= 5 && index === sessionsPerWeek - 1) return `Full body ${String.fromCharCode(65 + index)}`
  if (sessionsPerWeek >= 4) return `${index % 2 === 0 ? 'Upper' : 'Lower'} ${String.fromCharCode(65 + Math.floor(index / 2))}`
  return `Full body ${String.fromCharCode(65 + index)}`
}

function freshItem(item: WorkoutItem): WorkoutItem {
  return {
    ...item,
    log: Array.from({ length: item.sets }, () => ({ done: false, reps: item.tgt, loadKg: item.load, completedAt: null })),
    skipped: false,
  }
}

export function buildLocalProgram(input: LocalProgramInput, capabilities: Capability[], bodyWeightKg: number | null = null): TrainingProgram {
  const sessionsPerWeek = Math.min(7, Math.max(1, Math.round(input.sessionsPerWeek)))
  const highestLevel = Math.max(0, ...capabilities.map(capability => exerciseById.get(capability.exerciseId)?.level ?? 0))
  const maxLevel = highestLevel ? Math.min(5, highestLevel + 1) : 2
  const available = filterCatalog(input.equipment, maxLevel)
  const useCount = new Map<string, number>()
  const preferredFocus = focusPattern(input.focus)
  const recoveryFocused = /\b(tired|sore|recovery|low energy|easy|exhausted)\b/i.test(input.feel)
  const duration = Math.min(180, Math.max(20, Math.round(input.duration)))
  const itemCount = Math.min(7, Math.max(3, Math.floor(duration / 12)))
  const baseSets = duration >= 55 && !recoveryFocused ? 3 : 2

  const choose = (pattern: ExercisePattern, slotIndex: number, chosen: Set<string>) => {
    const matching = available.filter(exercise => exercise.pattern === pattern && !chosen.has(exercise.id))
    const fallback = available.filter(exercise => !['mobility', 'cardio'].includes(exercise.pattern) && !chosen.has(exercise.id))
    const pool = (matching.length ? matching : fallback).sort((a, b) =>
      (useCount.get(a.id) ?? 0) - (useCount.get(b.id) ?? 0) || a.level - b.level || a.id.localeCompare(b.id))
    if (!pool.length) return null
    const leastUsed = useCount.get(pool[0].id) ?? 0
    const options = pool.filter(exercise => (useCount.get(exercise.id) ?? 0) === leastUsed)
    const selected = options[slotIndex % options.length]
    chosen.add(selected.id)
    useCount.set(selected.id, (useCount.get(selected.id) ?? 0) + 1)
    return selected
  }

  const slots = Array.from({ length: sessionsPerWeek }, (_, slotIndex) => {
    const title = slotTitle(slotIndex, sessionsPerWeek)
    const desired = patternsForSlot(slotIndex, sessionsPerWeek, preferredFocus)
    const chosen = new Set<string>()
    const selected: Array<{ exercise: (typeof catalog)[number]; pattern: ExercisePattern }> = []
    let patternIndex = 0
    while (selected.length < itemCount && patternIndex < itemCount * 2) {
      const pattern = desired[patternIndex] ?? ['legs', 'pull', 'push', 'core'][patternIndex % 4]
      const exercise = choose(pattern, slotIndex + patternIndex, chosen)
      if (exercise) selected.push({ exercise, pattern: exercise.pattern })
      patternIndex += 1
    }

    const items = selected.map(({ exercise }) => {
      const capability = capabilities.find(value => value.exerciseId === exercise.id)
      const target = exercise.type === 'time' ? 30 : Math.max(6, Math.min(10, capability?.max ? Math.round(capability.max * .65) : 8))
      const load = exercise.loadable
        ? capability?.loadKg && capability.loadKg > 0 ? capability.loadKg : starterLoadKg(exercise.id, bodyWeightKg)
        : null
      return freshItem({
        ex: exercise.id, name: null, sets: baseSets, tgt: target,
        u: exercise.type === 'time' ? 's' : 'r',
        load,
        rest: exercise.type === 'time' ? 45 : 75, note: null, log: [], skipped: false,
      })
    })
    const warmup = available.find(exercise => exercise.pattern === 'mobility')
    const warmupItems = warmup ? [freshItem({ ex: warmup.id, name: null, sets: 1, tgt: 30, u: 's', load: null, rest: 0, note: null, log: [], skipped: false })] : []
    const mainItems = items.filter(item => exerciseById.get(item.ex)?.pattern !== 'core' && exerciseById.get(item.ex)?.pattern !== 'cardio')
    const coreItems = items.filter(item => exerciseById.get(item.ex)?.pattern === 'core')
    const cardioItems = items.filter(item => exerciseById.get(item.ex)?.pattern === 'cardio')
    const blocks: WorkoutPlan['blocks'] = []
    if (warmupItems.length) blocks.push({ t: 'warmup', items: warmupItems })
    if (mainItems.length) blocks.push({ t: 'main', items: mainItems })
    if (coreItems.length) blocks.push({ t: 'core', items: coreItems })
    if (cardioItems.length) blocks.push({ t: 'cardio', items: cardioItems })
    const workout: WorkoutPlan = {
      v: 1, title, est_min: duration, blocks,
      coach: recoveryFocused
        ? 'Keep this session easy and controlled, and stop any movement that causes discomfort. When every set reaches its target, the next version will progress gradually.'
        : 'Keep each set controlled and finish with a few good reps in reserve. When every set reaches its target, the next version of this workout will progress gradually.',
      cap_updates: [],
    }
    return { title, focus: desired.join(' · '), workout }
  })

  const createdAt = new Date().toISOString()
  return {
    id: id(), title: input.focus.trim() ? `${input.focus.trim()} weekly plan` : 'Weekly strength plan',
    createdAt, updatedAt: createdAt, sessionsPerWeek, sessionsCompletedThisWeek: 0, weekOf: weekKey(), nextSlotIndex: 0,
    duration, focus: input.focus.trim(), equipment: [...input.equipment], slots,
  }
}

export function normalizeProgramWeek(program: TrainingProgram, date = new Date()): TrainingProgram {
  const currentWeek = weekKey(date)
  return program.weekOf === currentWeek
    ? program
    : { ...program, weekOf: currentWeek, sessionsCompletedThisWeek: 0, updatedAt: date.toISOString() }
}

function advancedItem(template: WorkoutItem, completed: WorkoutItem, equipment: Equipment[]): WorkoutItem {
  if (completed.skipped || completed.log.length !== completed.sets || !completed.log.every(set => set.done && set.reps >= template.tgt)) return template
  const next = { ...template }
  const exercise = exerciseById.get(template.ex)
  if (template.u === 's' && template.tgt < 60) next.tgt = Math.min(60, template.tgt + 5)
  else if (template.u === 'r' && template.tgt < 12) next.tgt = template.tgt + 1
  else if (exercise?.loadable) {
    const completedLoad = Math.max(template.load ?? 0, ...completed.log.map(set => set.loadKg ?? 0))
    next.load = Math.round((completedLoad + 2.5) * 2) / 2
    next.tgt = template.u === 's' ? 30 : 8
  } else if (template.sets < 4) {
    next.sets = template.sets + 1
    next.tgt = template.u === 's' ? 30 : 8
  } else if (exercise) {
    const available = new Set(['bodyweight', ...equipment])
    const progression = exercise.progressions.map(candidate => exerciseById.get(candidate))
      .find(candidate => candidate && candidate.level <= exercise.level + 1 && candidate.equipment.every(tag => available.has(tag)))
    if (progression) {
      next.ex = progression.id
      next.name = null
      next.load = null
      next.tgt = progression.type === 'time' ? 30 : 8
      next.u = progression.type === 'time' ? 's' : 'r'
    }
  }
  return freshItem(next)
}

export function advanceProgram(program: TrainingProgram, session: WorkoutSession, date = new Date(), performedDate = date): TrainingProgram {
  if (!session.programRef || session.programRef.programId !== program.id) return program
  const slotIndex = session.programRef.slotIndex
  const slot = program.slots[slotIndex]
  if (!slot) return program
  const actualById = new Map(session.workout.blocks.flatMap(block => block.items.map(item => [item.ex, item] as const)))
  const workout: WorkoutPlan = {
    ...slot.workout,
    blocks: slot.workout.blocks.map(block => ({
      ...block,
      items: block.items.map(item => advancedItem(item, actualById.get(item.ex) ?? item, program.equipment)),
    })),
  }
  const slots = program.slots.map((value, index) => index === slotIndex ? { ...value, workout } : value)
  const normalized = normalizeProgramWeek(program, date)
  const completedThisWeek = weekKey(performedDate) === normalized.weekOf
  return {
    ...normalized,
    updatedAt: date.toISOString(),
    sessionsCompletedThisWeek: normalized.sessionsCompletedThisWeek + (completedThisWeek ? 1 : 0),
    nextSlotIndex: (slotIndex + 1) % program.slots.length,
    slots,
  }
}

export function makeProgramSession(program: TrainingProgram, sessionId = id(), createdAt = new Date().toISOString()): WorkoutSession {
  const slotIndex = program.nextSlotIndex % Math.max(1, program.slots.length)
  const slot = program.slots[slotIndex]
  const workout = {
    ...slot.workout,
    blocks: slot.workout.blocks.map(block => ({ ...block, items: block.items.map(freshItem) })),
  }
  return {
    id: sessionId, status: 'planned', createdAt, startedAt: null, finishedAt: null, timerEndsAt: null, holdTimer: null,
    workout, rpe: null, note: '', usage: null,
    generationRequest: { duration: program.duration, focus: slot.focus, feel: '' },
    programRef: { programId: program.id, slotIndex },
  }
}

export function refineProgramSlot(program: TrainingProgram, slotIndex: number, workout: WorkoutPlan): TrainingProgram {
  if (!program.slots[slotIndex]) return program
  const now = new Date().toISOString()
  return {
    ...program, updatedAt: now,
    slots: program.slots.map((slot, index) => index === slotIndex ? {
      ...slot, workout: { ...workout, blocks: workout.blocks.map(block => ({ ...block, items: block.items.map(freshItem) })) },
    } : slot),
  }
}

export function slotLabel(program: TrainingProgram, index = program.nextSlotIndex): string {
  return program.slots[index % program.slots.length]?.title ?? nameFor('bodyweight_squat')
}
