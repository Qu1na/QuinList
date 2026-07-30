import type { ChatAttachment } from '@/types'
import type { ChatMessageStatus, ChatReadReceipt } from '@/types/chat'
import type { ProjectChatMessage } from '@/types/projects'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { fromJsonb, toJsonb, toJsonbOrNull } from '@/lib/dbJson'
import { generateId } from '@/utils/permissions'
import { useAuthStore } from '@/stores/auth'
import { registerChatFileInProject } from '@/services/projectChatFiles'
import { matuRealtimeTableChannel } from '@/lib/matuRealtime'
import { isMissingTableError, markTableMissing } from '@/lib/matuTables'

interface DbProjectChatMessage {
  id: string
  project_id: string
  user_id: string
  text: string
  attachment?: string | ChatAttachment | null
  mention_ids?: string[] | string | null
  status?: string | null
  read_by?: ChatReadReceipt[] | string | null
  edited_at?: string | null
  deleted_at?: string | null
  created_at: string
}

export type ProjectChatRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

function parseAttachment(raw: DbProjectChatMessage['attachment']): ChatAttachment | null {
  if (!raw) return null
  if (typeof raw === 'object' && 'url' in raw) return raw as ChatAttachment
  return fromJsonb<ChatAttachment | null>(raw, null)
}

function parseMentionIds(raw: DbProjectChatMessage['mention_ids']): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
  return fromJsonb<string[]>(raw, [])
}

function parseReadBy(raw: DbProjectChatMessage['read_by']): ChatReadReceipt[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((x) => x && typeof x.userId === 'string')
  return fromJsonb<ChatReadReceipt[]>(raw, [])
}

function parseStatus(raw: DbProjectChatMessage['status']): ChatMessageStatus {
  if (raw === 'sending' || raw === 'sent' || raw === 'delivered' || raw === 'read') return raw
  return 'sent'
}

export function rowToProjectChatMessage(row: DbProjectChatMessage): ProjectChatMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    text: row.text ?? '',
    mentionIds: parseMentionIds(row.mention_ids),
    createdAt: row.created_at,
    attachment: parseAttachment(row.attachment),
    status: parseStatus(row.status),
    readBy: parseReadBy(row.read_by),
    editedAt: row.edited_at ?? null,
    deletedAt: row.deleted_at ?? null,
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

export async function loadProjectChatMessages(projectId: string): Promise<ProjectChatMessage[]> {
  if (!isMatuConfigured()) return []

  const db = getMatuClient()
  const { data, error } = await db
    .from('project_chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    if (isMissingTableError(error.message)) {
      markTableMissing('project_chat_messages')
    }
    console.warn('[projectChat] No disponible:', error.message)
    return []
  }

  const messages = ((data as DbProjectChatMessage[]) ?? []).map(rowToProjectChatMessage)
  await Promise.all([...new Set(messages.map((m) => m.userId))].map(ensureUserProfile))
  return messages
}

export async function sendProjectChatMessage(
  projectId: string,
  userId: string,
  text: string,
  mentionIds: string[] = [],
  file?: File | null,
): Promise<ProjectChatMessage> {
  if (!isMatuConfigured()) {
    throw new Error('El chat del proyecto requiere conexión a la base de datos')
  }

  const trimmed = text.trim()
  let attachment: ChatAttachment | null = null

  if (file) {
    attachment = await registerChatFileInProject(projectId, file)
  }

  if (!trimmed && !attachment) {
    throw new Error('Escribe un mensaje o adjunta un archivo')
  }

  const message: ProjectChatMessage = {
    id: generateId(),
    projectId,
    userId,
    text: trimmed,
    mentionIds,
    createdAt: new Date().toISOString(),
    attachment,
    status: 'delivered',
    readBy: [],
  }

  const db = getMatuClient()
  const baseRow = {
    id: message.id,
    project_id: message.projectId,
    user_id: message.userId,
    text: message.text,
    mention_ids: toJsonb(mentionIds, []),
    attachment: toJsonbOrNull(attachment),
    created_at: message.createdAt,
  }

  let { error } = await db.from('project_chat_messages').insert({
    ...baseRow,
    status: 'delivered',
    read_by: toJsonb([], []),
  })

  if (error && /column.*status|column.*read_by/i.test(error.message)) {
    ;({ error } = await db.from('project_chat_messages').insert(baseRow))
  }

  if (error) throw new Error(error.message)

  return message
}

export function subscribeProjectChatRealtime(
  projectId: string,
  onEvent: (event: ProjectChatRealtimeEvent, message: ProjectChatMessage) => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()

  const handle = (payload: { action?: string; data?: DbProjectChatMessage }) => {
    const row = payload.data
    if (!row || row.project_id !== projectId) return
    const event = (payload.action ?? 'INSERT') as ProjectChatRealtimeEvent
    onEvent(event, rowToProjectChatMessage(row))
  }

  const channel = db
    .channel(matuRealtimeTableChannel('project_chat_messages'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_chat_messages' }, handle)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_chat_messages' }, handle)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'project_chat_messages' }, handle)
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}
