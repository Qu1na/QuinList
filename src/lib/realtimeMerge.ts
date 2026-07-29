/** Compara timestamps de filas MatuDB (snake_case) con entidades locales. */
export function rowTimestamp(row: Record<string, unknown> | undefined): number {
  if (!row) return 0
  const raw = row.updated_at ?? row.updatedAt ?? row.created_at ?? row.createdAt
  if (!raw) return 0
  const ts = new Date(String(raw)).getTime()
  return Number.isFinite(ts) ? ts : 0
}

export function entityTimestamp(entity: { updatedAt?: string; createdAt?: string }): number {
  if (entity.updatedAt) {
    const ts = new Date(entity.updatedAt).getTime()
    if (Number.isFinite(ts)) return ts
  }
  if (entity.createdAt) {
    const ts = new Date(entity.createdAt).getTime()
    if (Number.isFinite(ts)) return ts
  }
  return 0
}

/** Solo aplicar realtime si el servidor trae un estado igual o más reciente. */
export function isServerRowNewer(
  incoming: Record<string, unknown>,
  local: { updatedAt?: string; createdAt?: string },
): boolean {
  const inTs = rowTimestamp(incoming)
  const localTs = entityTimestamp(local)
  if (inTs === 0) return true
  if (localTs === 0) return true
  return inTs >= localTs
}
