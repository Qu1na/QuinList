import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { Reaction } from '@/types/v3'

const KEY = 'quinlist_reactions'

function loadLocal(): Reaction[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Reaction[]
  } catch {
    return []
  }
}

function saveLocal(value: Reaction[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(value))
}

export async function listForEntity(entityType: Reaction['entityType'], entityId: string): Promise<Reaction[]> {
  if (!isMatuConfigured()) {
    return loadLocal().filter((r) => r.entityType === entityType && r.entityId === entityId)
  }
  const db = getMatuClient()
  const { data, error } = await db
    .from('reactions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToReaction)
}

export async function toggleReaction(input: {
  entityType: Reaction['entityType']
  entityId: string
  userId: string
  emoji: string
}): Promise<{ added: boolean; reaction: Reaction | null }> {
  if (!isMatuConfigured()) {
    const all = loadLocal()
    const idx = all.findIndex(
      (r) => r.entityType === input.entityType && r.entityId === input.entityId && r.userId === input.userId && r.emoji === input.emoji,
    )
    if (idx >= 0) {
      all.splice(idx, 1)
      saveLocal(all)
      return { added: false, reaction: null }
    }
    const r: Reaction = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() }
    all.push(r)
    saveLocal(all)
    return { added: true, reaction: r }
  }
  const db = getMatuClient()
  const { data: existing } = await db
    .from('reactions')
    .select('id')
    .eq('entity_type', input.entityType)
    .eq('entity_id', input.entityId)
    .eq('user_id', input.userId)
    .eq('emoji', input.emoji)
    .maybeSingle()
  if (existing) {
    const { error } = await db.from('reactions').eq('id', existing.id).delete()
    if (error) throw new Error(error.message)
    return { added: false, reaction: null }
  }
  const { error } = await db
    .from('reactions')
    .insert({ entity_type: input.entityType, entity_id: input.entityId, user_id: input.userId, emoji: input.emoji })
  if (error) throw new Error(error.message)
  const r: Reaction = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() }
  return { added: true, reaction: r }
}

/** Agrupa reacciones por emoji con conteo y lista de usuarios. */
export function summarizeReactions(reactions: Reaction[]): Array<{ emoji: string; count: number; userIds: string[] }> {
  const map = new Map<string, { count: number; userIds: string[] }>()
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { count: 0, userIds: [] }
    entry.count += 1
    entry.userIds.push(r.userId)
    map.set(r.emoji, entry)
  }
  return Array.from(map.entries())
    .map(([emoji, v]) => ({ emoji, count: v.count, userIds: v.userIds }))
    .sort((a, b) => b.count - a.count)
}

function rowToReaction(row: Record<string, unknown>): Reaction {
  return {
    id: String(row.id),
    entityType: (row.entity_type as Reaction['entityType']) ?? 'project_chat_message',
    entityId: String(row.entity_id),
    userId: String(row.user_id),
    emoji: String(row.emoji),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

export const QUICK_REACTIONS = ['👍', '🎉', '❤️', '🚀', '👀', '✅', '🔥', '🤔']