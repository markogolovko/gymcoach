export const supportedLanguages = ['en'] as const
export const defaultLanguage = 'en'

export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageLoaders: Partial<Record<SupportedLanguage, () => Promise<{ default: Record<string, unknown> }>>> = {}
export const exerciseLoaders: Record<SupportedLanguage, () => Promise<{ default: Record<string, { name: string; cue: string }> }>> = {
  en: () => import('./exercises.en.json'),
}
