import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type AppSnapshot, type Storage, type WorkoutSession } from '../src/storage/types'
import { summarizeHistory } from '../src/lib/history'
import { validateWorkout } from '../src/lib/workout-schema'
import { adjustEndTime, formatTimer, secondsRemaining } from '../src/lib/timer'
import { createBackup, parseBackup, restoreBackup } from '../src/lib/backup'
import { setLanguage, t } from '../src/i18n'

function session(id: string, createdAt: string, status: 'planned' | 'active' | 'completed' = 'completed', reps = 8): WorkoutSession {
  return {
    id, status, createdAt, startedAt: createdAt, finishedAt: status === 'completed' ? createdAt : null, timerEndsAt: null,
    workout: { v: 1, title: 'Test session', est_min: 35, coach: 'Stay smooth.', cap_updates: [], blocks: [{ t: 'main', items: [{
      ex: 'pull_up', name: null, sets: 2, tgt: 8, u: 'r', load: null, rest: 60, note: null, skipped: false,
      log: [{ done: true, reps, loadKg: null, completedAt: createdAt }, { done: true, reps: reps - 1, loadKg: null, completedAt: createdAt }],
    }] }] }, rpe: 7, note: '', usage: null, generationRequest: null,
  }
}

const validPlan = {
  v: 1, title: 'Pull day', est_min: 45,
  blocks: [{ t: 'main', items: [{ ex: 'pull_up', name: null, sets: 3, tgt: 6, u: 'r', load: null, rest: 90, note: null }] }],
  coach: 'Keep two reps in reserve.', cap_updates: [],
}

describe('history summary', () => {
  it('keeps the latest three completed sessions and computes exercise trend and completion', () => {
    const sessions = [
      session('a', '2026-10-01T10:00:00.000Z', 'completed', 5),
      session('b', '2026-10-02T10:00:00.000Z', 'completed', 7),
      session('c', '2026-10-03T10:00:00.000Z', 'completed', 9),
      session('d', '2026-10-04T10:00:00.000Z', 'completed', 11),
      session('draft', '2026-10-05T10:00:00.000Z', 'planned'),
    ]
    const summary = summarizeHistory(sessions)
    expect(summary.last).toHaveLength(3)
    expect(summary.last[0][0]).toBe('2026-10-04T10:00:00.000Z')
    expect(summary.last[0][1][0][0]).toBe('pull_up')
    expect(summary.exercise.pull_up.trend).toBe('up')
    expect(summary.avg_completion).toBe(100)
  })
})

describe('workout schema validation', () => {
  it('accepts a catalog workout and initializes one log entry per set', () => {
    const plan = validateWorkout(validPlan, new Set(['pull_up']))
    expect(plan.blocks[0].items[0].log).toHaveLength(3)
    expect(plan.blocks[0].items[0].log[0].done).toBe(false)
  })
  it('rejects IDs outside the equipment-filtered allow list', () => {
    expect(() => validateWorkout(validPlan, new Set(['push_up']))).toThrow(/allowed equipment list/i)
  })
  it('requires a name for custom movements and rejects invalid target units', () => {
    const custom = { ...validPlan, blocks: [{ t: 'main', items: [{ ex: 'custom', name: null, sets: 1, tgt: 10, u: 'r', load: null, rest: 30, note: null }] }] }
    expect(() => validateWorkout(custom)).toThrow(/need a name/i)
    const timedAsReps = { ...validPlan, blocks: [{ t: 'main', items: [{ ex: 'plank', name: null, sets: 1, tgt: 30, u: 'r', load: null, rest: 30, note: null }] }] }
    expect(() => validateWorkout(timedAsReps)).toThrow(/uses seconds/i)
  })
})

describe('rest timer', () => {
  it('uses the saved end timestamp and adjusts without interval drift', () => {
    const now = 100_000
    expect(secondsRemaining(now + 10_100, now)).toBe(11)
    expect(secondsRemaining(now - 1, now)).toBe(0)
    expect(adjustEndTime(now + 10_000, 15, now)).toBe(now + 25_000)
    expect(adjustEndTime(null, 15, now)).toBe(now + 15_000)
    expect(formatTimer(61)).toBe('01:01')
  })
})

describe('i18n', () => {
  it('falls back to English and resolves simple plural forms', async () => {
    await setLanguage('fr')
    expect(t('settings.apiKey')).toBe('OpenAI API key')
    expect(t('app.setCount', { count: 1 })).toBe('Set 1')
    expect(t('app.setCount', { count: 4 })).toBe('Set 4')
  })
})

describe('backup round trip', () => {
  it('exports a versioned snapshot and restores it through the Storage interface', async () => {
    let current: AppSnapshot = {
      format: 'ai-gym-coach-backup', version: 1, exportedAt: '2026-10-18T12:00:00.000Z',
      settings: { ...DEFAULT_SETTINGS, apiKey: 'secret-test-key' }, capabilities: [], weights: [],
      sessions: [session('one', '2026-10-18T10:00:00.000Z')], meta: { lastBackupAt: null, schemaVersion: 1 },
    }
    const fake = {
      exportSnapshot: async (includeKey = false) => {
        const snapshot = structuredClone(current)
        if (!includeKey) snapshot.settings.apiKey = ''
        return snapshot
      },
      replaceSnapshot: async (snapshot: AppSnapshot) => { current = structuredClone(snapshot) },
    } as unknown as Storage
    const blob = await createBackup(fake, false)
    const parsed = parseBackup(await blob.text())
    expect(parsed.settings.apiKey).toBe('')
    expect(parsed.sessions).toHaveLength(1)
    await restoreBackup(fake, await blob.text())
    expect(current.sessions[0].id).toBe('one')
    expect(current.settings.apiKey).toBe('')
    expect(current.meta.lastBackupAt).not.toBeNull()
  })
})
