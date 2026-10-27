import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { DEFAULT_SETTINGS, type AppMeta, type AppSettings, type Capability, type Equipment, type TrainingProgram, type WeightEntry, type WorkoutItem, type WorkoutSession } from './storage/types'
import { storage } from './storage/local'
import { cueFor, exerciseById, nameFor, starterLoadKg } from './lib/catalog'
import exerciseImages from './data/exercise-images.json'
import { exerciseGuideFor } from './data/exercise-guides.en'
import { advanceProgram, buildLocalProgram, makeProgramSession, normalizeProgramWeek, refineProgramSlot, slotLabel, weekKey, type LocalProgramInput } from './lib/program'
import { completionRate, doneSetCount, plannedSetCount, summarizeHistory } from './lib/history'
import { generateWorkout, CoachError } from './lib/openai'
import { estimateTokens, makePromptPayload, type GenerateInput } from './lib/prompt'
import { adjustEndTime, formatTimer, secondsRemaining } from './lib/timer'
import { restoreBackup, saveBackupFile } from './lib/backup'
import { currentLanguage, exerciseText, setLanguage, t, type TranslationKey } from './i18n'

type Screen = 'home' | 'generate' | 'runner' | 'history' | 'settings'
type PersistState = 'yes' | 'no' | 'unsupported'
const equipmentKeys: Equipment[] = ['bodyweight', 'pullup_bar', 'dip_bars', 'rings', 'parallettes', 'dumbbells', 'barbell', 'kettlebell', 'bands', 'cable', 'machine', 'bench', 'cardio_machine']
const presets: Record<string, Equipment[]> = {
  park: ['bodyweight', 'pullup_bar', 'dip_bars', 'rings', 'parallettes'],
  gym: equipmentKeys,
  home: ['bodyweight', 'dumbbells', 'bands', 'bench'],
}
const commonCapabilityIds = ['push_up', 'pull_up', 'bodyweight_squat', 'plank', 'barbell_bench_press', 'deadlift']

