/** MatuDB/PostgreSQL JSONB helpers — arrays must be JSON.stringify'd on write. */

export function toJsonb(value: unknown, fallback: unknown = []): string {
  if (value === null || value === undefined) {
    return JSON.stringify(fallback)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return JSON.stringify(fallback)
    try {
      JSON.parse(trimmed)
      return trimmed
    } catch {
      return JSON.stringify(value)
    }
  }
  return JSON.stringify(value)
}

/** JSONB nullable column — returns null instead of stringifying null. */
export function toJsonbOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return toJsonb(value)
}

export function fromJsonb<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    try {
      return JSON.parse(trimmed) as T
    } catch {
      return fallback
    }
  }
  return value as T
}
