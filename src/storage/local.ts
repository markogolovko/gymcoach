import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DEFAULT_SETTINGS, type AppMeta, type AppSettings, type AppSnapshot, type Capability, type Storage, type WeightEntry, type WorkoutSession } from './types'

const DB_NAME = 'ai-gym-coach'
const DB_VERSION = 1
const PRE_GYM_DEFAULT_EQUIPMENT = ['bodyweight', 'pullup_bar', 'dip_bars']

interface GymDB extends DBSchema {
  settings: { key: 'app'; value: AppSettings }
  capabilities: { key: string; value: Capability }
  weights: { key: string; value: WeightEntry; indexes: { 'by-date': string } }
  sessions: { key: string; value: WorkoutSession; indexes: { 'by-created': string; 'by-status': string } }
  meta: { key: 'app'; value: AppMeta }
}

let dbPromise: Promise<IDBPDatabase<GymDB>> | undefined

function open(): Promise<IDBPDatabase<GymDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GymDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('settings')
          db.createObjectStore('capabilities', { keyPath: 'exerciseId' })
          const weights = db.createObjectStore('weights', { keyPath: 'id' })
          weights.createIndex('by-date', 'date')
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
          sessions.createIndex('by-created', 'createdAt')
          sessions.createIndex('by-status', 'status')
          db.createObjectStore('meta')
        }
        // Future schema changes belong in the next version branch, with a
        // migration from every older version kept here.
      },
      blocked() { console.warn('AI Gym Coach database upgrade is blocked by another open tab.') },
      blocking() { dbPromise = undefined },
    })
    dbPromise.catch(() => { dbPromise = undefined })
  }
  return dbPromise
}

async function run<T>(label: string, action: (db: IDBPDatabase<GymDB>) => Promise<T>): Promise<T> {
  try { return await action(await open()) }
  catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error(`${label}: device storage is full. Export your data, then remove older sessions or free device space.`)
    }
    const detail = error instanceof Error ? error.message : 'Unknown storage error'
    throw new Error(`${label}: browser storage could not be accessed (${detail}). If your data is still available, export it from Settings.`)
  }
}

const defaultMeta: AppMeta = { lastBackupAt: null, schemaVersion: DB_VERSION, program: null }

export class LocalAdapter implements Storage {
  getSettings() {
    return run('Load settings', async db => {
      const settings = await db.get('settings', 'app')
      if (settings) {
        // Move installations that still have the original untouched default
        // to the new gym default, while preserving custom equipment choices.
        if (settings.equipmentPreset === 'park' && JSON.stringify(settings.equipment) === JSON.stringify(PRE_GYM_DEFAULT_EQUIPMENT)) {
          const migrated = { ...settings, equipment: DEFAULT_SETTINGS.equipment, equipmentPreset: DEFAULT_SETTINGS.equipmentPreset }
          await db.put('settings', migrated, 'app')
          return migrated
        }
        return settings
      }
      await db.put('settings', DEFAULT_SETTINGS, 'app')
      return DEFAULT_SETTINGS
    })
  }
  saveSettings(value: AppSettings) { return run('Save settings', db => db.put('settings', value, 'app')).then(() => undefined) }
  listCapabilities() { return run('Load capabilities', db => db.getAll('capabilities')) }
  saveCapability(value: Capability) { return run('Save capability', db => db.put('capabilities', value)).then(() => undefined) }
  deleteCapability(exerciseId: string) { return run('Delete capability', db => db.delete('capabilities', exerciseId)).then(() => undefined) }
  listWeights() { return run('Load weight entries', db => db.getAllFromIndex('weights', 'by-date')) }
  saveWeight(value: WeightEntry) { return run('Save weight entry', db => db.put('weights', value)).then(() => undefined) }
  listSessions() { return run('Load sessions', db => db.getAllFromIndex('sessions', 'by-created')) }
  getSession(id: string) { return run('Load session', db => db.get('sessions', id)) }
  saveSession(value: WorkoutSession) { return run('Save workout', db => db.put('sessions', value)).then(() => undefined) }
  getMeta() {
    return run('Load app data', async db => {
      const meta = await db.get('meta', 'app')
      return { ...defaultMeta, ...(meta ?? {}) }
    })
  }
  saveMeta(value: AppMeta) { return run('Save app data', db => db.put('meta', value, 'app')).then(() => undefined) }
  exportSnapshot(includeApiKey = false) {
    return run('Prepare backup', async db => {
      const tx = db.transaction(['settings', 'capabilities', 'weights', 'sessions', 'meta'], 'readonly')
      const [settings, capabilities, weights, sessions, meta] = await Promise.all([
        tx.objectStore('settings').get('app'), tx.objectStore('capabilities').getAll(),
        tx.objectStore('weights').getAll(), tx.objectStore('sessions').getAll(), tx.objectStore('meta').get('app'),
      ])
      await tx.done
      const safeSettings = { ...(settings ?? DEFAULT_SETTINGS), apiKey: includeApiKey ? (settings?.apiKey ?? '') : '' }
      return { format: 'ai-gym-coach-backup' as const, version: 1 as const, exportedAt: new Date().toISOString(), settings: safeSettings,
        capabilities, weights, sessions, meta: meta ?? defaultMeta }
    })
  }
  replaceSnapshot(snapshot: AppSnapshot) {
    return run('Restore backup', async db => {
      const tx = db.transaction(['settings', 'capabilities', 'weights', 'sessions', 'meta'], 'readwrite')
      const existingKey = (await tx.objectStore('settings').get('app'))?.apiKey ?? ''
      await Promise.all([
        tx.objectStore('settings').clear(), tx.objectStore('capabilities').clear(), tx.objectStore('weights').clear(),
        tx.objectStore('sessions').clear(), tx.objectStore('meta').clear(),
      ])
      const restoredSettings = { ...DEFAULT_SETTINGS, ...snapshot.settings, apiKey: snapshot.settings.apiKey || existingKey }
      await Promise.all([
        tx.objectStore('settings').put(restoredSettings, 'app'),
        ...snapshot.capabilities.map(value => tx.objectStore('capabilities').put(value)),
        ...snapshot.weights.map(value => tx.objectStore('weights').put(value)),
        ...snapshot.sessions.map(value => tx.objectStore('sessions').put(value)),
        tx.objectStore('meta').put({ ...defaultMeta, ...snapshot.meta, lastBackupAt: new Date().toISOString(), schemaVersion: DB_VERSION }, 'app'),
      ])
      await tx.done
    })
  }
}

export const storage: Storage = new LocalAdapter()
