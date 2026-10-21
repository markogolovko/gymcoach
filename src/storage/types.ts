export type LanguageCode = string
export type Units = 'kg' | 'lb'
export type ExerciseType = 'reps' | 'time'
export type ExercisePattern = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'mobility' | 'full_body'
export type Equipment =
  | 'bodyweight' | 'pullup_bar' | 'dip_bars' | 'rings' | 'parallettes'
  | 'dumbbells' | 'barbell' | 'kettlebell' | 'bands' | 'cable' | 'machine'
  | 'bench' | 'cardio_machine'

export interface AppSettings {
  apiKey: string
  model: string
  language: LanguageCode
  units: Units
  style: string
  profile: { sex: string; age: number | null; heightCm: number | null; weightKg: number | null }
  equipment: Equipment[]
  equipmentPreset: string
  iosInstallDismissed: boolean
}

export interface Capability {
  exerciseId: string
  max: number | null
  loadKg: number | null
  reps: number | null
  updatedAt: string
}

export interface WeightEntry { id: string; date: string; weightKg: number }

export type BlockType = 'warmup' | 'main' | 'superset' | 'circuit' | 'core' | 'cardio' | 'cooldown'
export interface WorkoutSet {
  done: boolean
  reps: number
  loadKg: number | null
  completedAt: string | null
}
export interface WorkoutItem {
  ex: string
  name: string | null
  sets: number
  tgt: number
  u: 'r' | 's'
  load: number | null
  rest: number
  note: string | null
  log: WorkoutSet[]
  skipped: boolean
}
export interface WorkoutBlock { t: BlockType; items: WorkoutItem[] }
export interface CapabilityUpdate { ex: string; max: number | null; load: number | null; reps: number | null }
export interface WorkoutPlan {
  v: 1
  title: string
  est_min: number
  blocks: WorkoutBlock[]
  coach: string
  cap_updates: CapabilityUpdate[]
}
export interface TrainingProgramSlot { title: string; focus: string; workout: WorkoutPlan }
export interface TrainingProgram {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  sessionsPerWeek: number
  sessionsCompletedThisWeek: number
  weekOf: string
  nextSlotIndex: number
  duration: number
  focus: string
  equipment: Equipment[]
  slots: TrainingProgramSlot[]
}
export type SessionStatus = 'planned' | 'active' | 'completed'
export interface WorkoutSession {
  id: string
  status: SessionStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  timerEndsAt: number | null
  workout: WorkoutPlan
  rpe: number | null
  note: string
  usage: { estimatedTokens: number; promptTokens: number; completionTokens: number } | null
  generationRequest: { duration: number; focus: string; feel: string } | null
  programRef?: { programId: string; slotIndex: number }
}
export interface AppMeta { lastBackupAt: string | null; schemaVersion: number; program?: TrainingProgram | null }
export interface AppSnapshot {
  format: 'ai-gym-coach-backup'
  version: 1
  exportedAt: string
  settings: AppSettings
  capabilities: Capability[]
  weights: WeightEntry[]
  sessions: WorkoutSession[]
  meta: AppMeta
}

export interface Storage {
  getSettings(): Promise<AppSettings>
  saveSettings(value: AppSettings): Promise<void>
  listCapabilities(): Promise<Capability[]>
  saveCapability(value: Capability): Promise<void>
  deleteCapability(exerciseId: string): Promise<void>
  listWeights(): Promise<WeightEntry[]>
  saveWeight(value: WeightEntry): Promise<void>
  listSessions(): Promise<WorkoutSession[]>
  getSession(id: string): Promise<WorkoutSession | undefined>
  saveSession(value: WorkoutSession): Promise<void>
  getMeta(): Promise<AppMeta>
  saveMeta(value: AppMeta): Promise<void>
  exportSnapshot(includeApiKey?: boolean): Promise<AppSnapshot>
  replaceSnapshot(value: AppSnapshot): Promise<void>
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '', model: 'gpt-5.4-mini', language: 'en', units: 'kg', style: '',
  profile: { sex: '', age: null, heightCm: null, weightKg: null },
  equipment: ['bodyweight', 'pullup_bar', 'dip_bars', 'rings', 'parallettes', 'dumbbells', 'barbell', 'kettlebell', 'bands', 'cable', 'machine', 'bench', 'cardio_machine'], equipmentPreset: 'gym', iosInstallDismissed: false,
}
