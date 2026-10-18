import type { WorkoutSession } from '../storage/types'

export interface ExerciseBest { best: number; trend: 'up' | 'flat' | 'down'; recent: number[] }
export interface HistorySummary {
  last: Array<[string, Array<[string, Array<number | null>, Array<number | null>, number, number | null]>]>
  exercise: Record<string, ExerciseBest>
  avg_completion: number
}

function metrics(session: WorkoutSession) {
  let planned = 0, done = 0
  const exercises = new Map<string, { reps: Array<number | null>; loads: Array<number | null>; best: number }>()
  for (const block of session.workout.blocks) for (const item of block.items) {
    planned += item.sets
    const reps = item.log.map(set => set.done ? set.reps : null)
    const loads = item.log.map(set => set.done ? set.loadKg : null)
    done += item.log.filter(set => set.done).length
    const score = Math.max(0, ...item.log.filter(set => set.done).map(set => (set.reps || 0) * (set.loadKg ?? 1)))
    const previous = exercises.get(item.ex) ?? { reps: [], loads: [], best: 0 }
    previous.reps.push(...reps)
    previous.loads.push(...loads)
    previous.best = Math.max(previous.best, score, ...item.log.filter(set => set.done).map(set => set.reps))
    exercises.set(item.ex, previous)
  }
  return { completion: planned ? done / planned : 0, exercises }
}

export function summarizeHistory(sessions: WorkoutSession[]): HistorySummary {
  const completed = sessions.filter(session => session.status === 'completed')
    .sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt))
  const last = completed.slice(0, 3).map(session => {
    const rows: Array<[string, Array<number | null>, Array<number | null>, number, number | null]> = []
    for (const block of session.workout.blocks) for (const item of block.items) {
      rows.push([item.ex, item.log.map(set => set.done ? set.reps : null), item.log.map(set => set.done ? set.loadKg : null), item.sets, session.rpe])
    }
    return [session.finishedAt ?? session.createdAt, rows] as [string, typeof rows]
  })
  const aggregate = new Map<string, { scores: number[]; best: number }>()
  for (const session of completed.slice().reverse()) for (const [id, value] of metrics(session).exercises) {
    const entry = aggregate.get(id) ?? { scores: [], best: 0 }
    const score = Math.max(0, ...value.reps.map((reps, index) => reps === null ? 0 : reps * (value.loads[index] ?? 1)))
    entry.scores.push(score)
    entry.best = Math.max(entry.best, value.best)
    aggregate.set(id, entry)
  }
  const exercise = Object.fromEntries([...aggregate].map(([id, value]) => {
    const scores = value.scores.slice(-3)
    const first = scores.at(-2) ?? scores.at(-1) ?? 0
    const recent = scores.at(-1) ?? 0
    const trend = recent > first ? 'up' : recent < first ? 'down' : 'flat'
    return [id, { best: value.best, trend, recent: scores }]
  })) as HistorySummary['exercise']
  const avg = completed.length ? completed.reduce((sum, session) => sum + metrics(session).completion, 0) / completed.length : 0
  return { last, exercise, avg_completion: Math.round(avg * 100) }
}

export function completionRate(session: WorkoutSession): number {
  const all = session.workout.blocks.flatMap(block => block.items)
  const total = all.reduce((sum, item) => sum + item.sets, 0)
  const done = all.reduce((sum, item) => sum + item.log.filter(set => set.done).length, 0)
  return total ? Math.round(done * 100 / total) : 0
}

export function plannedSetCount(session: WorkoutSession): number {
  return session.workout.blocks.reduce((sum, block) => sum + block.items.reduce((inner, item) => inner + item.sets, 0), 0)
}

export function doneSetCount(session: WorkoutSession): number {
  return session.workout.blocks.reduce((sum, block) => sum + block.items.reduce((inner, item) => inner + item.log.filter(set => set.done).length, 0), 0)
}
