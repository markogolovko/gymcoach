import source from '../data/exercises.json'
import { exerciseText } from '../i18n'
import type { Equipment, ExercisePattern, ExerciseType } from '../storage/types'

export interface Exercise {
  id: string; muscles: string[]; pattern: ExercisePattern; level: number; type: ExerciseType
  equipment: Equipment[]; loadable: boolean; progressions: string[]; regressions: string[]
}
export const catalog = source as Exercise[]
export const exerciseById = new Map(catalog.map(exercise => [exercise.id, exercise]))

export function nameFor(id: string): string { return exerciseText(id).name }
export function cueFor(id: string): string { return exerciseText(id).cue }
export function starterLoadKg(exerciseId: string, bodyWeightKg: number | null = null): number {
  const exercise = exerciseById.get(exerciseId)
  if (!exercise?.loadable) return 0

  const isolation = /curl|raise|fly|pushdown|face_pull|reverse_fly|calf_raise|leg_curl|leg_extension/.test(exerciseId)
  const lowerBody = exercise.pattern === 'legs'
  const machinePress = exerciseId === 'chest_press_machine'
  const baseline = machinePress ? 15 : isolation ? 2.5 : lowerBody ? (exercise.equipment.includes('barbell') ? 15 : 10) : (exercise.equipment.includes('barbell') ? 10 : 5)
  const bodyWeightRatio = machinePress ? 0.18 : isolation ? 0.05 : lowerBody ? 0.2 : 0.12
  const estimate = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg * bodyWeightRatio : baseline
  return Math.max(machinePress ? 15 : 2.5, Math.round(estimate / 2.5) * 2.5)
}

export function filterCatalog(equipment: Equipment[], maxLevel = 5): Exercise[] {
  const available = new Set(['bodyweight', ...equipment])
  return catalog.filter(exercise => exercise.level <= maxLevel && exercise.equipment.every(tag => available.has(tag)))
}
