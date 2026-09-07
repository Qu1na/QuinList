import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { WorkspaceEvent, EventAttendee } from '@/types/v3'

const EVENTS_KEY = 'quinlist_events'
const ATTENDEES_KEY = 'quinlist_event_attendees'

function loadLocal<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function saveLocal<T>(key: string, value: T[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export async function listEvents(workspaceId: string): Promise<WorkspaceEvent[]> {
  if (!isMatuConfigured()) return loadLocal<WorkspaceEvent>(EVENTS_KEY).filter((e) => e.workspaceId === workspaceId)
  const db = getMatuClient()
  const { data, error } = await db.from('workspace_events').select('*').eq('workspace_id', workspaceId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToEvent)
}

export async function getEvent(id: string): Promise<WorkspaceEvent | null> {
  if (!isMatuConfigured()) {
    const all = loadLocal<WorkspaceEvent>(EVENTS_KEY)
    return all.find((e) => e.id === id) ?? null
  }
  const db = getMatuClient()
  const { data, error } = await db.from('workspace_events').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToEvent(data) : null
}

export async function createEvent(input: Omit<WorkspaceEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceEvent> {
  const now = new Date().toISOString()
  const event: WorkspaceEvent = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal<WorkspaceEvent>(EVENTS_KEY)
    all.push(event)
    saveLocal(EVENTS_KEY, all)
    return event
  }
  const db = getMatuClient()
  const { error } = await db.from('workspace_events').insert(eventToRow(event))
  if (error) throw new Error(error.message)
  return event
}

export async function updateEvent(id: string, updates: Partial<WorkspaceEvent>): Promise<WorkspaceEvent> {
  if (!isMatuConfigured()) {
    const all = loadLocal<WorkspaceEvent>(EVENTS_KEY)
    const idx = all.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Evento no encontrado')
    const next: WorkspaceEvent = { ...all[idx]!, ...updates, id, updatedAt: new Date().toISOString() }
    all[idx] = next
    saveLocal(EVENTS_KEY, all)
    return next
  }
  const db = getMatuClient()
  const { data, error } = await db.from('workspace_events').eq('id', id).update(eventToRow({ ...updates, updatedAt: new Date().toISOString() } as WorkspaceEvent))
  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) throw new Error('No se pudo actualizar el evento')
  return rowToEvent(row)
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(EVENTS_KEY, loadLocal<WorkspaceEvent>(EVENTS_KEY).filter((e) => e.id !== id))
    saveLocal(ATTENDEES_KEY, loadLocal<EventAttendee>(ATTENDEES_KEY).filter((a) => a.eventId !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('workspace_events').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

export async function listAttendees(eventId: string): Promise<EventAttendee[]> {
  if (!isMatuConfigured()) return loadLocal<EventAttendee>(ATTENDEES_KEY).filter((a) => a.eventId === eventId)
  const db = getMatuClient()
  const { data, error } = await db.from('event_attendees').select('*').eq('event_id', eventId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToAttendee)
}

export async function rsvpEvent(eventId: string, userId: string, response: EventAttendee['response']): Promise<EventAttendee> {
  const now = new Date().toISOString()
  if (!isMatuConfigured()) {
    const all = loadLocal<EventAttendee>(ATTENDEES_KEY)
    const idx = all.findIndex((a) => a.eventId === eventId && a.userId === userId)
    const att: EventAttendee = {
      id: idx >= 0 ? all[idx]!.id : crypto.randomUUID(),
      eventId,
      userId,
      response,
      notified: false,
      createdAt: idx >= 0 ? all[idx]!.createdAt : now,
    }
    if (idx >= 0) all[idx] = att
    else all.push(att)
    saveLocal(ATTENDEES_KEY, all)
    return att
  }
  const db = getMatuClient()
  const { data: existing } = await db.from('event_attendees').select('id').eq('event_id', eventId).eq('user_id', userId).maybeSingle()
  if (existing) {
    const { data, error } = await db.from('event_attendees').eq('id', existing.id).update({ response })
    if (error) throw new Error(error.message)
    const row = data?.[0] ?? { id: existing.id, event_id: eventId, user_id: userId, response, notified: false, created_at: now }
    return rowToAttendee(row)
  }
  const { data, error } = await db.from('event_attendees').insert({ event_id: eventId, user_id: userId, response })
  if (error) throw new Error(error.message)
  const row = data?.[0] ?? { id: crypto.randomUUID(), event_id: eventId, user_id: userId, response, notified: false, created_at: now }
  return rowToAttendee(row)
}

function rowToEvent(row: Record<string, unknown>): WorkspaceEvent {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: row.project_id ? String(row.project_id) : null,
    boardId: row.board_id ? String(row.board_id) : null,
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    location: String(row.location ?? ''),
    meetingUrl: String(row.meeting_url ?? ''),
    startsAt: row.starts_at ? String(row.starts_at) : new Date().toISOString(),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    allDay: Boolean(row.all_day),
    color: String(row.color ?? '#3b82f6'),
    category: (row.category as WorkspaceEvent['category']) ?? 'meeting',
    recurrence: (row.recurrence as WorkspaceEvent['recurrence']) ?? 'none',
    recurrenceEnd: row.recurrence_end ? String(row.recurrence_end) : null,
    createdBy: String(row.created_by ?? ''),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function eventToRow(e: Partial<WorkspaceEvent>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (e.id !== undefined) row.id = e.id
  if (e.workspaceId !== undefined) row.workspace_id = e.workspaceId
  if (e.projectId !== undefined) row.project_id = e.projectId
  if (e.boardId !== undefined) row.board_id = e.boardId
  if (e.title !== undefined) row.title = e.title
  if (e.description !== undefined) row.description = e.description
  if (e.location !== undefined) row.location = e.location
  if (e.meetingUrl !== undefined) row.meeting_url = e.meetingUrl
  if (e.startsAt !== undefined) row.starts_at = e.startsAt
  if (e.endsAt !== undefined) row.ends_at = e.endsAt
  if (e.allDay !== undefined) row.all_day = e.allDay
  if (e.color !== undefined) row.color = e.color
  if (e.category !== undefined) row.category = e.category
  if (e.recurrence !== undefined) row.recurrence = e.recurrence
  if (e.recurrenceEnd !== undefined) row.recurrence_end = e.recurrenceEnd
  if (e.createdBy !== undefined) row.created_by = e.createdBy
  if (e.updatedBy !== undefined) row.updated_by = e.updatedBy
  if (e.createdAt !== undefined) row.created_at = e.createdAt
  if (e.updatedAt !== undefined) row.updated_at = e.updatedAt
  return row
}

function rowToAttendee(row: Record<string, unknown>): EventAttendee {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.user_id),
    response: (row.response as EventAttendee['response']) ?? 'pending',
    notified: Boolean(row.notified),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}