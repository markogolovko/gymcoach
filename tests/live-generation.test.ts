import { expect, it } from 'vitest'
import { generateWorkout } from '../src/lib/openai'
import { DEFAULT_SETTINGS, type Equipment } from '../src/storage/types'

const liveEnabled = process.env.RUN_LIVE_WORKOUT_TEST === '1'
const liveTest = liveEnabled ? it : it.skip

const scenarios: Array<{ name: string; focus: string; equipment: Equipment[] }> = [
  { name: 'goblet squat with a recorded capability', focus: 'Goblet squat and balanced lower-body strength', equipment: DEFAULT_SETTINGS.equipment },
  { name: 'bodyweight pull session', focus: 'Pull-up strength and core', equipment: ['bodyweight', 'pullup_bar', 'dip_bars'] },
  { name: 'dumbbell only', focus: 'Full-body dumbbell strength', equipment: ['bodyweight', 'dumbbells', 'bench'] },
  { name: 'commercial gym machines', focus: 'Push strength with machines and cables', equipment: ['bodyweight', 'machine', 'cable', 'bench'] },
  { name: 'short mobility session', focus: 'Gentle mobility and light core work', equipment: ['bodyweight'] },
]

liveTest('generates and validates a batch of real workouts', async () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Set OPENAI_API_KEY in .env.local before running npm run test:live.')

  const requestedRuns = Number.parseInt(process.env.LIVE_WORKOUT_RUNS ?? '5', 10)
  if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 25) {
    throw new Error('LIVE_WORKOUT_RUNS must be an integer from 1 to 25.')
  }

  const settings = { ...DEFAULT_SETTINGS, apiKey }
  const weightedGobletCapability = {
    exerciseId: 'goblet_squat', max: null, loadKg: 20, reps: 8,
    updatedAt: new Date().toISOString(),
  }
  let promptTokens = 0
  let completionTokens = 0

  for (let index = 0; index < requestedRuns; index += 1) {
    const scenario = scenarios[index % scenarios.length]
    const result = await generateWorkout(
      { duration: index === 4 ? 25 : 45, focus: scenario.focus, feel: 'Good energy', equipment: scenario.equipment },
      settings,
      index === 0 ? [weightedGobletCapability] : [],
      [],
    )
    const items = result.workout.blocks.flatMap(block => block.items)
    expect(result.workout.title.length).toBeGreaterThan(0)
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(32)
    expect(result.workout.cap_updates.every(update =>
      (update.max !== null && update.load === null && update.reps === null)
      || (update.max === null && update.load !== null && update.reps !== null),
    )).toBe(true)
    promptTokens += result.usage.promptTokens
    completionTokens += result.usage.completionTokens
    console.log(`[live ${index + 1}/${requestedRuns}] ${scenario.name}: ${result.workout.title}; ${items.length} movements; ${result.usage.promptTokens + result.usage.completionTokens} tokens`)
  }

  console.log(`[live] total usage: ${promptTokens} input + ${completionTokens} output = ${promptTokens + completionTokens} tokens`)
}, 300_000)
