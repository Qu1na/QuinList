import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { OKR, KeyResult, KeyResultUpdate, OKRStatus } from '@/types/v3'

const OKR_KEY = 'quinlist_okrs'
const KR_KEY = 'quinlist_key_results'
const KRU_KEY = 'quinlist_key_result_updates'

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

export async function listOKRs(workspaceId: string): Promise<OKR[]> {
  if (!isMatuConfigured()) return loadLocal<OKR>(OKR_KEY).filter((o) => o.workspaceId === workspaceId)
  const db = getMatuClient()
  const { data, error } = await db.from('okrs').select('*').eq('workspace_id', workspaceId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToOKR)
}

export async function createOKR(input: Omit<OKR, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<OKR> {
  const now = new Date().toISOString()
  const okr: OKR = { ...input, id: crypto.randomUUID(), progress: 0, createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal<OKR>(OKR_KEY)
    all.push(okr)
    saveLocal(OKR_KEY, all)
    return okr
  }
  const db = getMatuClient()
  const { error } = await db.from('okrs').insert(okrToRow(okr))
  if (error) throw new Error(error.message)
  return okr
}

export async function updateOKR(id: string, updates: Partial<OKR>): Promise<OKR> {
  if (!isMatuConfigured()) {
    const all = loadLocal<OKR>(OKR_KEY)
    const idx = all.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('OKR no encontrado')
    const next: OKR = { ...all[idx]!, ...updates, id, updatedAt: new Date().toISOString() }
    all[idx] = next
    saveLocal(OKR_KEY, all)
    return next
  }
  const db = getMatuClient()
  const { error } = await db.from('okrs').eq('id', id).update(okrToRow({ ...updates, updatedAt: new Date().toISOString() } as OKR))
  if (error) throw new Error(error.message)
  const { data } = await db.from('okrs').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('No se pudo leer el OKR')
  return rowToOKR(data)
}

export async function deleteOKR(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(OKR_KEY, loadLocal<OKR>(OKR_KEY).filter((o) => o.id !== id))
    saveLocal(KR_KEY, loadLocal<KeyResult>(KR_KEY).filter((k) => k.okrId !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('okrs').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

export async function listKeyResults(okrId: string): Promise<KeyResult[]> {
  if (!isMatuConfigured()) return loadLocal<KeyResult>(KR_KEY).filter((k) => k.okrId === okrId)
  const db = getMatuClient()
  const { data, error } = await db.from('key_results').select('*').eq('okr_id', okrId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToKR)
}

export async function createKeyResult(input: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<KeyResult> {
  const now = new Date().toISOString()
  const kr: KeyResult = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal<KeyResult>(KR_KEY)
    all.push(kr)
    saveLocal(KR_KEY, all)
    return kr
  }
  const db = getMatuClient()
  const { error } = await db.from('key_results').insert(krToRow(kr))
  if (error) throw new Error(error.message)
  return kr
}

export async function updateKeyResult(id: string, updates: Partial<KeyResult>): Promise<KeyResult> {
  if (!isMatuConfigured()) {
    const all = loadLocal<KeyResult>(KR_KEY)
    const idx = all.findIndex((k) => k.id === id)
    if (idx === -1) throw new Error('KR no encontrado')
    const next: KeyResult = { ...all[idx]!, ...updates, id, updatedAt: new Date().toISOString() }
    all[idx] = next
    saveLocal(KR_KEY, all)
    return next
  }
  const db = getMatuClient()
  const { error } = await db.from('key_results').eq('id', id).update(krToRow({ ...updates, updatedAt: new Date().toISOString() } as KeyResult))
  if (error) throw new Error(error.message)
  const { data } = await db.from('key_results').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('No se pudo leer el KR')
  return rowToKR(data)
}

export async function addKeyResultUpdate(input: Omit<KeyResultUpdate, 'id' | 'createdAt'>): Promise<KeyResultUpdate> {
  const u: KeyResultUpdate = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  if (!isMatuConfigured()) {
    const all = loadLocal<KeyResultUpdate>(KRU_KEY)
    all.push(u)
    saveLocal(KRU_KEY, all)
    return u
  }
  const db = getMatuClient()
  const { error } = await db.from('key_result_updates').insert({
    key_result_id: u.keyResultId,
    value: u.value,
    note: u.note,
    updated_by: u.updatedBy,
  })
  if (error) throw new Error(error.message)
  return u
}

/** Recalcula el progreso de un OKR promediando el progreso de sus KRs. */
export function computeOKRProgress(krs: KeyResult[]): number {
  if (krs.length === 0) return 0
  const sum = krs.reduce((acc, kr) => {
    const pct = kr.targetValue > 0 ? Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100)) : 0
    return acc + pct
  }, 0)
  return Math.round(sum / krs.length)
}

/** Sugerencia de status basado en progreso y días restantes. */
export function suggestStatus(progress: number, endsAt: string): OKRStatus {
  const remainingDays = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (progress >= 100) return 'completed'
  if (remainingDays < 0) return 'off_track'
  if (remainingDays < 14 && progress < 50) return 'at_risk'
  if (progress < 30) return 'at_risk'
  return 'on_track'
}

function rowToOKR(row: Record<string, unknown>): OKR {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: row.project_id ? String(row.project_id) : null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    period: (row.period as OKR['period']) ?? 'quarter',
    startsAt: String(row.starts_at ?? new Date().toISOString().slice(0, 10)),
    endsAt: String(row.ends_at ?? new Date().toISOString().slice(0, 10)),
    status: (row.status as OKRStatus) ?? 'on_track',
    progress: Number(row.progress ?? 0),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function okrToRow(o: Partial<OKR>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (o.id !== undefined) row.id = o.id
  if (o.workspaceId !== undefined) row.workspace_id = o.workspaceId
  if (o.projectId !== undefined) row.project_id = o.projectId
  if (o.parentId !== undefined) row.parent_id = o.parentId
  if (o.title !== undefined) row.title = o.title
  if (o.description !== undefined) row.description = o.description
  if (o.ownerId !== undefined) row.owner_id = o.ownerId
  if (o.period !== undefined) row.period = o.period
  if (o.startsAt !== undefined) row.starts_at = o.startsAt
  if (o.endsAt !== undefined) row.ends_at = o.endsAt
  if (o.status !== undefined) row.status = o.status
  if (o.progress !== undefined) row.progress = o.progress
  if (o.createdBy !== undefined) row.created_by = o.createdBy
  if (o.createdAt !== undefined) row.created_at = o.createdAt
  if (o.updatedAt !== undefined) row.updated_at = o.updatedAt
  return row
}

function rowToKR(row: Record<string, unknown>): KeyResult {
  return {
    id: String(row.id),
    okrId: String(row.okr_id),
    title: String(row.title ?? ''),
    metricType: (row.metric_type as KeyResult['metricType']) ?? 'percentage',
    targetValue: Number(row.target_value ?? 100),
    currentValue: Number(row.current_value ?? 0),
    unit: String(row.unit ?? '%'),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function krToRow(k: Partial<KeyResult>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (k.id !== undefined) row.id = k.id
  if (k.okrId !== undefined) row.okr_id = k.okrId
  if (k.title !== undefined) row.title = k.title
  if (k.metricType !== undefined) row.metric_type = k.metricType
  if (k.targetValue !== undefined) row.target_value = k.targetValue
  if (k.currentValue !== undefined) row.current_value = k.currentValue
  if (k.unit !== undefined) row.unit = k.unit
  if (k.ownerId !== undefined) row.owner_id = k.ownerId
  if (k.dueDate !== undefined) row.due_date = k.dueDate
  if (k.createdAt !== undefined) row.created_at = k.createdAt
  if (k.updatedAt !== undefined) row.updated_at = k.updatedAt
  return row
}