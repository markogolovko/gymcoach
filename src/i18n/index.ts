import english from './en.json'
import { defaultLanguage, exerciseLoaders, languageLoaders, supportedLanguages, type SupportedLanguage } from './config'

type Dictionary = typeof english
type Paths<T> = T extends string ? never : {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]> & string}` | K
}[keyof T & string]
export type TranslationKey = Paths<Dictionary>
export type TranslationParams = Record<string, string | number>

let language: SupportedLanguage = defaultLanguage
let dictionary: Record<string, unknown> = english
let exerciseDictionary: Record<string, { name: string; cue: string }> = {}

function read(source: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[segment]
  }, source)
}

export async function setLanguage(code: string): Promise<void> {
  const next = (supportedLanguages as readonly string[]).includes(code) ? code as SupportedLanguage : defaultLanguage
  language = next
  try {
    const loader = languageLoaders[next]
    const [messages, exercises] = await Promise.all([loader ? loader() : Promise.resolve({ default: english }), exerciseLoaders[next]()])
    dictionary = messages.default
    exerciseDictionary = exercises.default
  } catch {
    language = defaultLanguage
    dictionary = english
    exerciseDictionary = {}
  }
}

export function t(key: TranslationKey, params: TranslationParams = {}): string {
  let value = read(dictionary, key)
  if (value === undefined) value = read(english as Record<string, unknown>, key)
  if (value && typeof value === 'object' && typeof params.count === 'number') {
    const forms = value as Record<string, unknown>
    value = forms[new Intl.PluralRules(language).select(params.count)] ?? forms.other
  }
  if (typeof value !== 'string') return key.split('.').at(-1)?.replaceAll('_', ' ') ?? key
  return value.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const parameter = params[name]
    return typeof parameter === 'number' ? new Intl.NumberFormat(language).format(parameter) : String(parameter ?? '')
  })
}

export function exerciseText(id: string): { name: string; cue: string } {
  return exerciseDictionary[id] ?? { name: id.replaceAll('_', ' '), cue: '' }
}

export function currentLanguage(): SupportedLanguage { return language }
