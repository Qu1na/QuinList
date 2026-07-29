import type { ProjectPresence, ProjectPresenceStatus } from '@/types/collaboration'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { clearTableMissing, isMissingTableError, isTableMissing, markTableMissing } from '@/lib/matuTables'

interface DbProjectPresence {
  project_id: string
  user_id: string
  status: ProjectPresenceStatus
  activity: string | null
  last_seen: string
  updated_at: string
}

export type ProjectPresenceEvent = 'INSERT' | 'UPDATE' | 'DELETE'

const LOCAL_KEY = 'quinlist_project_presence'
const STALE_MS = 45_000

function loadLocal(): Record<string, ProjectPresence[]> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as Record<string, ProjectPresence[]>
  } catch {
    /* ignore */
  }
  return {}
}

function saveLocal(data: Record<string, ProjectPresence[]>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

function useLocalPresence(): boolean {
  return !isMatuConfigured() || isTableMissing('project_presence')
}

function rowToPresence(row: DbProjectPresence): ProjectPresence {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    status: row.status === 'editing' ? 'editing' : 'online',
    activity: row.activity ?? '',
    lastSeen: row.last_seen,
    updatedAt: row.updated_at,
  }
}

export function isProjectPresenceActive(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < STALE_MS
}

export async function loadProjectPresence(projectId: string): Promise<ProjectPresence[]> {
  if (useLocalPresence()) {
    return (loadLocal()[projectId] ?? []).filter((p) => isProjectPresenceActive(p.lastSeen))
  }

  const db = getMatuClient()
  const { data, error } = await db.from('project_presence').select('*').eq('project_id', projectId)

  if (error) {
    if (isMissingTableError(error.message)) {
      markTableMissing('project_presence')
      return (loadLocal()[projectId] ?? []).filter((p) => isProjectPresenceActive(p.lastSeen))
    }
    throw new Error(error.message)
  }

  clearTableMissing('project_presence')
  return ((data as DbProjectPresence[]) ?? [])
    .map(rowToPresence)
    .filter((p) => isProjectPresenceActive(p.lastSeen))
}

export async function upsertProjectPresence(
  projectId: string,
  userId: string,
  status: ProjectPresenceStatus,
  activity = '',
): Promise<ProjectPresence> {
  const now = new Date().toISOString()
  const presence: ProjectPresence = {
    projectId,
    userId,
    status,
    activity,
    lastSeen: now,
    updatedAt: now,
  }

  if (useLocalPresence()) {
    const all = loadLocal()
    const list = all[projectId] ?? []
    const idx = list.findIndex((p) => p.userId === userId)
    if (idx === -1) list.push(presence)
    else list[idx] = presence
    all[projectId] = list
    saveLocal(all)
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_KEY }))
    return presence
  }

  const db = getMatuClient()
  const row = {
    project_id: projectId,
    user_id: userId,
    status,
    activity,
    last_seen: now,
    updated_at: now,
  }

  const { data: existing, error: findErr } = await db
    .from('project_presence')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (findErr) {
    if (isMissingTableError(findErr.message)) {
      markTableMissing('project_presence')
      return upsertProjectPresence(projectId, userId, status, activity)
    }
    throw new Error(findErr.message)
  }

  if (existing) {
    const { error } = await db
      .from('project_presence')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .update(row)
    if (error) {
      if (isMissingTableError(error.message)) {
        markTableMissing('project_presence')
        return upsertProjectPresence(projectId, userId, status, activity)
      }
      throw new Error(error.message)
    }
  } else {
    const { error } = await db.from('project_presence').insert(row)
    if (error) {
      if (isMissingTableError(error.message)) {
        markTableMissing('project_presence')
        return upsertProjectPresence(projectId, userId, status, activity)
      }
      throw new Error(error.message)
    }
  }

  clearTableMissing('project_presence')
  return presence
}

export async function removeProjectPresence(projectId: string, userId: string): Promise<void> {
  if (useLocalPresence()) {
    const all = loadLocal()
    if (all[projectId]) {
      all[projectId] = all[projectId]!.filter((p) => p.userId !== userId)
      saveLocal(all)
      window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_KEY }))
    }
    return
  }

  const db = getMatuClient()
  const { error } = await db
    .from('project_presence')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .delete()

  if (error) {
    if (isMissingTableError(error.message)) {
      markTableMissing('project_presence')
      return removeProjectPresence(projectId, userId)
    }
    throw new Error(error.message)
  }
}

export function subscribeProjectPresenceRealtime(
  projectId: string,
  onEvent: (event: ProjectPresenceEvent, presence: ProjectPresence) => void,
): () => void {
  if (useLocalPresence()) {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCAL_KEY) return
      const list = loadLocal()[projectId] ?? []
      for (const p of list) {
        if (isProjectPresenceActive(p.lastSeen)) onEvent('UPDATE', p)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  const db = getMatuClient()

  const handle = (payload: { action?: string; data?: DbProjectPresence }) => {
    const row = payload.data
    if (!row || row.project_id !== projectId) return
    const event = (payload.action ?? 'INSERT') as ProjectPresenceEvent
    onEvent(event, rowToPresence(row))
  }

  const channel = db
    .channel('project_presence')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_presence' }, handle)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_presence' }, handle)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'project_presence' }, handle)
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}