function newId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` }
function formatNumber(value: number, maximumFractionDigits = 0) { return new Intl.NumberFormat(currentLanguage(), { maximumFractionDigits }).format(value) }
function formatDate(date: string | null, lang = currentLanguage()) {
  if (!date) return t('settings.never')
  return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}
function formatLoad(kg: number | null, units: 'kg' | 'lb') {
  if (kg === null) return '0'
  const value = units === 'lb' ? kg * 2.20462 : kg
  return new Intl.NumberFormat(currentLanguage(), { maximumFractionDigits: 1 }).format(value)
}
function toKg(value: number, units: 'kg' | 'lb') { return units === 'lb' ? value / 2.20462 : value }
function fillStarterLoads(session: WorkoutSession, bodyWeightKg: number | null, capabilities: Capability[]): WorkoutSession {
  if (session.status === 'completed') return session
  let changed = false
  const blocks = session.workout.blocks.map(block => ({
    ...block,
    items: block.items.map(item => {
      if ((item.load !== null && item.load > 0) || !exerciseById.get(item.ex)?.loadable) return item
      const capabilityLoad = capabilities.find(capability => capability.exerciseId === item.ex)?.loadKg
      const load = capabilityLoad && capabilityLoad > 0 ? capabilityLoad : starterLoadKg(item.ex, bodyWeightKg)
      changed = true
      return { ...item, load, log: item.log.map(set => ({ ...set, loadKg: set.loadKg === null || (!set.done && set.loadKg === 0) ? load : set.loadKg })) }
    }),
  }))
  return changed ? { ...session, workout: { ...session.workout, blocks } } : session
}
function minutesBetween(start: string | null, end: string | null) {
  if (!start) return 0
  return Math.max(0, Math.round(((end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime()) / 60000))
}

function Icon({ name }: { name: 'home' | 'generate' | 'history' | 'settings' | 'check' | 'plus' | 'minus' | 'arrow' | 'close' | 'clock' | 'spark' | 'trash' }) {
  const paths: Record<string, string> = {
    home: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
    generate: 'M12 3v5m0 8v5M3 12h5m8 0h5M5.6 5.6l3.5 3.5m5.8 5.8 3.5 3.5m0-12.8-3.5 3.5m-5.8 5.8-3.5 3.5',
    history: 'M3 12a9 9 0 1 0 2.64-6.36L3 8m0-5v5h5m4-1v5l3 2',
    settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-6v2m0 15v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64',
    check: 'm5 12 4 4L19 6', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    arrow: 'M5 12h14m-6-6 6 6-6 6', close: 'm6 6 12 12M18 6 6 18',
    clock: 'M12 8v4l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    spark: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z',
    trash: 'M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3',
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d={paths[name]} /></svg>
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [runnerId, setRunnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [meta, setMeta] = useState<AppMeta>({ lastBackupAt: null, schemaVersion: 1, program: null })
  const [persistState, setPersistState] = useState<PersistState>('unsupported')
  const [storageEstimate, setStorageEstimate] = useState<{ usage?: number; quota?: number }>({})
  const [iosGuide, setIosGuide] = useState(false)
  const [notice, setNotice] = useState('')
  const [sessionDetailId, setSessionDetailId] = useState<string | null>(null)
  const sessionsRef = useRef<WorkoutSession[]>([])
  const writeQueue = useRef<Promise<void>>(Promise.resolve())
  const settingsWriteQueue = useRef<Promise<void>>(Promise.resolve())
  const fileInput = useRef<HTMLInputElement>(null)

  const loadAll = async () => {
    setLoading(true)
    setStorageError('')
    try {
      const [storedSettings, storedCaps, storedWeights, storedSessions, storedMeta] = await Promise.all([
        storage.getSettings(), storage.listCapabilities(), storage.listWeights(), storage.listSessions(), storage.getMeta(),
      ])
      const loadedSessions = storedSessions.map(session => fillStarterLoads(session, storedSettings.profile.weightKg, storedCaps))
      try { await Promise.all(loadedSessions.filter((session, index) => session !== storedSessions[index]).map(session => storage.saveSession(session))) }
      catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
      setSettings(storedSettings); setSettingsDraft(storedSettings); setCapabilities(storedCaps); setWeights(storedWeights)
      sessionsRef.current = loadedSessions
      setSessions(loadedSessions); setMeta(storedMeta)
      await setLanguage(storedSettings.language)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
      setIosGuide(isIOS && !standalone && !storedSettings.iosInstallDismissed)
      if (navigator.storage?.persist) setPersistState(await navigator.storage.persist() ? 'yes' : 'no')
      else setPersistState('unsupported')
      if (navigator.storage?.estimate) setStorageEstimate(await navigator.storage.estimate())
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : t('app.errorBody'))
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadAll() }, [])
  useEffect(() => {
    const refreshSettings = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        await settingsWriteQueue.current
        const latest = await storage.getSettings()
        setSettings(latest); setSettingsDraft(latest)
        await setLanguage(latest.language)
      } catch { /* A focus refresh should not replace the app's normal storage error handling. */ }
    }
    document.addEventListener('visibilitychange', refreshSettings)
    window.addEventListener('focus', refreshSettings)
    return () => {
      document.removeEventListener('visibilitychange', refreshSettings)
      window.removeEventListener('focus', refreshSettings)
    }
  }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [screen])
  useEffect(() => {
    if (screen !== 'settings' || !navigator.storage?.estimate) return
    void navigator.storage.estimate().then(setStorageEstimate).catch(() => undefined)
  }, [screen, sessions.length, capabilities.length, weights.length])
  useEffect(() => {
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => (b.createdAt).localeCompare(a.createdAt)), [sessions])
  const currentSession = useMemo(() => sessions.find(session => session.status === 'active') ?? sortedSessions.find(session => session.status === 'planned') ?? null, [sessions, sortedSessions])
  const detailSession = sessionDetailId ? sessions.find(session => session.id === sessionDetailId) ?? null : null
  const hasTrainingData = sessions.length > 0 || capabilities.length > 0 || weights.length > 0
  const firstTrainingDataAt = [...sessions.map(session => session.createdAt), ...capabilities.map(capability => capability.updatedAt), ...weights.map(weight => weight.date)]
    .map(value => new Date(value).getTime()).filter(Number.isFinite).reduce((earliest, value) => Math.min(earliest, value), Number.POSITIVE_INFINITY)
  const backupReferenceAt = meta.lastBackupAt ? new Date(meta.lastBackupAt).getTime() : firstTrainingDataAt
  const backupDue = hasTrainingData && Number.isFinite(backupReferenceAt) && Date.now() - backupReferenceAt >= 14 * 86400000

  const updateSettings = async (next: AppSettings) => {
    setSettingsDraft(next)
    const operation = settingsWriteQueue.current.catch(() => undefined).then(() => storage.saveSettings(next))
    settingsWriteQueue.current = operation.catch(() => undefined)
    try {
      await operation
      setSettings(next)
      if (next.language !== settings.language) await setLanguage(next.language)
      setStorageError('')
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : t('settings.dataError'))
    }
  }
  const logCurrentWeight = async (next: AppSettings) => {
    if (next.profile.weightKg === null) return
    const saveSettings = settingsWriteQueue.current.catch(() => undefined).then(() => storage.saveSettings(next))
    settingsWriteQueue.current = saveSettings.catch(() => undefined)
    try {
      await saveSettings
      const entry = { id: newId(), date: new Date().toISOString(), weightKg: next.profile.weightKg }
      await storage.saveWeight(entry)
      setSettings(next); setSettingsDraft(next); setWeights(items => [...items, entry]); setNotice(t('settings.weightLogged'))
      setStorageError('')
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }

  const saveCapability = async (value: Capability) => {
    try {
      await storage.saveCapability(value)
      setCapabilities(items => [...items.filter(item => item.exerciseId !== value.exerciseId), value])
      setNotice(t('settings.capSaved'))
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }
  const removeCapability = async (id: string) => {
    try { await storage.deleteCapability(id); setCapabilities(items => items.filter(item => item.exerciseId !== id)) }
    catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }
  const removeSession = async (id: string) => {
    const session = sessionsRef.current.find(item => item.id === id)
    if (!session || !window.confirm(t('history.removeConfirm'))) return
    try {
      await storage.deleteSession(id)
      const remaining = sessionsRef.current.filter(item => item.id !== id)
      sessionsRef.current = remaining; setSessions(remaining)
      if (runnerId === id) setRunnerId(null)
      if (sessionDetailId === id) setSessionDetailId(null)
      setStorageError(''); setNotice(t('history.removed'))
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }

  const commitSession = (transform: (current: WorkoutSession) => WorkoutSession, id?: string) => {
    const current = (id ? sessionsRef.current.find(session => session.id === id) : undefined) ?? sessionsRef.current.find(session => session.status === 'active') ?? [...sessionsRef.current].filter(session => session.status === 'planned').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (!current) return
    const next = transform(current)
    const nextList = sessionsRef.current.map(session => session.id === current.id ? next : session)
    sessionsRef.current = nextList
    setSessions(nextList)
    const operation = writeQueue.current.catch(() => undefined).then(() => storage.saveSession(next))
    writeQueue.current = operation.catch(error => {
      setStorageError(error instanceof Error ? error.message : t('settings.dataError'))
    })
    return operation
  }

  const startSession = (id?: string) => commitSession(session => ({ ...session, status: 'active', startedAt: session.startedAt ?? new Date().toISOString() }), id)
  const finishSession = async (id?: string) => {
    const source = (id ? sessionsRef.current.find(session => session.id === id) : undefined) ?? sessionsRef.current.find(session => session.status === 'active')
    if (!source || source.status === 'completed') return
    try {
      await commitSession(session => ({ ...session, status: 'completed', finishedAt: new Date().toISOString(), timerEndsAt: null }), source.id)
      const program = meta.program
      if (source.programRef && program?.id === source.programRef.programId) {
        const nextMeta = { ...meta, program: advanceProgram(program, source) }
        await storage.saveMeta(nextMeta)
        setMeta(nextMeta)
      }
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }
  const createProgram = async (input: LocalProgramInput) => {
    try {
      const program = buildLocalProgram(input, capabilities, settings.profile.weightKg)
      const session = makeProgramSession(program, newId())
      const nextMeta = { ...meta, program }
      await storage.saveMeta(nextMeta)
      await storage.saveSession(session)
      const next = [session, ...sessionsRef.current]
      sessionsRef.current = next; setSessions(next); setMeta(nextMeta); setRunnerId(session.id); setScreen('runner')
      return true
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : t('settings.dataError'))
      return false
    }
  }
  const startNextProgramWorkout = async () => {
    if (!meta.program) return
    try {
      const program = normalizeProgramWeek(meta.program)
      if (program !== meta.program) {
        await storage.saveMeta({ ...meta, program })
        setMeta({ ...meta, program })
      }
      const session = makeProgramSession(program, newId())
      await storage.saveSession(session)
      const next = [session, ...sessionsRef.current]
      sessionsRef.current = next; setSessions(next); setRunnerId(session.id); setScreen('runner')
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.dataError')) }
  }
  const applyCapabilityUpdates = async (id?: string) => {
    const source = sessionsRef.current.find(session => session.id === id) ?? currentSession
    if (!source) return
    const suggested = source.workout.cap_updates
    for (const update of suggested) {
      await saveCapability({ exerciseId: update.ex, max: update.max, loadKg: update.load, reps: update.reps, updatedAt: new Date().toISOString() })
    }
    await commitSession(session => ({ ...session, workout: { ...session.workout, cap_updates: [] } }), source.id)
    setNotice(t('runner.suggestionsApplied'))
  }

  const exportData = async (includeKey: boolean) => {
    try {
      await saveBackupFile(storage, includeKey)
      const nextMeta = await storage.getMeta(); setMeta(nextMeta)
      setNotice(t('settings.backupReady'))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStorageError(error instanceof Error ? error.message : t('settings.dataError'))
    }
  }
  const importData = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      await restoreBackup(storage, await file.text())
      await loadAll()
      setNotice(t('settings.importSuccess'))
    } catch (error) { setStorageError(error instanceof Error ? error.message : t('settings.invalidBackup')) }
    finally { input.value = '' }
  }

  const navigate = (next: Screen) => { setScreen(next); if (next !== 'history') setSessionDetailId(null) }

  if (loading) return <main class="loading-screen"><span class="brand-mark">F</span><p>{t('app.loading')}</p></main>
  if (storageError && !settings) return <main class="storage-fatal"><h1>{t('app.errorTitle')}</h1><p>{storageError || t('app.errorBody')}</p><button class="button button-primary" onClick={() => void loadAll()}>{t('app.retry')}</button></main>

  const navItems: Array<{ id: Screen; key: 'today' | 'generate' | 'history' | 'settings'; icon: 'home' | 'generate' | 'history' | 'settings' }> = [
    { id: 'home', key: 'today', icon: 'home' }, { id: 'generate', key: 'generate', icon: 'generate' },
    { id: 'history', key: 'history', icon: 'history' }, { id: 'settings', key: 'settings', icon: 'settings' },
  ]

  return <div class="app-shell">
    <header class="topbar">
      <button class="brand" aria-label={t('app.name')} onClick={() => navigate('home')}><span class="brand-mark">F</span><span>FORM</span></button>
      <div class="offline-pill"><span class="status-dot" />{t('app.offline')}</div>
    </header>

    {storageError && <div class="global-alert" role="alert"><span>{storageError}</span><button aria-label={t('app.close')} onClick={() => setStorageError('')}><Icon name="close" /></button></div>}
    {notice && <div class="toast" role="status">{notice}</div>}

    <main class="main-content">
      {iosGuide && <aside class="install-banner"><div><p class="eyebrow">{t('install.title')}</p><p>{t('install.body')}</p><ol><li>{t('install.step1')}</li><li>{t('install.step2')}</li><li>{t('install.step3')}</li></ol></div><button class="icon-button" aria-label={t('install.dismiss')} onClick={() => { setIosGuide(false); void updateSettings({ ...settings, iosInstallDismissed: true }) }}><Icon name="close" /></button></aside>}
      {backupDue && <aside class="backup-banner"><span>{t('install.reminder')}</span><button class="text-button" onClick={() => { navigate('settings'); void exportData(false) }}>{t('install.backupNow')} <Icon name="arrow" /></button></aside>}

      {screen === 'home' && <HomeScreen sessions={sessions} currentSession={currentSession} program={meta.program ?? null} onGenerate={() => navigate('generate')} onStartProgram={() => void startNextProgramWorkout()} onContinue={() => { setRunnerId(currentSession?.id ?? null); navigate('runner') }} />}
      {screen === 'generate' && <GenerateScreen settings={settings} capabilities={capabilities} sessions={sessions} program={meta.program ?? null} onCreateProgram={createProgram} onPlan={async (input, apiKey, refineNext) => {
        try {
          const nextSettings = apiKey === settings.apiKey ? settings : { ...settings, apiKey }
          if (nextSettings !== settings) {
            await storage.saveSettings(nextSettings)
            setSettings(nextSettings); setSettingsDraft(nextSettings)
          }
          const result = await generateWorkout(input, { ...nextSettings, model: 'gpt-5.4-mini', language: 'en' }, capabilities, sessions)
          const sourceProgram = refineNext ? meta.program ?? null : null
          const slotIndex = sourceProgram ? sourceProgram.nextSlotIndex : -1
          const program = sourceProgram ? refineProgramSlot(sourceProgram, slotIndex, result.workout) : null
          const programRef = program ? { programId: program.id, slotIndex } : undefined
          const existingSlotSession = programRef ? sessionsRef.current.find(session => session.status === 'planned' && session.programRef?.programId === programRef.programId && session.programRef.slotIndex === programRef.slotIndex) : undefined
          const session: WorkoutSession = existingSlotSession
            ? { ...existingSlotSession, workout: result.workout, usage: result.usage, generationRequest: { duration: input.duration, focus: input.focus, feel: input.feel } }
            : { id: newId(), status: 'planned', createdAt: new Date().toISOString(), startedAt: null, finishedAt: null, timerEndsAt: null,
              workout: result.workout, rpe: null, note: '', usage: result.usage, generationRequest: { duration: input.duration, focus: input.focus, feel: input.feel }, ...(programRef ? { programRef } : {}) }
          if (program) {
            const nextMeta = { ...meta, program }
            await storage.saveMeta(nextMeta)
            setMeta(nextMeta)
          }
          await storage.saveSession(session)
          const next = existingSlotSession ? sessionsRef.current.map(item => item.id === session.id ? session : item) : [session, ...sessionsRef.current]
          sessionsRef.current = next; setSessions(next); setRunnerId(session.id); setScreen('runner')
          return { ok: true as const, usage: result.usage }
        } catch (error) {
          if (error instanceof CoachError) return { ok: false as const, kind: error.kind, message: error.message }
          return { ok: false as const, kind: 'generic' as const, message: error instanceof Error ? error.message : t('generator.errorGeneric') }
        }
      }} />}
      {screen === 'runner' && <RunnerScreen session={sessions.find(item => item.id === runnerId) ?? currentSession} settings={settings} onStart={startSession} onFinish={finishSession} mutate={commitSession} onApplyUpdates={applyCapabilityUpdates} onHome={() => navigate('home')} />}
      {screen === 'history' && <HistoryScreen sessions={sortedSessions} weights={weights} units={settings.units} detail={detailSession} onOpen={id => setSessionDetailId(id)} onClose={() => setSessionDetailId(null)} onRemove={removeSession} />}
      {screen === 'settings' && <SettingsScreen settings={settingsDraft} setDraft={setSettingsDraft} capabilities={capabilities} meta={meta} persistState={persistState} storageEstimate={storageEstimate} onSave={updateSettings} onRecordWeight={logCurrentWeight} onSaveCapability={saveCapability} onRemoveCapability={removeCapability} onExport={exportData} onImportClick={() => fileInput.current?.click()} />}
    </main>

    <input ref={fileInput} type="file" accept="application/json,.json" class="visually-hidden" onChange={importData} aria-label={t('settings.import')} />
    <nav class="bottom-nav" aria-label={t('app.navigation')}>
      {navItems.map(item => <button key={item.id} class={`nav-item ${screen === item.id ? 'active' : ''}`} aria-label={t(`app.${item.key}` as TranslationKey)} aria-current={screen === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
        <Icon name={item.icon} /><span>{t(`app.${item.key}` as TranslationKey)}</span>
      </button>)}
    </nav>
  </div>
}

function HomeScreen({ sessions, currentSession, program, onGenerate, onStartProgram, onContinue }: { sessions: WorkoutSession[]; currentSession: WorkoutSession | null; program: TrainingProgram | null; onGenerate: () => void; onStartProgram: () => void; onContinue: () => void }) {
  const completed = sessions.filter(session => session.status === 'completed').sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt))
  const last = completed[0]
  const weekStart = Date.now() - 7 * 86400000
  const thisWeek = completed.filter(session => new Date(session.finishedAt ?? '').getTime() >= weekStart).length
  const trained = completed.reduce((sum, session) => sum + minutesBetween(session.startedAt, session.finishedAt), 0)
  return <section class="home-screen">
    <div class="hero-grid"><div class="hero-copy"><p class="eyebrow">{t('home.eyebrow')}</p><h1>{t('home.title')}</h1><p class="hero-description">{t('home.description')}</p>
      {currentSession ? <div class="session-callout"><div class="callout-icon"><Icon name={currentSession.status === 'active' ? 'clock' : 'check'} /></div><div><strong>{currentSession.status === 'active' ? t('home.activeSession') : t('home.planned')}</strong><span>{currentSession.workout.title}</span></div><button class="round-arrow" aria-label={currentSession.status === 'active' ? t('home.continue') : t('home.openPlan')} onClick={onContinue}><Icon name="arrow" /></button></div> : program ? <div class="program-home-card"><p class="eyebrow">{t('program.weeklyPlan')}</p><h2>{program.title}</h2><p>{t('program.sessionsPerWeek', { count: program.sessionsPerWeek })}</p><div class="program-home-progress"><div><span>{t('program.thisWeek')}</span><strong>{formatNumber(program.weekOf === weekKey() ? program.sessionsCompletedThisWeek : 0)}/{formatNumber(program.sessionsPerWeek)}</strong></div><span>{t('program.nextWorkout')} · {slotLabel(program)}</span></div><button class="button button-primary full-width" onClick={onStartProgram}>{t('program.startNext')}<Icon name="arrow" /></button><button class="text-button program-rebuild" onClick={onGenerate}>{t('program.changePlan')}</button></div> : <button class="button button-primary hero-cta" onClick={onGenerate}>{t('home.newWorkout')}<Icon name="arrow" /></button>}
    </div><div class="hero-art" aria-hidden="true"><div class="art-orbit orbit-one" /><div class="art-orbit orbit-two" /><div class="art-disc"><span class="art-line line-one" /><span class="art-line line-two" /><span class="art-center">F</span></div><div class="art-label"><Icon name="spark" /><span>{t('home.ready')}</span></div></div></div>
    <div class="stats-grid"><div class="stat-card stat-feature"><span class="stat-kicker">{t('home.week')}</span><strong>{formatNumber(thisWeek)}<small>{t('home.weekSessions')}</small></strong><div class="stat-bars" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ height: `${18 + ((thisWeek + i * 7) % 5) * 9}px`, opacity: i < thisWeek ? 1 : .28 }} />)}</div></div><div class="stat-card"><span class="stat-kicker">{t('home.sessions')}</span><strong>{formatNumber(completed.length)}</strong><span class="stat-foot">{t('home.consistency')}</span></div><div class="stat-card"><span class="stat-kicker">{t('home.minutesTrained')}</span><strong>{formatNumber(trained)}<small>{t('app.minutes')}</small></strong><span class="stat-foot">{last ? `${t('home.lastSession')} · ${formatDate(last.finishedAt)}` : t('home.noSessions')}</span></div></div>
    {!currentSession && <section class="quote-card"><span class="quote-orb" aria-hidden="true">✳</span><p>{t('home.trainingNote')}</p><span class="quote-mark">{t('home.quoteMark')}</span></section>}
    {currentSession && <button class="button button-secondary full-width mobile-cta" onClick={onGenerate}>{t('home.newWorkout')}<Icon name="arrow" /></button>}
  </section>
}

function GenerateScreen({ settings, capabilities, sessions, program, onPlan, onCreateProgram }: { settings: AppSettings; capabilities: Capability[]; sessions: WorkoutSession[]; program: TrainingProgram | null; onPlan: (input: GenerateInput, apiKey: string, refineNext: boolean) => Promise<{ ok: true; usage: { estimatedTokens: number; promptTokens: number; completionTokens: number } } | { ok: false; kind: string; message: string }>; onCreateProgram: (input: LocalProgramInput) => Promise<boolean> }) {
  const [duration, setDuration] = useState(60)
  const [sessionsPerWeekInput, setSessionsPerWeekInput] = useState('3')
  const [focus, setFocus] = useState('')
  const [feel, setFeel] = useState('')
  const [equipment, setEquipment] = useState(settings.equipment)
  const [preset, setPreset] = useState(settings.equipmentPreset)
  const [pending, setPending] = useState(false)
  const [programPending, setProgramPending] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [refineNext, setRefineNext] = useState(false)
  const [usage, setUsage] = useState<{ promptTokens: number; completionTokens: number } | null>(null)
  const sessionsPerWeek = Number(sessionsPerWeekInput)
  const validSessionsPerWeek = /^\d+$/.test(sessionsPerWeekInput) && sessionsPerWeek >= 1 && sessionsPerWeek <= 7
  const estimatedTokens = useMemo(() => estimateTokens(makePromptPayload({ duration, focus, feel, equipment }, settings, capabilities, sessions).payload), [duration, focus, feel, equipment, settings, capabilities, sessions])

  const changePreset = (value: string) => { setPreset(value); if (presets[value]) setEquipment(presets[value]) }
  const submit = async (event: Event) => {
    event.preventDefault(); setError(''); setUsage(null)
    if (!apiKey.trim()) { setError('key'); return }
    setPending(true)
    const result = await onPlan({ duration, focus, feel, equipment }, apiKey.trim(), refineNext && Boolean(program))
    setPending(false)
    if (result.ok) setUsage(result.usage)
    else setError(result.kind === 'invalid' || result.kind === 'generic' ? result.message : result.kind)
  }
  const createOfflineProgram = async () => {
    setError('')
    setProgramPending(true)
    await onCreateProgram({ duration, focus, feel, equipment, sessionsPerWeek })
    setProgramPending(false)
  }
  return <section class="builder-screen"><header class="section-intro"><p class="eyebrow">{t('generator.eyebrow')}</p><h1>{t('generator.title')}</h1><p>{t('generator.description')}</p></header>
    <form class="builder-card" onSubmit={submit}>
      <div class="form-group"><div class="label-row"><label for="duration">{t('generator.duration')}</label><output class="duration-value">{formatNumber(duration)} <small>{t('app.minutes')}</small></output></div><input id="duration" type="range" min="20" max="180" step="5" value={duration} onInput={event => setDuration(Number((event.currentTarget as HTMLInputElement).value))} /><div class="range-labels"><span>{formatNumber(20)} {t('app.minutes')}</span><span>{formatNumber(180)} {t('app.minutes')}</span></div><p class="field-hint">{t('generator.durationHelp')}</p></div>
      <div class="form-row"><label class="form-group"><span>{t('generator.focus')}</span><input class="text-input" value={focus} maxlength={120} placeholder={t('generator.focusPlaceholder')} onInput={event => setFocus((event.currentTarget as HTMLInputElement).value)} /></label><label class="form-group"><span>{t('generator.feel')}</span><input class="text-input" value={feel} maxlength={160} placeholder={t('generator.feelPlaceholder')} onInput={event => setFeel((event.currentTarget as HTMLInputElement).value)} /></label></div>
      <div class="form-group"><label for="gen-preset">{t('settings.preset')}</label><select class="text-input" id="gen-preset" value={preset} onChange={event => changePreset((event.currentTarget as HTMLSelectElement).value)}><option value="park">{t('generator.presetPark')}</option><option value="gym">{t('generator.presetGym')}</option><option value="home">{t('generator.presetHome')}</option><option value="custom">{t('generator.presetCustom')}</option></select></div>
      <fieldset class="equipment-grid"><legend>{t('generator.equipment')}</legend>{equipmentKeys.map(key => <label class="check-chip" key={key}><input type="checkbox" checked={equipment.includes(key)} onChange={event => { setPreset('custom'); setEquipment(value => event.currentTarget.checked ? [...new Set([...value, key])] : value.filter(x => x !== key)) }} /><span class="check-mark"><Icon name="check" /></span>{t(`equipment.${key}` as TranslationKey)}</label>)}</fieldset>
      <div class="offline-program-builder"><div><p class="eyebrow">{t('program.offlineEyebrow')}</p><h2>{t('program.offlineTitle')}</h2><p>{t('program.offlineBody')}</p></div><label class="form-group"><span>{t('program.sessionsPerWeekLabel')}</span><input class="text-input" type="number" min="1" max="7" step="1" inputMode="numeric" value={sessionsPerWeekInput} onInput={event => setSessionsPerWeekInput((event.currentTarget as HTMLInputElement).value)} /><small class="field-hint">{t('program.sessionsPerWeekHelp')}</small></label><button class="button button-primary full-width" type="button" disabled={programPending || pending || !equipment.length || !validSessionsPerWeek} onClick={() => void createOfflineProgram()}>{programPending ? <><span class="spinner" />{t('program.building')}</> : <>{t('program.createOffline')}<Icon name="arrow" /></>}</button><p class="privacy-line">{t('program.offlineNote')}</p></div>
      <details class="ai-option"><summary>{t('program.aiOptional')}</summary><p class="card-description">{t('program.aiOptionalBody')}</p>
        {program && <label class="check-chip ai-refine-choice"><input type="checkbox" checked={refineNext} onChange={event => setRefineNext(event.currentTarget.checked)} /><span class="check-mark"><Icon name="check" /></span>{t('program.refineNext')}</label>}
        <div class="token-estimate"><span><Icon name="spark" />{t('generator.tokenEstimate')}</span><strong>{t('generator.estimatedTokens', { count: estimatedTokens })}</strong></div>
        {(!settings.apiKey || error === 'key') && <div class="settings-card generator-key-card"><p class="eyebrow">{t('generator.keyTitle')}</p><p class="card-description">{error === 'key' ? t('generator.errorKey') : t('generator.apiKeyMissing')}</p><label class="form-group"><span>{t('settings.apiKey')}</span><div class="input-with-action"><input class="text-input" type={showKey ? 'text' : 'password'} autocomplete="off" spellcheck={false} value={apiKey} placeholder={t('settings.apiKeyPlaceholder')} onInput={event => setApiKey((event.currentTarget as HTMLInputElement).value)} /><button class="show-key" type="button" onClick={() => setShowKey(!showKey)}>{showKey ? t('settings.hideKey') : t('settings.showKey')}</button></div><small class="field-hint">{t('settings.apiKeyHelp')}</small></label></div>}
        {error && error !== 'key' && <p class="form-error" role="alert">{error === 'rate' ? t('generator.errorRate') : error === 'network' ? t('generator.errorNetwork') : error}</p>}
        <button class="button button-secondary full-width builder-submit" type="submit" disabled={pending || programPending || !equipment.length || !apiKey.trim()}>{pending ? <><span class="spinner" />{t('generator.building')}</> : <>{refineNext && program ? t('program.refineNextButton') : t('program.aiOneOff')}<Icon name="arrow" /></>}</button>
        {usage && <p class="usage-note">{t('generator.usage', { prompt: usage.promptTokens, completion: usage.completionTokens })}</p>}
        <p class="privacy-line">{t('app.notice')}</p>
      </details>
    </form>
  </section>
}

function RunnerScreen({ session, settings, onStart, onFinish, mutate, onApplyUpdates, onHome }: {
  session: WorkoutSession | null; settings: AppSettings; onStart: (id: string) => unknown; onFinish: (id: string) => unknown
  mutate: (transform: (current: WorkoutSession) => WorkoutSession, id?: string) => unknown; onApplyUpdates: (id: string) => Promise<void>; onHome: () => void
}) {
  const [now, setNow] = useState(Date.now())
  const [finishing, setFinishing] = useState(false)
  const [swapping, setSwapping] = useState<string | null>(null)
  const [exerciseDetail, setExerciseDetail] = useState<{ id: string; name: string; note: string | null } | null>(null)
  const planScrollY = useRef(0)
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const beepedRef = useRef<string | null>(null)
  useEffect(() => { const interval = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(interval) }, [])
  const timerLeft = secondsRemaining(session?.timerEndsAt ?? null, now)
  useEffect(() => {
    if (session?.status !== 'active') return
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }
    let disposed = false
    const acquire = async () => {
      if (!nav.wakeLock || document.visibilityState !== 'visible' || lockRef.current) return
      try { const lock = await nav.wakeLock.request('screen'); if (disposed || document.visibilityState !== 'visible') void lock.release(); else lockRef.current = lock } catch { /* device may not offer a wake lock */ }
    }
    const visibility = () => { if (document.visibilityState === 'visible') void acquire(); else { void lockRef.current?.release(); lockRef.current = null } }
    void acquire(); document.addEventListener('visibilitychange', visibility)
    return () => { disposed = true; document.removeEventListener('visibilitychange', visibility); void lockRef.current?.release(); lockRef.current = null }
  }, [session?.status, session?.id])
  useEffect(() => {
    if (session?.timerEndsAt === null || session?.timerEndsAt === undefined || timerLeft > 0) return
    const key = `${session.id}:${session.timerEndsAt}`
    if (beepedRef.current === key) return
    beepedRef.current = key
    navigator.vibrate?.([160, 80, 160])
    try {
      const Audio = window.AudioContext
      if (Audio) { const ctx = new Audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 740; gain.gain.value = .08; osc.start(); osc.stop(ctx.currentTime + .24); osc.onended = () => void ctx.close() }
    } catch { /* sound is optional */ }
  }, [session?.id, session?.timerEndsAt, timerLeft])

  if (!session) return <section class="empty-screen"><span class="empty-mark"><Icon name="spark" /></span><p class="eyebrow">{t('runner.eyebrow')}</p><h1>{t('home.noSessions')}</h1><button class="button button-primary" onClick={onHome}>{t('app.today')}<Icon name="arrow" /></button></section>

  const planned = plannedSetCount(session)
  const done = doneSetCount(session)
  const progressed = session.workout.blocks.reduce((sum, block) => sum + block.items.reduce((inner, item) => inner + (item.skipped ? item.sets : item.log.filter(set => set.done).length), 0), 0)
  const progress = planned ? Math.round(progressed / planned * 100) : 0
  const hasWeightedExercises = session.workout.blocks.some(block => block.items.some(item => exerciseById.get(item.ex)?.loadable))
  const elapsed = minutesBetween(session.startedAt, session.status === 'completed' ? session.finishedAt : new Date(now).toISOString())
  const byId = (blockIndex: number, itemIndex: number, transform: (item: WorkoutItem) => WorkoutItem, timer?: number | null) => {
    mutate(current => ({ ...current, workout: { ...current.workout, blocks: current.workout.blocks.map((block, bi) => bi !== blockIndex ? block : ({ ...block, items: block.items.map((item, ii) => ii === itemIndex ? transform(item) : item) })) }, ...(timer === undefined ? {} : { timerEndsAt: timer }) }), session.id)
  }
  const adjustSet = (blockIndex: number, itemIndex: number, setIndex: number, patch: { reps?: number; loadKg?: number | null }) => byId(blockIndex, itemIndex, item => ({ ...item, log: item.log.map((set, index) => index === setIndex ? { ...set, ...patch } : set) }))
  const toggleSet = (blockIndex: number, itemIndex: number, setIndex: number) => {
    const item = session.workout.blocks[blockIndex].items[itemIndex]
    const entry = item.log[setIndex]
    const nextDone = !entry.done
    const completedAt = new Date().toISOString()
    const timer = nextDone && item.rest > 0 ? Date.now() + item.rest * 1000 : null
    mutate(current => ({
      ...current,
      status: current.status === 'planned' ? 'active' : current.status,
      startedAt: current.status === 'planned' ? completedAt : current.startedAt,
      timerEndsAt: timer,
      workout: { ...current.workout, blocks: current.workout.blocks.map((block, bi) => bi !== blockIndex ? block : ({
        ...block, items: block.items.map((value, ii) => ii !== itemIndex ? value : ({
          ...value, log: value.log.map((set, index) => index === setIndex ? { ...set, done: nextDone, completedAt: nextDone ? completedAt : null } : set),
        })),
      })) },
    }), session.id)
  }
  const skipRest = () => mutate(current => ({ ...current, timerEndsAt: null }), session.id)
  const adjustTimer = (delta: number) => mutate(current => ({ ...current, timerEndsAt: adjustEndTime(current.timerEndsAt, delta) }), session.id)
  const openExerciseGuide = (id: string, name: string, note: string | null) => {
    planScrollY.current = window.scrollY
    setExerciseDetail({ id, name, note })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  const returnToPlan = () => {
    setExerciseDetail(null)
    requestAnimationFrame(() => window.scrollTo({ top: planScrollY.current, behavior: 'auto' }))
  }

  if (exerciseDetail) {
    const exercise = exerciseById.get(exerciseDetail.id)
    const guide = exerciseGuideFor(exerciseDetail.id)
    const frames = exerciseImages[exerciseDetail.id as keyof typeof exerciseImages]?.frames ?? []
    const fallbackSteps = [t('runner.customGuideSetup'), t('runner.customGuideControl'), t('runner.guideSafety')]
    return <section class="exercise-detail-screen">
      <button class="back-link" onClick={returnToPlan}><span>←</span>{t('runner.backToPlan')}</button>
      <p class="eyebrow">{t('runner.exerciseGuide')}</p>
      <h1>{exerciseDetail.name}</h1>
      <p class="exercise-guide-summary">{guide?.summary ?? (cueFor(exerciseDetail.id) || t('runner.customGuideSummary'))}</p>
      {frames.length > 0 && <div class="exercise-guide-demo">{frames.map((src, index) => <figure key={src}><img src={src} alt={`${exerciseDetail.name} — ${t(index === 0 ? 'runner.demoStart' : index === frames.length - 1 ? 'runner.demoFinish' : 'runner.demoStep')}`} /><figcaption>{t(index === 0 ? 'runner.demoStart' : index === frames.length - 1 ? 'runner.demoFinish' : 'runner.demoStep')}</figcaption></figure>)}</div>}
      {exercise && <div class="exercise-guide-facts"><div><span>{t('runner.guideMuscles')}</span><strong>{exercise.muscles.map(muscle => muscle.replaceAll('_', ' ')).join(', ')}</strong></div><div><span>{t('runner.guideEquipment')}</span><strong>{exercise.equipment.map(tag => tag.replaceAll('_', ' ')).join(', ')}</strong></div></div>}
      <section class="exercise-guide-steps"><h2>{t('runner.guideSteps')}</h2><ol>{(guide?.steps ?? fallbackSteps).map((step, index) => <li key={index}><span>{formatNumber(index + 1)}</span><p>{step}</p></li>)}</ol></section>
      {guide && <aside class="exercise-guide-focus"><span>{t('runner.guideFocus')}</span><p>{guide.focus}</p></aside>}
      {exerciseDetail.note && <aside class="exercise-guide-focus"><span>{t('runner.coachNote')}</span><p>{exerciseDetail.note}</p></aside>}
      <p class="exercise-guide-safety">{t('runner.guideSafety')}</p>
      <button class="button button-primary full-width runner-bottom-button" onClick={returnToPlan}>{t('runner.backToPlan')}<Icon name="arrow" /></button>
      {session.status === 'active' && session.timerEndsAt !== null && <div class="rest-dock" role="timer" aria-label={`${t('runner.timer')} ${formatTimer(timerLeft, currentLanguage())}`}><div class="rest-label"><span class="timer-pulse" /><span>{timerLeft === 0 ? t('runner.timerDone') : t('runner.timer')}</span></div><strong class="timer-value">{formatTimer(timerLeft, currentLanguage())}</strong><div class="timer-controls"><button aria-label={t('runner.minus15')} onClick={() => adjustTimer(-15)}><Icon name="minus" /><span>15</span></button><button aria-label={t('runner.add15')} onClick={() => adjustTimer(15)}><Icon name="plus" /><span>15</span></button><button class="timer-skip" onClick={skipRest}>{t('runner.skipRest')}</button></div></div>}
    </section>
  }

  if (session.status === 'completed') return <section class="finish-summary-screen"><div class="success-emblem"><Icon name="check" /></div><p class="eyebrow">{t('runner.finishTitle')}</p><h1>{session.workout.title}</h1><p class="summary-lede">{t('runner.finishBody')}</p><div class="finish-stats"><div><strong>{completionRate(session)}%</strong><span>{t('runner.completion')}</span></div><div><strong>{elapsed} <small>{t('app.minutes')}</small></strong><span>{t('history.totalTime')}</span></div><div><strong>{session.rpe ?? '—'}/10</strong><span>{t('history.rpe')}</span></div></div>{session.note && <blockquote class="finish-note">“{session.note}”</blockquote>}<button class="button button-secondary full-width" onClick={onHome}>{t('app.today')}<Icon name="arrow" /></button></section>

  return <section class="runner-screen">
    <header class="runner-head"><div><p class="eyebrow">{session.status === 'active' ? t('runner.eyebrow') : t('history.planned')}</p><h1>{session.workout.title}</h1></div><div class="runner-head-time"><strong>{elapsed}</strong><span>{t('app.minutes')}</span></div></header>
    {session.status === 'planned' && <div class="runner-start-panel"><p>{t('runner.plannedNotice')}</p><button class="button button-primary" onClick={() => void onStart(session.id)}>{t('runner.start')}<Icon name="arrow" /></button></div>}
    <div class="runner-progress"><div class="progress-label"><span>{t('runner.progress')}</span><strong>{formatNumber(progress)}%</strong></div><div class="progress-track"><i style={{ width: `${progress}%` }} /></div><div class="progress-meta"><span>{formatNumber(done)}/{formatNumber(planned)} {t('runner.setsDone')}</span>{session.status === 'active' && <span>{t('runner.elapsed')} · {formatNumber(elapsed)} {t('app.minutes')}</span>}</div></div>
    {hasWeightedExercises && <p class="load-guidance">{t('runner.loadGuidance')}</p>}
    <div class="coach-card"><span class="coach-star"><Icon name="spark" /></span><div><p>{t('runner.coachNote')}</p><strong>{session.workout.coach}</strong></div></div>
    {session.usage && <p class="actual-usage">{t('generator.usage', { prompt: session.usage.promptTokens, completion: session.usage.completionTokens })}</p>}
      <div class="workout-blocks">{session.workout.blocks.map((block, bi) => <section class="workout-block" key={`${session.id}-${bi}`}><header class="block-heading"><span class="block-index">{String(bi + 1).padStart(2, '0')}</span><h2>{t(`blocks.${block.t}` as TranslationKey)}</h2></header>
      {block.items.map((item, ii) => {
        const key = `${bi}-${ii}`
        const exercise = exerciseById.get(item.ex)
        const text = exerciseText(item.ex)
        const exerciseLabel = item.ex === 'custom' ? item.name ?? t('generator.custom') : text.name
        const demoFrames = exerciseImages[item.ex as keyof typeof exerciseImages]?.frames ?? []
        const availableEquipment = new Set(['bodyweight', ...settings.equipment])
        const replacements = [...(exercise?.regressions ?? []), ...(exercise?.progressions ?? [])].filter(id => exerciseById.get(id)?.equipment.every(tag => availableEquipment.has(tag)))
        return <article class={`exercise-card ${item.skipped ? 'exercise-skipped' : ''}`} key={`${key}-${item.ex}`}>
          <div class="exercise-title-row"><div><h3><button class="exercise-title-link" onClick={() => openExerciseGuide(item.ex, exerciseLabel, item.note)} aria-label={`${exerciseLabel}: ${t('runner.viewGuide')}`}><span>{exerciseLabel}</span><Icon name="arrow" /></button></h3><p>{text.cue || cueFor(item.ex)}</p><button class="exercise-guide-link" onClick={() => openExerciseGuide(item.ex, exerciseLabel, item.note)}>{t('runner.viewGuide')}</button>{item.skipped && <span class="skipped-badge">{t('runner.skipped')}</span>}</div><div class="exercise-meta"><strong>{formatNumber(item.sets)} × {formatNumber(item.tgt)}{item.u === 'r' ? ` ${t('app.reps')}` : ` ${t('app.seconds')}`}</strong>{item.load !== null && <span>{formatLoad(item.load, settings.units)} {settings.units}</span>}</div></div>
          {demoFrames.length > 0 && <div class="exercise-demo">{demoFrames.map((src, frameIndex) => <figure key={src}><img src={src} alt={`${exerciseLabel} — ${t(frameIndex === 0 ? 'runner.demoStart' : frameIndex === demoFrames.length - 1 ? 'runner.demoFinish' : 'runner.demoStep')}`} loading="lazy" decoding="async" /><figcaption>{t(frameIndex === 0 ? 'runner.demoStart' : frameIndex === demoFrames.length - 1 ? 'runner.demoFinish' : 'runner.demoStep')}</figcaption></figure>)}</div>}
          {item.note && <p class="exercise-note">{item.note}</p>}
          {!item.skipped && <div class="set-list">{item.log.map((set, si) => <div class={`set-row ${set.done ? 'set-done' : ''}`} key={si}><div class="set-number">{new Intl.NumberFormat(currentLanguage(), { minimumIntegerDigits: 2, useGrouping: false }).format(si + 1)}</div><div class="set-target">{t('app.setCount', { count: si + 1 })}<span>{formatNumber(set.reps)} {item.u === 'r' ? t('app.reps') : t('app.seconds')}</span></div>
            <div class="set-steppers"><div class="stepper" aria-label={t('runner.adjustReps')}><button aria-label={`${t('runner.adjustReps')} −`} disabled={session.status !== 'active'} onClick={() => adjustSet(bi, ii, si, { reps: Math.max(0, set.reps - (item.u === 's' ? 5 : 1)) })}><Icon name="minus" /></button><strong>{set.reps}</strong><button aria-label={`${t('runner.adjustReps')} +`} disabled={session.status !== 'active'} onClick={() => adjustSet(bi, ii, si, { reps: set.reps + (item.u === 's' ? 5 : 1) })}><Icon name="plus" /></button></div>
              {exercise?.loadable && <div class="stepper load-stepper" aria-label={t('runner.adjustLoad')}><button aria-label={`${t('runner.adjustLoad')} −`} disabled={session.status !== 'active'} onClick={() => adjustSet(bi, ii, si, { loadKg: Math.max(0, (set.loadKg ?? 0) - toKg(settings.units === 'lb' ? 5 : 2.5, settings.units)) })}><Icon name="minus" /></button><strong>{formatLoad(set.loadKg, settings.units)}<small>{settings.units}</small></strong><button aria-label={`${t('runner.adjustLoad')} +`} disabled={session.status !== 'active'} onClick={() => adjustSet(bi, ii, si, { loadKg: (set.loadKg ?? 0) + toKg(settings.units === 'lb' ? 5 : 2.5, settings.units) })}><Icon name="plus" /></button></div>}
            </div><button class={`complete-set ${set.done ? 'is-done' : ''}`} aria-pressed={set.done} aria-label={`${exerciseLabel}, ${t('app.setCount', { count: si + 1 })}, ${t(set.done ? 'runner.completed' : 'runner.markDone')}`} onClick={() => toggleSet(bi, ii, si)}>{set.done ? <Icon name="check" /> : <span />}</button></div>)}</div>}
          {session.status === 'active' && <div class="exercise-actions"><button class="quiet-action" onClick={() => setSwapping(swapping === key ? null : key)} disabled={item.skipped || item.log.some(set => set.done) || replacements.length === 0}>{t('runner.swap')}</button><button class="quiet-action quiet-skip" onClick={() => byId(bi, ii, value => ({ ...value, skipped: true }))} disabled={item.skipped}>{t(item.skipped ? 'runner.skipped' : 'runner.skipExercise')}</button></div>}
          {swapping === key && replacements.length > 0 && <div class="swap-panel"><p>{t('runner.swapHint')}</p>{replacements.map(id => <button key={id} class="swap-choice" onClick={() => { const target = exerciseById.get(id); if (!target) return; byId(bi, ii, value => ({ ...value, ex: id, name: null, u: target.type === 'time' ? 's' : 'r', load: null, tgt: target.type === 'time' ? Math.min(value.tgt, 120) : value.tgt, log: Array.from({ length: value.sets }, () => ({ done: false, reps: target.type === 'time' ? Math.min(value.tgt, 120) : value.tgt, loadKg: null, completedAt: null })), skipped: false })); setSwapping(null) }}>{nameFor(id)}<Icon name="arrow" /></button>)}</div>}
        </article>
      })}
    </section>)}</div>
    {session.status === 'active' && !finishing && <button class="button button-secondary full-width runner-bottom-button" onClick={() => { setFinishing(true); if (session.timerEndsAt !== null) void mutate(current => ({ ...current, timerEndsAt: null }), session.id) }}>{t('runner.finish')}<Icon name="check" /></button>}
    {session.status === 'active' && finishing && <div class="finish-form-card"><p class="eyebrow">{t('runner.finishTitle')}</p><h2>{t('runner.finishBody')}</h2><div class="finish-stats compact"><div><strong>{formatNumber(completionRate(session))}%</strong><span>{t('runner.completion')}</span></div><div><strong>{formatNumber(elapsed)} {t('app.minutes')}</strong><span>{t('history.totalTime')}</span></div></div><div class="form-group"><span>{t('runner.rpe')}</span><div class="rpe-labels"><small>{t('runner.rpeLow')}</small><small>{t('runner.rpeHigh')}</small></div><div class="rpe-scale">{Array.from({ length: 10 }, (_, i) => i + 1).map(value => <button type="button" class={session.rpe === value ? 'selected' : ''} aria-label={`${t('runner.rpe')} ${formatNumber(value)}`} aria-pressed={session.rpe === value} onClick={() => mutate(current => ({ ...current, rpe: value }), session.id)}>{formatNumber(value)}</button>)}</div></div><label class="form-group"><span>{t('runner.sessionNote')}</span><textarea class="text-input textarea" value={session.note} maxlength={600} placeholder={t('runner.notePlaceholder')} onInput={event => mutate(current => ({ ...current, note: (event.currentTarget as HTMLTextAreaElement).value }), session.id)} /></label>
      {session.workout.cap_updates.length > 0 && <div class="suggestion-box"><p>{t('runner.capSuggestion')}</p>{session.workout.cap_updates.map(update => <span key={update.ex}>{nameFor(update.ex)} · {update.max !== null ? `${update.max} ${t('app.reps')}` : `${formatLoad(update.load, settings.units)} ${settings.units} × ${update.reps}`}</span>)}<button class="text-button" onClick={() => void onApplyUpdates(session.id)}>{t('runner.applySuggestions')}<Icon name="arrow" /></button></div>}
      <button class="button button-primary full-width" onClick={() => void onFinish(session.id)}>{t('runner.finish')}<Icon name="check" /></button><button class="text-button center-button" onClick={() => setFinishing(false)}>{t('app.cancel')}</button></div>}
    {session.status === 'active' && session.timerEndsAt !== null && <div class="rest-dock" role="timer" aria-label={`${t('runner.timer')} ${formatTimer(timerLeft, currentLanguage())}`}><div class="rest-label"><span class="timer-pulse" /><span>{timerLeft === 0 ? t('runner.timerDone') : t('runner.timer')}</span></div><strong class="timer-value">{formatTimer(timerLeft, currentLanguage())}</strong><div class="timer-controls"><button aria-label={t('runner.minus15')} onClick={() => adjustTimer(-15)}><Icon name="minus" /><span>15</span></button><button aria-label={t('runner.add15')} onClick={() => adjustTimer(15)}><Icon name="plus" /><span>15</span></button><button class="timer-skip" onClick={skipRest}>{t('runner.skipRest')}</button></div></div>}
  </section>
}

function HistoryScreen({ sessions, weights, units, detail, onOpen, onClose, onRemove }: { sessions: WorkoutSession[]; weights: WeightEntry[]; units: 'kg' | 'lb'; detail: WorkoutSession | null; onOpen: (id: string) => void; onClose: () => void; onRemove: (id: string) => void }) {
  const completed = sessions.filter(session => session.status === 'completed')
  const allIds = [...new Set(completed.flatMap(session => session.workout.blocks.flatMap(block => block.items.map(item => item.ex))))]
  const [selectedExercise, setSelectedExercise] = useState(allIds[0] ?? '')
  useEffect(() => { if (!allIds.includes(selectedExercise)) setSelectedExercise(allIds[0] ?? '') }, [sessions.length])
  const trendData = completed.slice().reverse().flatMap(session => {
    const items = session.workout.blocks.flatMap(block => block.items).filter(item => item.ex === selectedExercise)
    if (!items.length) return []
    const best = Math.max(...items.flatMap(item => item.log.filter(set => set.done).map(set => (set.loadKg ?? 1) * set.reps)), 0)
    return [{ date: session.finishedAt ?? session.createdAt, value: best }]
  })
  const max = Math.max(1, ...trendData.map(point => point.value))
  const min = Math.min(0, ...trendData.map(point => point.value))
  const points = trendData.map((point, index) => {
    const x = trendData.length < 2 ? 160 : 18 + index * (284 / (trendData.length - 1))
    const y = 94 - ((point.value - min) / Math.max(1, max - min)) * 70
    return `${x},${y}`
  }).join(' ')
  const summary = summarizeHistory(sessions)
  const weightTrend = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  const minWeight = weightTrend.length ? Math.min(...weightTrend.map(item => item.weightKg)) - .5 : 0
  const maxWeight = weightTrend.length ? Math.max(...weightTrend.map(item => item.weightKg)) + .5 : 1
  const weightPoints = weightTrend.map((item, index) => {
    const x = weightTrend.length < 2 ? 160 : 18 + index * (284 / (weightTrend.length - 1))
    const y = 94 - ((item.weightKg - minWeight) / Math.max(1, maxWeight - minWeight)) * 70
    return `${x},${y}`
  }).join(' ')

  if (detail) return <section class="history-detail"><button class="back-link" onClick={onClose}><span>←</span>{t('app.back')}</button><p class="eyebrow">{formatDate(detail.finishedAt ?? detail.createdAt)}</p><h1>{detail.workout.title}</h1><p class="detail-status">{t(`history.${detail.status}` as TranslationKey)}</p><div class="finish-stats"><div><strong>{formatNumber(completionRate(detail))}%</strong><span>{t('runner.completion')}</span></div><div><strong>{formatNumber(minutesBetween(detail.startedAt, detail.finishedAt))} <small>{t('app.minutes')}</small></strong><span>{t('history.totalTime')}</span></div><div><strong>{detail.rpe === null ? '—' : formatNumber(detail.rpe)}/10</strong><span>{t('history.rpe')}</span></div></div>{detail.note && <blockquote class="finish-note">“{detail.note}”</blockquote>}<div class="detail-exercises">{detail.workout.blocks.map((block, bi) => <div class="detail-block" key={bi}><h2>{t(`blocks.${block.t}` as TranslationKey)}</h2>{block.items.map((item, ii) => <div class="detail-exercise" key={`${bi}-${ii}`}><span>{exerciseText(item.ex).name}</span><strong>{formatNumber(item.log.filter(set => set.done).length)}/{formatNumber(item.sets)} {t('app.sets')}</strong><small>{item.log.filter(set => set.done).map(set => `${formatNumber(set.reps)}${set.loadKg !== null ? ` · ${formatLoad(set.loadKg, units)} ${units}` : ''}`).join(' / ')}</small></div>)}</div>)}</div><div class="coach-card"><span class="coach-star"><Icon name="spark" /></span><div><p>{t('runner.coachNote')}</p><strong>{detail.workout.coach}</strong></div></div></section>

  return <section class="history-screen"><header class="section-intro"><p class="eyebrow">{t('history.eyebrow')}</p><h1>{t('history.title')}</h1><p>{t('history.description')}</p></header>
    <div class="history-insight-row"><div class="insight-card"><span>{t('history.averageCompletion')}</span><strong>{formatNumber(summary.avg_completion)}<small>%</small></strong></div><div class="insight-card"><span>{t('history.weightTrend')}</span><strong>{weights.length ? `${formatLoad(weights.at(-1)?.weightKg ?? null, units)} ${units}` : '—'}</strong><small>{weights.at(-1) ? formatDate(weights.at(-1)!.date) : t('settings.never')}</small></div></div>
    {weightTrend.length > 1 && <div class="chart-card"><div class="chart-head"><div><p class="eyebrow">{t('history.weightTrend')}</p><h2>{t('settings.weight')}</h2></div><span class="chart-foot">{units}</span></div><div class="chart-wrap"><svg viewBox="0 0 320 116" role="img" aria-label={t('history.weightTrend')}><path d="M18 24H302M18 59H302M18 94H302" class="chart-gridline" /><polyline points={weightPoints} class="chart-line" />{weightTrend.map((point, index) => { const [x, y] = weightPoints.split(' ')[index].split(','); return <circle key={point.id} cx={x} cy={y} r="4" class="chart-point" /> })}</svg></div><div class="chart-foot"><span>{formatDate(weightTrend[0].date)}</span><strong>{formatLoad(weightTrend.at(-1)!.weightKg, units)} {units}</strong><span>{formatDate(weightTrend.at(-1)!.date)}</span></div></div>}
    {completed.length > 1 && <div class="chart-card"><div class="chart-head"><div><p class="eyebrow">{t('history.exerciseProgress')}</p><h2>{selectedExercise ? exerciseText(selectedExercise).name : t('history.selectExercise')}</h2></div><label class="visually-hidden" for="exercise-trend">{t('history.selectExercise')}</label><select class="chart-select" id="exercise-trend" value={selectedExercise} onChange={event => setSelectedExercise((event.currentTarget as HTMLSelectElement).value)}>{allIds.map(id => <option value={id} key={id}>{exerciseText(id).name}</option>)}</select></div>{trendData.length > 1 ? <><div class="chart-wrap"><svg viewBox="0 0 320 116" role="img" aria-label={`${exerciseText(selectedExercise).name} ${t(`history.trend${(summary.exercise[selectedExercise]?.trend ?? 'flat').charAt(0).toUpperCase()}${(summary.exercise[selectedExercise]?.trend ?? 'flat').slice(1)}` as TranslationKey)}`}><path d="M18 24H302M18 59H302M18 94H302" class="chart-gridline" /><polyline points={points} class="chart-line" />{trendData.map((point, index) => { const [x, y] = points.split(' ')[index].split(','); return <circle key={point.date} cx={x} cy={y} r="4" class="chart-point" /> })}</svg></div><div class="chart-foot"><span>{formatDate(trendData[0].date)}</span><strong>{t('history.best')}: {formatNumber(summary.exercise[selectedExercise]?.best ?? 0)}</strong><span>{formatDate(trendData.at(-1)!.date)}</span></div><p class="trend-pill">{t(`history.trend${(summary.exercise[selectedExercise]?.trend ?? 'flat').charAt(0).toUpperCase()}${(summary.exercise[selectedExercise]?.trend ?? 'flat').slice(1)}` as TranslationKey)}</p></> : <p class="field-hint">{t('history.noData')}</p>}</div>}
    {sessions.length === 0 ? <div class="empty-history"><span class="empty-mark"><Icon name="history" /></span><h2>{t('history.emptyTitle')}</h2><p>{t('history.emptyBody')}</p></div> : <div class="session-list">{sessions.map(session => <article class="history-card" key={session.id}><button class="history-card-open" onClick={() => onOpen(session.id)}><div class="history-card-date"><span>{new Intl.DateTimeFormat(currentLanguage(), { weekday: 'short' }).format(new Date(session.createdAt))}</span><strong>{new Intl.DateTimeFormat(currentLanguage(), { day: '2-digit' }).format(new Date(session.createdAt))}</strong><small>{new Intl.DateTimeFormat(currentLanguage(), { month: 'short' }).format(new Date(session.createdAt))}</small></div><div class="history-card-main"><span class={`status-label status-${session.status}`}>{t(`history.${session.status}` as TranslationKey)}</span><h3>{session.workout.title}</h3><p>{formatNumber(session.workout.blocks.reduce((sum, block) => sum + block.items.length, 0))} {t('runner.exercise')} · {formatNumber(session.workout.est_min)} {t('app.minutes')}</p></div><div class="history-completion"><strong>{formatNumber(completionRate(session))}%</strong><Icon name="arrow" /></div></button><button class="remove-session" aria-label={`${t('history.removeWorkout')}: ${session.workout.title}`} title={t('history.removeWorkout')} onClick={() => onRemove(session.id)}><Icon name="trash" /></button></article>)}</div>}
  </section>
}

function SettingsScreen({ settings, setDraft, capabilities, meta, persistState, storageEstimate, onSave, onRecordWeight, onSaveCapability, onRemoveCapability, onExport, onImportClick }: {
  settings: AppSettings; setDraft: (value: AppSettings) => void; capabilities: Capability[]; meta: AppMeta
  persistState: PersistState; storageEstimate: { usage?: number; quota?: number }; onSave: (value: AppSettings) => Promise<void>
  onRecordWeight: (value: AppSettings) => Promise<void>
  onSaveCapability: (value: Capability) => Promise<void>; onRemoveCapability: (id: string) => Promise<void>; onExport: (includeKey: boolean) => Promise<void>; onImportClick: () => void
}) {
  const [showKey, setShowKey] = useState(false)
  const [includeKey, setIncludeKey] = useState(false)
  const [selectedId, setSelectedId] = useState(commonCapabilityIds[0])
  const [capMode, setCapMode] = useState<'max' | 'load'>('max')
  const [maxInput, setMaxInput] = useState('')
  const [loadInput, setLoadInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const selectedExercise = exerciseById.get(selectedId)
  useEffect(() => {
    const existing = capabilities.find(cap => cap.exerciseId === selectedId)
    if (existing?.max !== null && existing?.max !== undefined) { setCapMode('max'); setMaxInput(String(existing.max)); setLoadInput(''); setRepsInput('') }
    else if (existing) { setCapMode('load'); setLoadInput(existing.loadKg === null ? '' : String(formatLoad(existing.loadKg, settings.units))); setRepsInput(String(existing.reps ?? '')); setMaxInput('') }
    else { setCapMode(selectedExercise?.loadable ? 'load' : 'max'); setMaxInput(''); setLoadInput(''); setRepsInput('') }
  }, [selectedId, capabilities, settings.units])
  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setDraft(next)
    void onSave(next)
  }
  const updateProfile = (patch: Partial<AppSettings['profile']>) => update({ profile: { ...settings.profile, ...patch } })
  const byteSize = (value?: number) => value === undefined ? '—' : value < 1024 ** 2 ? `${formatNumber(Math.round(value / 1024))} KB` : `${formatNumber(value / 1024 ** 2, 1)} MB`
  const saveCap = async (event: Event) => {
    event.preventDefault()
    if (!selectedId) return
    await onSaveCapability({ exerciseId: selectedId, max: capMode === 'max' ? Number(maxInput) || null : null,
      loadKg: capMode === 'load' ? toKg(Number(loadInput) || 0, settings.units) : null,
      reps: capMode === 'load' ? Number(repsInput) || null : null, updatedAt: new Date().toISOString() })
    setMaxInput(''); setLoadInput(''); setRepsInput('')
  }
  const editCap = (cap: Capability) => {
    setSelectedId(cap.exerciseId)
    document.getElementById('cap-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const visibleWeight = settings.profile.weightKg === null ? '' : String(Number((settings.units === 'lb' ? settings.profile.weightKg * 2.20462 : settings.profile.weightKg).toFixed(1)))
  const capabilityOptions = [...new Set([...commonCapabilityIds, ...capabilities.map(capability => capability.exerciseId)])]
  return <section class="settings-screen"><header class="section-intro"><p class="eyebrow">{t('settings.eyebrow')}</p><h1>{t('settings.title')}</h1><p>{t('settings.description')}</p><p class="settings-autosave">{t('settings.autoSave')}</p></header>
    <div class="settings-layout">
      <section class="settings-card"><div class="settings-card-heading"><span class="section-number">01</span><div><p class="eyebrow">{t('settings.accountTitle')}</p><h2>{t('settings.apiAccessTitle')}</h2></div><span class="section-icon"><Icon name="spark" /></span></div>
        <label class="form-group"><span>{t('settings.apiKey')}</span><div class="input-with-action"><input class="text-input" type={showKey ? 'text' : 'password'} autocomplete="off" spellcheck={false} value={settings.apiKey} placeholder={t('settings.apiKeyPlaceholder')} onInput={event => update({ apiKey: (event.currentTarget as HTMLInputElement).value })} /><button class="show-key" type="button" onClick={() => setShowKey(!showKey)}>{showKey ? t('settings.hideKey') : t('settings.showKey')}</button></div><small class="field-hint">{t('settings.apiKeyHelp')}</small></label>
      </section>

      <section class="settings-card"><div class="settings-card-heading"><span class="section-number">02</span><div><p class="eyebrow">{t('settings.profileTitle')}</p><h2>{t('settings.profileTitle')}</h2></div><span class="section-icon"><Icon name="home" /></span></div>
        <div class="form-row"><label class="form-group"><span>{t('settings.sex')}</span><select class="text-input" value={settings.profile.sex} onChange={event => updateProfile({ sex: (event.currentTarget as HTMLSelectElement).value })}><option value="">{t('settings.sexUnspecified')}</option><option value="female">{t('settings.sexFemale')}</option><option value="male">{t('settings.sexMale')}</option><option value="other">{t('settings.sexOther')}</option></select></label><label class="form-group"><span>{t('settings.age')}</span><input class="text-input" type="number" min="13" max="100" value={settings.profile.age ?? ''} onInput={event => updateProfile({ age: Number((event.currentTarget as HTMLInputElement).value) || null })} /></label></div>
        <div class="form-row"><label class="form-group"><span>{t('settings.height')}</span><input class="text-input" type="number" min="100" max="250" value={settings.profile.heightCm ?? ''} onInput={event => updateProfile({ heightCm: Number((event.currentTarget as HTMLInputElement).value) || null })} /></label><label class="form-group"><span>{t('settings.weight')} ({settings.units})</span><input class="text-input" type="number" min="25" max="350" step="0.1" value={visibleWeight} onInput={event => updateProfile({ weightKg: (Number((event.currentTarget as HTMLInputElement).value) || 0) ? toKg(Number((event.currentTarget as HTMLInputElement).value), settings.units) : null })} /></label></div>
        <label class="form-group"><span>{t('settings.units')}</span><select class="text-input" value={settings.units} onChange={event => update({ units: (event.currentTarget as HTMLSelectElement).value as 'kg' | 'lb' })}><option value="kg">kg</option><option value="lb">lb</option></select></label>
        {settings.profile.weightKg !== null && <button class="text-button weight-log-button" type="button" onClick={() => void onRecordWeight(settings)}><Icon name="plus" />{t('settings.recordWeight')}</button>}
        <label class="form-group"><span>{t('settings.style')}</span><textarea class="text-input textarea" maxlength={500} value={settings.style} placeholder={t('settings.stylePlaceholder')} onInput={event => update({ style: (event.currentTarget as HTMLTextAreaElement).value.slice(0, 500) })} /><small class="field-hint">{t('settings.styleHelp')}</small></label>
      </section>

      <section class="settings-card"><div class="settings-card-heading"><span class="section-number">03</span><div><p class="eyebrow">{t('settings.capabilitiesTitle')}</p><h2>{t('settings.capabilitiesTitle')}</h2></div><span class="section-icon"><Icon name="generate" /></span></div><p class="card-description">{t('settings.capabilitiesDescription')}</p>
        {capabilities.length ? <div class="capability-list">{capabilities.map(cap => <div class="capability-pill" key={cap.exerciseId}><button class="capability-edit" onClick={() => editCap(cap)}><strong>{exerciseText(cap.exerciseId).name}</strong><span>{cap.max !== null ? `${cap.max} ${t('settings.maxReps')}` : `${formatLoad(cap.loadKg, settings.units)} ${settings.units} × ${cap.reps}`}</span></button><button class="remove-capability" aria-label={`${t('app.delete')} ${exerciseText(cap.exerciseId).name}`} onClick={() => void onRemoveCapability(cap.exerciseId)}><Icon name="close" /></button></div>)}</div> : <p class="empty-inline">{t('settings.noCapabilities')}</p>}
        <form id="cap-editor" class="cap-editor" onSubmit={saveCap}><label class="form-group"><span>{t('settings.addCapability')}</span><select class="text-input" value={selectedId} onChange={event => setSelectedId((event.currentTarget as HTMLSelectElement).value)}>{capabilityOptions.map(id => { const ex = exerciseById.get(id); return ex ? <option value={ex.id} key={ex.id}>{exerciseText(ex.id).name} · {t(`pattern.${ex.pattern}` as TranslationKey)}</option> : null })}</select></label>
          {selectedExercise?.loadable && <div class="segmented-control"><button type="button" class={capMode === 'max' ? 'selected' : ''} onClick={() => setCapMode('max')}>{t('settings.maxReps')}</button><button type="button" class={capMode === 'load' ? 'selected' : ''} onClick={() => setCapMode('load')}>{t('settings.loadKg')}</button></div>}
          {capMode === 'max' || !selectedExercise?.loadable ? <label class="form-group"><span>{t('settings.maxReps')}</span><input class="text-input" type="number" min="1" max="600" value={maxInput} onInput={event => setMaxInput((event.currentTarget as HTMLInputElement).value)} /></label> : <div class="form-row"><label class="form-group"><span>{t('settings.loadKg')} ({settings.units})</span><input class="text-input" type="number" min="0" max="1000" step="0.5" value={loadInput} onInput={event => setLoadInput((event.currentTarget as HTMLInputElement).value)} /></label><label class="form-group"><span>{t('settings.capReps')}</span><input class="text-input" type="number" min="1" max="300" value={repsInput} onInput={event => setRepsInput((event.currentTarget as HTMLInputElement).value)} /></label></div>}
          <button class="button button-secondary full-width" type="submit" disabled={capMode === 'max' ? !maxInput : !loadInput || !repsInput}><Icon name="plus" />{t('settings.addCapability')}</button>
        </form>
      </section>

      <section class="settings-card"><div class="settings-card-heading"><span class="section-number">04</span><div><p class="eyebrow">{t('settings.equipmentTitle')}</p><h2>{t('settings.equipmentTitle')}</h2></div><span class="section-icon"><Icon name="settings" /></span></div>
        <label class="form-group"><span>{t('settings.preset')}</span><select class="text-input" value={settings.equipmentPreset} onChange={event => { const value = (event.currentTarget as HTMLSelectElement).value; update({ equipmentPreset: value, equipment: presets[value] ?? settings.equipment }) }}><option value="park">{t('generator.presetPark')}</option><option value="gym">{t('generator.presetGym')}</option><option value="home">{t('generator.presetHome')}</option><option value="custom">{t('generator.presetCustom')}</option></select></label>
        <fieldset class="equipment-grid settings-equipment"><legend>{t('settings.chooseEquipment')}</legend>{equipmentKeys.map(key => <label class="check-chip" key={key}><input type="checkbox" checked={settings.equipment.includes(key)} onChange={event => update({ equipment: event.currentTarget.checked ? [...new Set([...settings.equipment, key])] : settings.equipment.filter(value => value !== key), equipmentPreset: 'custom' })} /><span class="check-mark"><Icon name="check" /></span>{t(`equipment.${key}` as TranslationKey)}</label>)}</fieldset>
      </section>

      <section class="settings-card data-card"><div class="settings-card-heading"><span class="section-number">05</span><div><p class="eyebrow">{t('settings.dataTitle')}</p><h2>{t('settings.dataTitle')}</h2></div><span class="section-icon"><Icon name="history" /></span></div>
        <div class="storage-status"><div class="storage-status-icon"><Icon name="check" /></div><div><span>{t('settings.persistent')}</span><strong class={persistState === 'yes' ? 'status-good' : 'status-warn'}>{t(persistState === 'yes' ? 'settings.persistentYes' : persistState === 'no' ? 'settings.persistentNo' : 'settings.persistentUnsupported')}</strong></div></div>
        <div class="storage-usage"><span>{t('settings.storageUsed', { used: byteSize(storageEstimate.usage), quota: byteSize(storageEstimate.quota) })}</span><div class="usage-track"><i style={{ width: `${storageEstimate.usage && storageEstimate.quota ? Math.min(100, storageEstimate.usage / storageEstimate.quota * 100) : 0}%` }} /></div></div>
        <div class="backup-date"><span>{t('settings.lastBackup')}</span><strong>{meta.lastBackupAt ? formatDate(meta.lastBackupAt) : t('settings.never')}</strong></div>
        <p class="card-description">{t('settings.backupInfo')}</p>
        <label class="check-chip include-key"><input type="checkbox" checked={includeKey} onChange={event => setIncludeKey(event.currentTarget.checked)} /><span class="check-mark"><Icon name="check" /></span>{t('settings.exportWithKey')}</label>
        <button class="button button-secondary full-width" onClick={() => void onExport(includeKey)}>{t('settings.export')}<Icon name="arrow" /></button>
        <button class="button button-outline full-width" onClick={onImportClick}>{t('settings.import')}<Icon name="arrow" /></button>
        <small class="field-hint">{t('app.notice')}</small>
        <div class="backup-date"><span>{t('settings.version')}</span><strong>{__APP_VERSION__} · {__APP_BUILD_TIME__.slice(0, 19).replace('T', ' ')} UTC</strong></div>
      </section>
    </div>
  </section>
}
