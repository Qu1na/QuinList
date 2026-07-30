import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { fromJsonb, toJsonb } from '@/lib/dbJson'
import { matuRealtimeTableChannel } from '@/lib/matuRealtime'
import { clearTableMissing, isMissingTableError, isTableMissing, markTableMissing } from '@/lib/matuTables'
import type { ChatReadReceipt } from '@/types/chat'

function useLocalRead(): boolean {
  return !isMatuConfigured() || isTableMissing('project_chat_read_state')
}

export async function markProjectChatRead(
  projectId: string,
  userId: string,
  lastMessageId: string | null,
): Promise<void> {
  if (!lastMessageId) return
  const now = new Date().toISOString()

  if (useLocalRead()) return

  const db = getMatuClient()
  const stateRow = {
    project_id: projectId,
    user_id: userId,
    last_read_at: now,
    last_read_message_id: lastMessageId,
  }

  const { data: existing } = await db
    .from('project_chat_read_state')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('project_chat_read_state')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .update(stateRow)
    if (error && isMissingTableError(error.message)) markTableMissing('project_chat_read_state')
  } else {
    const { error } = await db.from('project_chat_read_state').insert(stateRow)
    if (error && isMissingTableError(error.message)) markTableMissing('project_chat_read_state')
  }

  const { data: msg } = await db
    .from('project_chat_messages')
    .select('id, read_by, user_id')
    .eq('id', lastMessageId)
    .maybeSingle()

  if (!msg) return
  const row = msg as { id: string; read_by: unknown; user_id: string }
  if (row.user_id === userId) return

  const readBy = fromJsonb<ChatReadReceipt[]>(row.read_by, [])
  if (readBy.some((r) => r.userId === userId)) return

  readBy.push({ userId, readAt: now })
  await db.from('project_chat_messages').eq('id', lastMessageId).update({ read_by: toJsonb(readBy, []) })
  clearTableMissing('project_chat_read_state')
}

export function subscribeProjectChatReadState(
  projectId: string,
  onChange: () => void,
): () => void {
  if (useLocalRead()) return () => {}
  const db = getMatuClient()
  const channel = db
    .channel(matuRealtimeTableChannel('project_chat_read_state'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'project_chat_read_state' }, () => {
      onChange()
    })
    .subscribe()
  return () => db.removeChannel(channel)
}
