export function secondsRemaining(endsAt: number | null, now = Date.now()): number {
  if (endsAt === null) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

export function adjustEndTime(endsAt: number | null, deltaSeconds: number, now = Date.now()): number {
  const base = endsAt && endsAt > now ? endsAt : now
  return Math.max(now, base + deltaSeconds * 1000)
}

export function formatTimer(seconds: number, locale = 'en'): string {
  const minutes = Math.floor(seconds / 60)
  const digits = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  return `${digits.format(minutes)}:${digits.format(seconds % 60)}`
}
