import type { BoardMessage, ChatAttachment } from '@/types'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { fromJsonb, toJsonb, toJsonbOrNull } from '@/lib/dbJson'
import { generateId } from '@/utils/permissions'
import { useAuthStore } from '@/stores/auth'
import { uploadChatFile, validateChatFile } from '@/services/storage'

interface DbBoardMessage {
  id: string
  board_id: string
  user_id: string
  text: string
  attachment?: string | ChatAttachment | null
  created_at: string
}

export type ChatRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

const LOCAL_KEY = 'quinlist_board_messages'

function loadLocal(): Record<string, BoardMessage[]> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as Record<string, BoardMessage[]>
  } catch {
    /* ignore */
  }
  return {}
}

function saveLocal(data: Record<string, BoardMessage[]>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

function parseAttachment(raw: DbBoardMessage['attachment']): ChatAttachment | null {
  if (!raw) return null
  if (typeof raw === 'object' && 'url' in raw) return raw as ChatAttachment
  return fromJsonb<ChatAttachment | null>(raw, null)
}

export function rowToMessage(row: DbBoardMessage): BoardMessage {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    text: row.text ?? '',
    createdAt: row.created_at,
    attachment: parseAttachment(row.attachment),
  }
}

export async function ensureUserProfile(userId: string): Promise<void> {
  if (!isMatuConfigured()) return
  const auth = useAuthStore()
  if (auth.getUserById(userId)) return

  const db = getMatuClient()
  const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!data) return

  const row = data as { id: string; name: string; email: string; avatar: string; initials: string }
  auth.addUser({
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? '',
    initials: row.initials,
  })
}

export async function loadBoardMessages(boardId: string): Promise<BoardMessage[]> {
  if (!isMatuConfigured()) {
    return loadLocal()[boardId] ?? []
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_messages')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.warn('Chat no disponible:', error.message)
    return []
  }

  const messages = ((data as DbBoardMessage[]) ?? []).map(rowToMessage)
  await Promise.all([...new Set(messages.map((m) => m.userId))].map(ensureUserProfile))
  return messages
}

export async function sendBoardMessage(
  boardId: string,
  userId: string,
  text: string,
  file?: File | null,
  mentionIds: string[] = [],
): Promise<BoardMessage> {
  const trimmed = text.trim()
  let attachment: ChatAttachment | null = null

  if (file) {
    validateChatFile(file)
    attachment = await uploadChatFile(boardId, file)
  }

  if (!trimmed && !attachment) {
    throw new Error('Escribe un mensaje o adjunta un archivo')
  }

  const message: BoardMessage = {
    id: generateId(),
    boardId,
    userId,
    text: trimmed,
    createdAt: new Date().toISOString(),
    attachment,
  }

  if (!isMatuConfigured()) {
    const local = loadLocal()
    const list = local[boardId] ?? []
    list.push(message)
    local[boardId] = list
    saveLocal(local)
    return message
  }

  const db = getMatuClient()
  const { error } = await db.from('board_messages').insert({
    id: message.id,
    board_id: message.boardId,
    user_id: message.userId,
    text: message.text,
    attachment: toJsonbOrNull(attachment),
    mention_ids: toJsonb(mentionIds, []),
    created_at: message.createdAt,
  })
  if (error) throw new Error(error.message)

  return message
}

export function subscribeBoardChatRealtime(
  boardId: string,
  onEvent: (event: ChatRealtimeEvent, message: BoardMessage) => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()

  const handle = (payload: { action?: string; data?: DbBoardMessage }) => {
    const row = payload.data
    if (!row || row.board_id !== boardId) return

    const event = (payload.action ?? 'INSERT') as ChatRealtimeEvent
    onEvent(event, rowToMessage(row))
  }

  const channel = db
    .channel('board_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_messages' }, handle)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'board_messages' }, handle)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'board_messages' }, handle)
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}
