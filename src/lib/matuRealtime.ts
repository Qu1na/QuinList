import type { RealtimeChangePayload } from '@/types/collaboration'

/**
 * MatuDB matuclient maps channel name → socket room table by stripping only the first `prefix:`.
 * Always use the real PostgreSQL table name as the channel (e.g. `project_tasks`, not `quinlist:project_tasks`).
 */
export function matuRealtimeTableChannel(table: string): string {
  return table
}

export function matuRealtimeRow(
  raw: Record<string, unknown>,
  event: string,
): Record<string, unknown> | undefined {
  const row = (raw.new ?? raw.data ?? raw.record) as Record<string, unknown> | undefined
  const oldRow = (raw.old ?? raw.previous ?? raw.old_data) as Record<string, unknown> | undefined
  if (event === 'DELETE') return oldRow ?? row
  return row
}

export function rowProjectId(row: Record<string, unknown> | undefined): string | null {
  if (!row) return null
  const v = row.project_id ?? row.projectId
  return typeof v === 'string' ? v : null
}

export function rowBelongsToProject(
  row: Record<string, unknown> | undefined,
  projectId: string,
  table: string,
): boolean {
  if (!row) return false
  if (table === 'projects') return String(row.id) === projectId
  return rowProjectId(row) === projectId
}

export function payloadBelongsToProject(payload: RealtimeChangePayload, projectId: string): boolean {
  const row = payload.event === 'DELETE' ? (payload.old ?? payload.new) : payload.new
  return rowBelongsToProject(row, projectId, payload.table)
}

export function rowBoardId(row: Record<string, unknown> | undefined): string | null {
  if (!row) return null
  const v = row.board_id ?? row.boardId
  return typeof v === 'string' ? v : null
}

export function rowBelongsToBoard(
  row: Record<string, unknown> | undefined,
  boardId: string,
): boolean {
  if (!row) return false
  return rowBoardId(row) === boardId
}

export function rowUserId(row: Record<string, unknown> | undefined): string | null {
  if (!row) return null
  const v = row.user_id ?? row.userId
  return typeof v === 'string' ? v : null
}
