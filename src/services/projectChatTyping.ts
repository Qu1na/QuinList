import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { matuRealtimeTableChannel } from '@/lib/matuRealtime'
import { clearTableMissing, isMissingTableError, isTableMissing, markTableMissing } from '@/lib/matuTables'

export interface ChatTypingUser {
  userId: string
  updatedAt: string
}

const TYPING_STALE_MS = 4000

function useLocalTyping(): boolean {
  return !isMatuConfigured() || isTableMissing('project_chat_typing')
}

function isConflictError(message: string): boolean {
  return /409|conflict|duplicate|already exists/i.test(message)
}

export async function setProjectChatTyping(projectId: string, userId: string): Promise<void> {
  if (useLocalTyping()) return
  const db = getMatuClient()
  const row = { project_id: projectId, user_id: userId, updated_at: new Date().toISOString() }
  const { data: existing } = await db
    .from('project_chat_typing')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('project_chat_typing')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .update(row)
    if (error && isMissingTableError(error.message)) markTableMissing('project_chat_typing')
    return
  }

  const { error } = await db.from('project_chat_typing').insert(row)
  if (!error) return
  if (isMissingTableError(error.message)) {
    markTableMissing('project_chat_typing')
    return
  }
  if (isConflictError(error.message)) {
    await db
      .from('project_chat_typing')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .update(row)
      .catch(() => {})
  }
}

export async function clearProjectChatTyping(projectId: string, userId: string): Promise<void> {
  if (useLocalTyping()) return
  const db = getMatuClient()
  const { error } = await db
    .from('project_chat_typing')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .delete()
  if (error && isMissingTableError(error.message)) markTableMissing('project_chat_typing')
}

export async function loadProjectChatTyping(projectId: string): Promise<ChatTypingUser[]> {
  if (useLocalTyping()) return []
  const db = getMatuClient()
  const { data, error } = await db.from('project_chat_typing').select('*').eq('project_id', projectId)
  if (error) {
    if (isMissingTableError(error.message)) {
      markTableMissing('project_chat_typing')
      return []
    }
    return []
  }
  const now = Date.now()
  return ((data as { user_id: string; updated_at: string }[]) ?? [])
    .filter((r) => now - new Date(r.updated_at).getTime() < TYPING_STALE_MS)
    .map((r) => ({ userId: r.user_id, updatedAt: r.updated_at }))
}

export function subscribeProjectChatTyping(
  projectId: string,
  onChange: () => void,
): () => void {
  if (useLocalTyping()) return () => {}
  const db = getMatuClient()
  const channel = db
    .channel(matuRealtimeTableChannel('project_chat_typing'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'project_chat_typing' }, () => {
      onChange()
    })
    .subscribe()
  return () => db.removeChannel(channel)
}
