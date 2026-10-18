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
export function filterCatalog(equipment: Equipment[], maxLevel = 5): Exercise[] {
  const available = new Set(['bodyweight', ...equipment])
  return catalog.filter(exercise => exercise.level <= maxLevel && exercise.equipment.every(tag => available.has(tag)))
}
