/**
 * Sistema unificado de fechas para QuinList.
 *
 * - Fechas de calendario (DATE en BD): cadenas YYYY-MM-DD, sin zona horaria.
 * - Instantes (TIMESTAMPTZ): ISO UTC; se muestran en America/Bogota.
 * - Todos los cálculos de "hoy", vencimientos y días restantes usan Colombia.
 */

export const APP_TIMEZONE = 'America/Bogota'
export const APP_LOCALE = 'es-CO'

export type CalendarDate = string
export type Instant = string

const CALENDAR_RE = /^(\d{4})-(\d{2})-(\d{2})/

// ── Normalización ───────────────────────────────────────────────────────────

/** Extrae YYYY-MM-DD de cualquier valor almacenado sin desplazamiento UTC. */
export function normalizeCalendarDate(value: string | null | undefined): CalendarDate | null {
  if (!value) return null
  const match = value.match(CALENDAR_RE)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

/** Fecha de calendario actual en Colombia (YYYY-MM-DD). */
export function todayCalendarDate(): CalendarDate {
  return formatInstantAsCalendarDate(new Date().toISOString())
}

/** @deprecated Usar todayCalendarDate */
export const todayISO = todayCalendarDate

function parseParts(value: string): { y: number; m: number; d: number } {
  const normalized = normalizeCalendarDate(value)
  if (!normalized) throw new Error(`Fecha de calendario inválida: ${value}`)
  const [, y, m, d] = normalized.match(CALENDAR_RE)!
  return { y: Number(y), m: Number(m), d: Number(d) }
}

function utcMs(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d)
}

// ── Aritmética de calendario (independiente de zona horaria) ─────────────────

/** Días entre dos fechas de calendario (to − from). Puede ser negativo. */
export function calendarDaysBetween(from: CalendarDate, to: CalendarDate): number {
  const a = parseParts(from)
  const b = parseParts(to)
  return Math.round((utcMs(b.y, b.m, b.d) - utcMs(a.y, a.m, a.d)) / 86_400_000)
}

/** Duración inclusiva entre dos fechas (mínimo 1 día). */
export function calendarDurationDays(start: CalendarDate, end: CalendarDate): number {
  return Math.max(1, calendarDaysBetween(start, end) + 1)
}

/** Días restantes hasta una fecha (0 = hoy, negativo = vencido). */
export function daysUntilDue(
  dueDate: string | null | undefined,
  today: CalendarDate = todayCalendarDate(),
): number | null {
  const due = normalizeCalendarDate(dueDate)
  if (!due) return null
  return calendarDaysBetween(today, due)
}

/** Alias para compatibilidad */
export const daysUntil = daysUntilDue

export function isCalendarBefore(a: string, b: string): boolean {
  const na = normalizeCalendarDate(a)
  const nb = normalizeCalendarDate(b)
  if (!na || !nb) return false
  return na < nb
}

export function isCalendarOverdue(
  dueDate: string | null | undefined,
  today: CalendarDate = todayCalendarDate(),
): boolean {
  const days = daysUntilDue(dueDate, today)
  return days !== null && days < 0
}

export function isDueSoon(
  dueDate: string | null | undefined,
  withinDays = 3,
  today: CalendarDate = todayCalendarDate(),
): boolean {
  const days = daysUntilDue(dueDate, today)
  return days !== null && days >= 0 && days <= withinDays
}

/** Milisegundos UTC para posicionar fechas de calendario en líneas de tiempo. */
export function calendarDateToUtcMs(dateStr: string): number {
  const { y, m, d } = parseParts(dateStr)
  return utcMs(y, m, d)
}

export function compareCalendarDates(a: string, b: string): number {
  const na = normalizeCalendarDate(a) ?? ''
  const nb = normalizeCalendarDate(b) ?? ''
  return na.localeCompare(nb)
}

export function compareInstants(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime()
}

// ── Instantes ─────────────────────────────────────────────────────────────────

export function nowInstantISO(): Instant {
  return new Date().toISOString()
}

/** Convierte un instante ISO a fecha de calendario en Colombia. */
export function instantToCalendarDate(iso: string): CalendarDate {
  return formatInstantAsCalendarDate(iso)
}

function formatInstantAsCalendarDate(iso: string): CalendarDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

// ── Formato colombiano ────────────────────────────────────────────────────────

/** 29 jul 2026 */
export function formatCalendarDateShort(dateStr: string | null | undefined): string {
  const normalized = normalizeCalendarDate(dateStr)
  if (!normalized) return ''
  const { y, m, d } = parseParts(normalized)
  const label = new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
  return `${label} ${y}`
}

