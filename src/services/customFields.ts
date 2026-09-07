import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { CustomFieldDefinition, CustomFieldValue } from '@/types/v3'

const DEF_KEY = 'quinlist_custom_field_definitions'
const VAL_KEY = 'quinlist_custom_field_values'

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

export async function listDefinitions(scope: 'board' | 'project', scopeId: string): Promise<CustomFieldDefinition[]> {
  if (!isMatuConfigured()) {
    return loadLocal<CustomFieldDefinition>(DEF_KEY).filter((d) => d.scope === scope && d.scopeId === scopeId)
  }
  const db = getMatuClient()
  const { data, error } = await db
    .from('custom_field_definitions')
    .select('*')
    .eq('scope', scope)
    .eq('scope_id', scopeId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToDef)
}

export async function createDefinition(input: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomFieldDefinition> {
  const now = new Date().toISOString()
  const def: CustomFieldDefinition = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  if (!isMatuConfigured()) {
    const all = loadLocal<CustomFieldDefinition>(DEF_KEY)
    all.push(def)
    saveLocal(DEF_KEY, all)
    return def
  }
  const db = getMatuClient()
  const { error } = await db.from('custom_field_definitions').insert(defToRow(def))
  if (error) throw new Error(error.message)
  return def
}

export async function deleteDefinition(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(DEF_KEY, loadLocal<CustomFieldDefinition>(DEF_KEY).filter((d) => d.id !== id))
    saveLocal(VAL_KEY, loadLocal<CustomFieldValue>(VAL_KEY).filter((v) => v.definitionId !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('custom_field_definitions').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

export async function getValuesForEntity(entityType: 'card' | 'project_task', entityId: string): Promise<CustomFieldValue[]> {
  if (!isMatuConfigured()) {
    return loadLocal<CustomFieldValue>(VAL_KEY).filter((v) => v.entityType === entityType && v.entityId === entityId)
  }
  const db = getMatuClient()
  const { data, error } = await db
    .from('custom_field_values')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToVal)
}

export async function upsertValue(input: {
  definitionId: string
  entityType: 'card' | 'project_task'
  entityId: string
  valueText?: string
  valueNumber?: number | null
  valueDate?: string | null
  valueJson?: unknown
}): Promise<CustomFieldValue> {
  const now = new Date().toISOString()
  const existing = loadLocal<CustomFieldValue>(VAL_KEY).find(
    (v) => v.definitionId === input.definitionId && v.entityType === input.entityType && v.entityId === input.entityId,
  )
  const val: CustomFieldValue = {
    id: existing?.id ?? crypto.randomUUID(),
    definitionId: input.definitionId,
    entityType: input.entityType,
    entityId: input.entityId,
    valueText: input.valueText ?? '',
    valueNumber: input.valueNumber ?? null,
    valueDate: input.valueDate ?? null,
    valueJson: input.valueJson ?? null,
    updatedAt: now,
  }
  if (!isMatuConfigured()) {
    const all = loadLocal<CustomFieldValue>(VAL_KEY)
    if (existing) {
      const idx = all.indexOf(existing)
      all[idx] = val
    } else {
      all.push(val)
    }
    saveLocal(VAL_KEY, all)
    return val
  }
  const db = getMatuClient()
  const { error } = await db.from('custom_field_values').upsert(valToRow(val))
  if (error) throw new Error(error.message)
  return val
}

function rowToDef(row: Record<string, unknown>): CustomFieldDefinition {
  return {
    id: String(row.id),
    scope: (row.scope as 'board' | 'project') ?? 'board',
    scopeId: String(row.scope_id),
    name: String(row.name ?? ''),
    fieldType: (row.field_type as CustomFieldDefinition['fieldType']) ?? 'text',
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    required: Boolean(row.required),
    position: Number(row.position ?? 0),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function defToRow(d: CustomFieldDefinition): Record<string, unknown> {
  return {
    id: d.id,
    scope: d.scope,
    scope_id: d.scopeId,
    name: d.name,
    field_type: d.fieldType,
    options: d.options,
    required: d.required,
    position: d.position,
    created_by: d.createdBy,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

function rowToVal(row: Record<string, unknown>): CustomFieldValue {
  return {
    id: String(row.id),
    definitionId: String(row.definition_id),
    entityType: (row.entity_type as 'card' | 'project_task') ?? 'card',
    entityId: String(row.entity_id),
    valueText: String(row.value_text ?? ''),
    valueNumber: row.value_number != null ? Number(row.value_number) : null,
    valueDate: row.value_date ? String(row.value_date) : null,
    valueJson: row.value_json ?? null,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

function valToRow(v: CustomFieldValue): Record<string, unknown> {
  return {
    id: v.id,
    definition_id: v.definitionId,
    entity_type: v.entityType,
    entity_id: v.entityId,
    value_text: v.valueText,
    value_number: v.valueNumber,
    value_date: v.valueDate,
    value_json: v.valueJson,
    updated_at: v.updatedAt,
  }
}