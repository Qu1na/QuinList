import type { BoardPresence, BoardPresenceStatus } from '@/types'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'

interface DbBoardPresence {
  board_id: string
  user_id: string
  status: BoardPresenceStatus
  activity: string | null
  last_seen: string
  updated_at: string
}

export type PresenceRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

const LOCAL_KEY = 'quinlist_board_presence'
const STALE_MS = 45_000

function loadLocal(): Record<string, BoardPresence[]> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as Record<string, BoardPresence[]>
  } catch {
    /* ignore */
  }
  return {}
}

function saveLocal(data: Record<string, BoardPresence[]>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

function rowToPresence(row: DbBoardPresence): BoardPresence {
  return {
    boardId: row.board_id,
    userId: row.user_id,
    status: row.status === 'editing' ? 'editing' : 'online',
    activity: row.activity ?? '',
    lastSeen: row.last_seen,
    updatedAt: row.updated_at,
  }
}

export function isPresenceActive(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < STALE_MS
}

export async function loadBoardPresence(boardId: string): Promise<BoardPresence[]> {
  if (!isMatuConfigured()) {
    return (loadLocal()[boardId] ?? []).filter((p) => isPresenceActive(p.lastSeen))
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_presence')
    .select('*')
    .eq('board_id', boardId)

  if (error) throw new Error(error.message)

  return ((data as DbBoardPresence[]) ?? [])
    .map(rowToPresence)
    .filter((p) => isPresenceActive(p.lastSeen))
}

export async function upsertBoardPresence(
  boardId: string,
  userId: string,
  status: BoardPresenceStatus,
  activity = '',
): Promise<BoardPresence> {
  const now = new Date().toISOString()
  const presence: BoardPresence = {
    boardId,
    userId,
    status,
    activity,
    lastSeen: now,
    updatedAt: now,
  }

  if (!isMatuConfigured()) {
    const all = loadLocal()
    const list = all[boardId] ?? []
    const idx = list.findIndex((p) => p.userId === userId)
    if (idx === -1) list.push(presence)
    else list[idx] = presence
    all[boardId] = list
    saveLocal(all)
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_KEY }))
    return presence
  }

  const db = getMatuClient()
  const row = {
    board_id: boardId,
    user_id: userId,
    status,
    activity,
    last_seen: now,
    updated_at: now,
  }

  const { data: existing, error: findErr } = await db
    .from('board_presence')
    .select('board_id')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)

  if (existing) {
    const { error } = await db
      .from('board_presence')
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .update(row)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await db.from('board_presence').insert(row)
    if (error) throw new Error(error.message)
  }

  return presence
}

export async function removeBoardPresence(boardId: string, userId: string): Promise<void> {
  if (!isMatuConfigured()) {
    const all = loadLocal()
    if (all[boardId]) {
      all[boardId] = all[boardId]!.filter((p) => p.userId !== userId)
      saveLocal(all)
      window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_KEY }))
    }
    return
  }

  const db = getMatuClient()
  const { error } = await db
    .from('board_presence')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .delete()

  if (error) throw new Error(error.message)
}

export function subscribeBoardPresenceRealtime(
  boardId: string,
  onEvent: (event: PresenceRealtimeEvent, presence: BoardPresence) => void,
): () => void {
  if (!isMatuConfigured()) {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCAL_KEY) return
      const list = loadLocal()[boardId] ?? []
      for (const p of list) {
        if (isPresenceActive(p.lastSeen)) onEvent('UPDATE', p)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  const db = getMatuClient()

  const handle = (payload: { action?: string; data?: DbBoardPresence }) => {
    const row = payload.data
    if (!row || row.board_id !== boardId) return
    const event = (payload.action ?? 'INSERT') as PresenceRealtimeEvent
    onEvent(event, rowToPresence(row))
  }

  const channel = db
    .channel('board_presence')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_presence' }, handle)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'board_presence' }, handle)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'board_presence' }, handle)
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}