/** 29 de julio de 2026 */
export function formatCalendarDateLong(dateStr: string | null | undefined): string {
  const normalized = normalizeCalendarDate(dateStr)
  if (!normalized) return '—'
  const { y, m, d } = parseParts(normalized)
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

/** 29/07/2026 */
export function formatCalendarDateNumeric(dateStr: string | null | undefined): string {
  const normalized = normalizeCalendarDate(dateStr)
  if (!normalized) return ''
  const { y, m, d } = parseParts(normalized)
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

/** 29/07/2026 03:45 p. m. */
export function formatInstantDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** Alias de compatibilidad — formato corto para fechas de calendario */
export const formatDate = formatCalendarDateShort

/** Alias de compatibilidad — fecha y hora para instantes */
export const formatDateTime = formatInstantDateTime

/** @deprecated Usar formatCalendarDateShort */
export const formatDateDisplay = formatCalendarDateLong

/** julio de 2026 */
export function formatCalendarMonthYear(dateStr: string | null | undefined): string {
  const normalized = normalizeCalendarDate(dateStr)
  if (!normalized) return '—'
  const { y, m, d } = parseParts(normalized)
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

// ── Etiquetas de vencimiento ──────────────────────────────────────────────────

export type DueTone = 'ok' | 'warn' | 'danger'

export interface DueLabel {
  text: string
  tone: DueTone
}

export function formatDueLabel(
  dueDate: string | null | undefined,
  options: { completed?: boolean } = {},
): DueLabel | null {
  if (!dueDate) return null
  if (options.completed) return { text: 'Completada', tone: 'ok' }

  const days = daysUntilDue(dueDate)
  if (days === null) return null

  if (days < 0) {
    const n = Math.abs(days)
    return {
      text: `Vencido hace ${n} día${n === 1 ? '' : 's'}`,
      tone: 'danger',
    }
  }
  if (days === 0) return { text: 'Vence hoy', tone: 'warn' }
  if (days === 1) return { text: 'Vence mañana', tone: 'warn' }
  if (days <= 3) {
    return { text: `Vence en ${days} días`, tone: 'warn' }
  }
  return { text: `Vence el ${formatCalendarDateShort(dueDate)}`, tone: 'ok' }
}

export function formatRemainingDaysLabel(
  dueDate: string | null | undefined,
  options: { completed?: boolean; cancelled?: boolean } = {},
): string | null {
  if (!dueDate || options.completed || options.cancelled) return null
  const days = daysUntilDue(dueDate)
  if (days === null) return null
  if (days < 0) {
    const n = Math.abs(days)
    return `Vencido hace ${n} día${n === 1 ? '' : 's'}`
  }
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Falta 1 día'
  return `Faltan ${days} días`
}

/** Porcentaje de tiempo consumido entre inicio y fin (0–100). */
export function calendarTimeElapsedPercent(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  today: CalendarDate = todayCalendarDate(),
): number | null {
  const start = normalizeCalendarDate(startDate)
  const end = normalizeCalendarDate(endDate)
  if (!start || !end) return null
  const total = calendarDaysBetween(start, end)
  if (total <= 0) return total === 0 ? 100 : null
  const elapsed = calendarDaysBetween(start, today)
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
}

// ── Tiempo relativo ───────────────────────────────────────────────────────────

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

export function formatRelativeTime(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const diff = nowMs - then
  if (diff < 0) return formatInstantDateTime(iso)

  if (diff < 45_000) return 'Justo ahora'

  const minutes = Math.floor(diff / MINUTE)
  if (minutes < 60) {
    return minutes === 1 ? 'Hace 1 minuto' : `Hace ${minutes} minutos`
  }

  const hours = Math.floor(diff / HOUR)
  if (hours < 24) {
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`
  }

  const today = todayCalendarDate()
  const thenDate = instantToCalendarDate(iso)
  const daysBetween = calendarDaysBetween(thenDate, today)

  if (daysBetween === 1) return 'Ayer'

  const days = Math.floor(diff / DAY)
  if (days < 7) return days === 1 ? 'Hace 1 día' : `Hace ${days} días`
  if (days < 15) return `Hace ${days} días`
  if (days < 30) return 'Hace 15 días'

  const months = Math.floor(days / 30)
  if (months < 12) {
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`
  }

  const years = Math.floor(days / 365)
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`
}

// ── Gráficos / series temporales ─────────────────────────────────────────────

export interface DayChartPoint {
  key: CalendarDate
  label: string
  value: number
}

/** Últimos N días de calendario en Colombia, de más antiguo a más reciente. */
export function lastCalendarDays(
  count: number,
  today: CalendarDate = todayCalendarDate(),
): Array<{ key: CalendarDate; label: string }> {
  const points: Array<{ key: CalendarDate; label: string }> = []
  const { y, m, d } = parseParts(today)

  for (let i = count - 1; i >= 0; i--) {
    const ms = utcMs(y, m, d) - i * 86_400_000
    const date = new Date(ms)
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
      weekday: 'short',
    }).format(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)))
    points.push({ key, label })
  }

  return points
}
