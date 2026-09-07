import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { RecurringRule, RecurringFrequency } from '@/types/v3'

const KEY = 'quinlist_recurring_rules'

function loadLocal(): RecurringRule[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecurringRule[]
  } catch {
    return []
  }
}

function saveLocal(value: RecurringRule[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(value))
}

export async function listRules(parentId?: string): Promise<RecurringRule[]> {
  if (!isMatuConfigured()) {
    const all = loadLocal()
    return parentId ? all.filter((r) => r.parentId === parentId) : all
  }
  const db = getMatuClient()
  const query = parentId
    ? db.from('recurring_rules').select('*').eq('parent_id', parentId)
    : db.from('recurring_rules').select('*')
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToRule)
}

export async function createRule(input: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringRule> {
  const now = new Date().toISOString()
  const rule: RecurringRule = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal()
    all.push(rule)
    saveLocal(all)
    return rule
  }
  const db = getMatuClient()
  const { error } = await db.from('recurring_rules').insert(ruleToRow(rule))
  if (error) throw new Error(error.message)
  return rule
}

export async function updateRule(id: string, updates: Partial<RecurringRule>): Promise<RecurringRule> {
  if (!isMatuConfigured()) {
    const all = loadLocal()
    const idx = all.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Regla no encontrada')
    const next: RecurringRule = { ...all[idx]!, ...updates, id, updatedAt: new Date().toISOString() }
    all[idx] = next
    saveLocal(all)
    return next
  }
  const db = getMatuClient()
  const { error } = await db.from('recurring_rules').eq('id', id).update(ruleToRow({ ...updates, updatedAt: new Date().toISOString() } as RecurringRule))
  if (error) throw new Error(error.message)
  const { data } = await db.from('recurring_rules').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('No se pudo leer la regla')
  return rowToRule(data)
}

export async function deleteRule(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(loadLocal().filter((r) => r.id !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('recurring_rules').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

/** Devuelve la próxima fecha (YYYY-MM-DD) en la que debería ejecutarse una recurrencia. */
export function computeNextRun(rule: RecurringRule, after: Date = new Date()): string | null {
  const start = new Date(rule.startsOn)
  const last = rule.lastRun ? new Date(rule.lastRun) : start
  const end = rule.endsOn ? new Date(rule.endsOn) : null

  let candidate = new Date(last)
  candidate.setHours(0, 0, 0, 0)

  for (let i = 0; i < 366; i++) {
    candidate = advanceDate(candidate, rule)
    if (end && candidate > end) return null
    if (candidate > after) {
      return candidate.toISOString().slice(0, 10)
    }
  }
  return null
}

function advanceDate(d: Date, rule: RecurringRule): Date {
  const next = new Date(d)
  const freq: RecurringFrequency = rule.frequency
  const interval = Math.max(1, rule.intervalValue || 1)

  if (freq === 'daily') {
    next.setDate(next.getDate() + interval)
  } else if (freq === 'weekly') {
    if (rule.weekdays.length > 0) {
      const currentDay = next.getDay()
      for (let i = 1; i <= 7; i++) {
        const tryDay = (currentDay + i) % 7
        if (rule.weekdays.includes(tryDay)) {
          next.setDate(next.getDate() + i)
          return next
        }
      }
      next.setDate(next.getDate() + 7 * interval)
    } else {
      next.setDate(next.getDate() + 7 * interval)
    }
  } else if (freq === 'biweekly') {
    next.setDate(next.getDate() + 14 * interval)
  } else if (freq === 'monthly') {
    if (rule.monthDay) next.setDate(rule.monthDay)
    next.setMonth(next.getMonth() + interval)
  } else if (freq === 'yearly') {
    next.setFullYear(next.getFullYear() + interval)
  }
  return next
}

function rowToRule(row: Record<string, unknown>): RecurringRule {
  return {
    id: String(row.id),
    scope: (row.scope as RecurringRule['scope']) ?? 'project_task',
    parentId: String(row.parent_id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    frequency: (row.frequency as RecurringFrequency) ?? 'weekly',
    intervalValue: Number(row.interval_value ?? 1),
    weekdays: Array.isArray(row.weekdays) ? (row.weekdays as number[]) : [],
    monthDay: row.month_day != null ? Number(row.month_day) : null,
    startsOn: String(row.starts_on ?? new Date().toISOString().slice(0, 10)),
    endsOn: row.ends_on ? String(row.ends_on) : null,
    nextRun: row.next_run ? String(row.next_run) : null,
    lastRun: row.last_run ? String(row.last_run) : null,
    isActive: Boolean(row.is_active ?? true),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function ruleToRow(r: Partial<RecurringRule>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (r.id !== undefined) row.id = r.id
  if (r.scope !== undefined) row.scope = r.scope
  if (r.parentId !== undefined) row.parent_id = r.parentId
  if (r.workspaceId !== undefined) row.workspace_id = r.workspaceId
  if (r.frequency !== undefined) row.frequency = r.frequency
  if (r.intervalValue !== undefined) row.interval_value = r.intervalValue
  if (r.weekdays !== undefined) row.weekdays = r.weekdays
  if (r.monthDay !== undefined) row.month_day = r.monthDay
  if (r.startsOn !== undefined) row.starts_on = r.startsOn
  if (r.endsOn !== undefined) row.ends_on = r.endsOn
  if (r.nextRun !== undefined) row.next_run = r.nextRun
  if (r.lastRun !== undefined) row.last_run = r.lastRun
  if (r.isActive !== undefined) row.is_active = r.isActive
  if (r.createdBy !== undefined) row.created_by = r.createdBy
  if (r.createdAt !== undefined) row.created_at = r.createdAt
  if (r.updatedAt !== undefined) row.updated_at = r.updatedAt
  return row
}