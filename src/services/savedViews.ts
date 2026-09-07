import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { SavedView } from '@/types/v3'

const KEY = 'quinlist_saved_views'

function loadLocal(): SavedView[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedView[]
  } catch {
    return []
  }
}

function saveLocal(value: SavedView[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(value))
}

export async function listViews(userId: string, workspaceId?: string): Promise<SavedView[]> {
  if (!isMatuConfigured()) {
    return loadLocal().filter((v) => v.userId === userId && (!workspaceId || v.workspaceId === workspaceId))
  }
  const db = getMatuClient()
  let query = db.from('saved_views').select('*').eq('user_id', userId)
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToView)
}

export async function createView(input: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedView> {
  const now = new Date().toISOString()
  const view: SavedView = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal()
    all.push(view)
    saveLocal(all)
    return view
  }
  const db = getMatuClient()
  const { error } = await db.from('saved_views').insert(viewToRow(view))
  if (error) throw new Error(error.message)
  return view
}

export async function deleteView(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(loadLocal().filter((v) => v.id !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('saved_views').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

function rowToView(row: Record<string, unknown>): SavedView {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    name: String(row.name ?? ''),
    entityType: (row.entity_type as SavedView['entityType']) ?? 'card',
    filters: (row.filters as Record<string, unknown>) ?? {},
    sort: (row.sort as Record<string, unknown>) ?? {},
    isShared: Boolean(row.is_shared),
    position: Number(row.position ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function viewToRow(v: SavedView): Record<string, unknown> {
  return {
    id: v.id,
    user_id: v.userId,
    workspace_id: v.workspaceId,
    name: v.name,
    entity_type: v.entityType,
    filters: v.filters,
    sort: v.sort,
    is_shared: v.isShared,
    position: v.position,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }
}