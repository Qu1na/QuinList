import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { AutomationRule, AutomationTrigger, AutomationAction } from '@/types/v3'

const KEY = 'quinlist_automation_rules'

function loadLocal(): AutomationRule[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as AutomationRule[]
  } catch {
    return []
  }
}

function saveLocal(value: AutomationRule[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(value))
}

export async function listRules(scope: { workspaceId?: string; boardId?: string; projectId?: string }): Promise<AutomationRule[]> {
  if (!isMatuConfigured()) {
    return loadLocal().filter((r) => {
      if (scope.workspaceId && r.workspaceId !== scope.workspaceId) return false
      if (scope.boardId && r.boardId !== scope.boardId) return false
      if (scope.projectId && r.projectId !== scope.projectId) return false
      return true
    })
  }
  const db = getMatuClient()
  let query = db.from('automation_rules').select('*')
  if (scope.workspaceId) query = query.eq('workspace_id', scope.workspaceId)
  if (scope.boardId) query = query.eq('board_id', scope.boardId)
  if (scope.projectId) query = query.eq('project_id', scope.projectId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToRule)
}

export async function createRule(input: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule> {
  const now = new Date().toISOString()
  const rule: AutomationRule = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal()
    all.push(rule)
    saveLocal(all)
    return rule
  }
  const db = getMatuClient()
  const { error } = await db.from('automation_rules').insert(ruleToRow(rule))
  if (error) throw new Error(error.message)
  return rule
}

export async function updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
  if (!isMatuConfigured()) {
    const all = loadLocal()
    const idx = all.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Regla no encontrada')
    const next: AutomationRule = { ...all[idx]!, ...updates, id, updatedAt: new Date().toISOString() }
    all[idx] = next
    saveLocal(all)
    return next
  }
  const db = getMatuClient()
  const { error } = await db
    .from('automation_rules')
    .eq('id', id)
    .update(ruleToRow({ ...updates, updatedAt: new Date().toISOString() } as AutomationRule))
  if (error) throw new Error(error.message)
  const { data } = await db.from('automation_rules').select('*').eq('id', id).maybeSingle()
  if (!data) throw new Error('No se pudo leer la regla')
  return rowToRule(data)
}

export async function deleteRule(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(loadLocal().filter((r) => r.id !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('automation_rules').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

/** Descripción legible de un disparador para mostrar en la UI. */
export function describeTrigger(trigger: AutomationTrigger): string {
  const map: Record<AutomationTrigger, string> = {
    task_created: 'Cuando se crea una tarea',
    task_completed: 'Cuando se completa una tarea',
    task_moved: 'Cuando se mueve una tarea',
    task_assigned: 'Cuando se asigna una tarea',
    due_date_approaching: 'Cuando se acerca la fecha límite',
    comment_added: 'Cuando se añade un comentario',
    card_created: 'Cuando se crea una tarjeta',
    card_moved: 'Cuando se mueve una tarjeta',
  }
  return map[trigger] ?? trigger
}

/** Descripción legible de una acción. */
export function describeAction(action: AutomationAction): string {
  switch (action.type) {
    case 'assign':
      return `Asignar a ${action.userId}`
    case 'move_to':
      return `Mover a lista ${action.columnId}`
    case 'add_label':
      return `Añadir etiqueta ${action.labelId}`
    case 'set_priority':
      return `Prioridad ${action.priority}`
    case 'notify':
      return `Notificar a ${action.userId}`
    case 'set_due_date':
      return `Fecha límite en ${action.offsetDays} días`
    case 'add_comment':
      return `Comentar: "${action.text}"`
  }
}

function rowToRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: String(row.id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    boardId: row.board_id ? String(row.board_id) : null,
    projectId: row.project_id ? String(row.project_id) : null,
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    triggerEvent: (row.trigger_event as AutomationTrigger) ?? 'task_created',
    triggerConditions: (row.trigger_conditions as Record<string, unknown>) ?? {},
    actions: Array.isArray(row.actions) ? (row.actions as AutomationAction[]) : [],
    isActive: Boolean(row.is_active ?? true),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function ruleToRow(r: Partial<AutomationRule>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (r.id !== undefined) row.id = r.id
  if (r.workspaceId !== undefined) row.workspace_id = r.workspaceId
  if (r.boardId !== undefined) row.board_id = r.boardId
  if (r.projectId !== undefined) row.project_id = r.projectId
  if (r.name !== undefined) row.name = r.name
  if (r.description !== undefined) row.description = r.description
  if (r.triggerEvent !== undefined) row.trigger_event = r.triggerEvent
  if (r.triggerConditions !== undefined) row.trigger_conditions = r.triggerConditions
  if (r.actions !== undefined) row.actions = r.actions
  if (r.isActive !== undefined) row.is_active = r.isActive
  if (r.createdBy !== undefined) row.created_by = r.createdBy
  if (r.createdAt !== undefined) row.created_at = r.createdAt
  if (r.updatedAt !== undefined) row.updated_at = r.updatedAt
  return row
}