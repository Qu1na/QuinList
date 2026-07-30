/** Tables introduced in docs/migration-collaboration.sql */
export const OPTIONAL_MODULE_TABLES = [] as const

export const COLLABORATION_TABLES = ['project_task_comments', 'project_presence'] as const

const STORAGE_KEY = 'quinlist_matu_missing_tables'
/** Re-check missing tables after this interval (e.g. after running migration). */
const MISSING_RETRY_MS = 5 * 60 * 1000

interface MissingTableEntry {
  table: string
  at: number
}

const missingTables = new Set<string>()
const warnedTables = new Set<string>()

function loadPersistedMissing(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const now = Date.now()
    const entries = JSON.parse(raw) as MissingTableEntry[]
    for (const entry of entries) {
      if (now - entry.at < MISSING_RETRY_MS) {
        missingTables.add(entry.table)
      }
    }
  } catch {
    /* ignore */
  }
}

function persistMissing(): void {
  const entries: MissingTableEntry[] = [...missingTables].map((table) => ({
    table,
    at: Date.now(),
  }))
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

loadPersistedMissing()

export function isMissingTableError(message: string): boolean {
  return /table does not exist|relation .* does not exist|404/i.test(message)
}

export function markTableMissing(table: string): void {
  if (missingTables.has(table)) return
  missingTables.add(table)
  persistMissing()
  if (warnedTables.has(table)) return
  warnedTables.add(table)
  console.warn(
    `[MatuDB] La tabla "${table}" no existe. Ejecuta docs/migration-chat-complete.sql en la consola SQL de tu proyecto MatuDB y recarga la página.`,
  )
}

export function clearTableMissing(table: string): void {
  if (!missingTables.delete(table)) return
  persistMissing()
}

export function clearMissingTablesCache(): void {
  missingTables.clear()
  warnedTables.clear()
  sessionStorage.removeItem(STORAGE_KEY)
}

export function isTableMissing(table: string): boolean {
  return missingTables.has(table)
}

export function isCollaborationTable(table: string): boolean {
  return (COLLABORATION_TABLES as readonly string[]).includes(table)
}

export function isOptionalModuleTable(table: string): boolean {
  return (OPTIONAL_MODULE_TABLES as readonly string[]).includes(table)
}

export function isGracefulMissingTable(table: string): boolean {
  return isCollaborationTable(table) || isOptionalModuleTable(table)
}

export function collaborationTablesForRealtime(): string[] {
  return COLLABORATION_TABLES.filter((table) => !isTableMissing(table))
}
