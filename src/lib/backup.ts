import { z } from 'zod'
import type { AppSnapshot, Storage } from '../storage/types'

const setSchema = z.object({ done: z.boolean(), reps: z.number(), loadKg: z.number().nullable(), completedAt: z.string().nullable() })
const itemSchema = z.object({
  ex: z.string(), name: z.string().nullable(), sets: z.number(), tgt: z.number(), u: z.enum(['r', 's']),
  load: z.number().nullable(), rest: z.number(), note: z.string().nullable(), log: z.array(setSchema), skipped: z.boolean(),
})
const planSchema = z.object({
  v: z.literal(1), title: z.string(), est_min: z.number(), coach: z.string(), cap_updates: z.array(z.object({ ex: z.string(), max: z.number().nullable(), load: z.number().nullable(), reps: z.number().nullable() })),
  blocks: z.array(z.object({ t: z.enum(['warmup', 'main', 'superset', 'circuit', 'core', 'cardio', 'cooldown']), items: z.array(itemSchema) })),
})
const programSchema = z.object({
  id: z.string(), title: z.string(), createdAt: z.string(), updatedAt: z.string(),
  sessionsPerWeek: z.number().int().min(1).max(7), sessionsCompletedThisWeek: z.number().int().min(0).max(1000),
  weekOf: z.string(), nextSlotIndex: z.number().int().min(0), duration: z.number().int().min(20).max(180), focus: z.string(),
  equipment: z.array(z.string()), slots: z.array(z.object({ title: z.string(), focus: z.string(), workout: planSchema })).min(1).max(6),
})
const settingsSchema = z.object({
  apiKey: z.string().default(''), model: z.string(), language: z.string(), units: z.enum(['kg', 'lb']), style: z.string(),
  profile: z.object({ sex: z.string(), age: z.number().nullable(), heightCm: z.number().nullable(), weightKg: z.number().nullable() }),
  equipment: z.array(z.string()), equipmentPreset: z.string(), iosInstallDismissed: z.boolean(),
})
const snapshotSchema = z.object({
  format: z.literal('ai-gym-coach-backup'), version: z.literal(1), exportedAt: z.string(), settings: settingsSchema,
  capabilities: z.array(z.object({ exerciseId: z.string(), max: z.number().nullable(), loadKg: z.number().nullable(), reps: z.number().nullable(), updatedAt: z.string() })),
  weights: z.array(z.object({ id: z.string(), date: z.string(), weightKg: z.number() })),
  sessions: z.array(z.object({ id: z.string(), status: z.enum(['planned', 'active', 'completed']), createdAt: z.string(), startedAt: z.string().nullable(), finishedAt: z.string().nullable(), timerEndsAt: z.number().nullable(), workout: planSchema, rpe: z.number().nullable(), note: z.string(), usage: z.object({ estimatedTokens: z.number(), promptTokens: z.number(), completionTokens: z.number() }).nullable(), generationRequest: z.object({ duration: z.number(), focus: z.string(), feel: z.string() }).nullable(), programRef: z.object({ programId: z.string(), slotIndex: z.number().int().min(0) }).optional() })),
  meta: z.object({ lastBackupAt: z.string().nullable(), schemaVersion: z.number(), program: programSchema.nullable().default(null) }),
})

export function parseBackup(text: string): AppSnapshot {
  let value: unknown
  try { value = JSON.parse(text) }
  catch { throw new Error('This file is not a valid AI Gym Coach backup.') }
  const parsed = snapshotSchema.safeParse(value)
  if (!parsed.success) throw new Error('This file is not a valid AI Gym Coach backup.')
  return parsed.data as AppSnapshot
}

export async function createBackup(storage: Storage, includeApiKey: boolean): Promise<Blob> {
  const snapshot = await storage.exportSnapshot(includeApiKey)
  snapshot.meta.lastBackupAt = new Date().toISOString()
  return new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
}

export async function saveBackupFile(storage: Storage, includeApiKey: boolean): Promise<void> {
  const blob = await createBackup(storage, includeApiKey)
  const file = new File([blob], `form-backup-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' })
  const backedUpAt = new Date().toISOString()
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: 'FORM training backup' })
  } else {
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    anchor.style.display = 'none'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const meta = await storage.getMeta()
  await storage.saveMeta({ ...meta, lastBackupAt: backedUpAt })
}

export async function restoreBackup(storage: Storage, text: string): Promise<void> {
  const snapshot = parseBackup(text)
  await storage.replaceSnapshot(snapshot)
}
