import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import type { TaskDependency, DependencyType } from '@/types/v3'

const KEY = 'quinlist_task_dependencies'

function loadLocal(): TaskDependency[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as TaskDependency[]
  } catch {
    return []
  }
}

function saveLocal(value: TaskDependency[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(value))
}

export async function listDependencies(
  scope: { sourceType?: TaskDependency['sourceType']; sourceId?: string; targetType?: TaskDependency['targetType']; targetId?: string },
): Promise<TaskDependency[]> {
  if (!isMatuConfigured()) {
    return loadLocal().filter((d) => {
      if (scope.sourceType && d.sourceType !== scope.sourceType) return false
      if (scope.sourceId && d.sourceId !== scope.sourceId) return false
      if (scope.targetType && d.targetType !== scope.targetType) return false
      if (scope.targetId && d.targetId !== scope.targetId) return false
      return true
    })
  }
  const db = getMatuClient()
  let query = db.from('task_dependencies').select('*')
  if (scope.sourceType && scope.sourceId) query = query.eq('source_type', scope.sourceType).eq('source_id', scope.sourceId)
  if (scope.targetType && scope.targetId) query = query.eq('target_type', scope.targetType).eq('target_id', scope.targetId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToDep)
}

export async function createDependency(input: {
  sourceType: TaskDependency['sourceType']
  sourceId: string
  targetType: TaskDependency['targetType']
  targetId: string
  dependencyType?: DependencyType
  createdBy?: string | null
}): Promise<TaskDependency> {
  const dep: TaskDependency = {
    id: crypto.randomUUID(),
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    targetType: input.targetType,
    targetId: input.targetId,
    dependencyType: input.dependencyType ?? 'blocks',
    createdBy: input.createdBy ?? null,
    createdAt: new Date().toISOString(),
  }
  if (!isMatuConfigured()) {
    const all = loadLocal().filter(
      (d) => !(d.sourceType === dep.sourceType && d.sourceId === dep.sourceId && d.targetType === dep.targetType && d.targetId === dep.targetId),
    )
    all.push(dep)
    saveLocal(all)
    return dep
  }
  const db = getMatuClient()
  const { error } = await db.from('task_dependencies').insert(depToRow(dep))
  if (error) throw new Error(error.message)
  return dep
}

export async function deleteDependency(id: string): Promise<void> {
  if (!isMatuConfigured()) {
    saveLocal(loadLocal().filter((d) => d.id !== id))
    return
  }
  const db = getMatuClient()
  const { error } = await db.from('task_dependencies').eq('id', id).delete()
  if (error) throw new Error(error.message)
}

/**
 * Detecta si agregar `target` como bloqueador de `source` crearía un ciclo.
 * Recorre transitivamente las dependencias salientes desde `target`.
 */
export function hasCycle(all: TaskDependency[], sourceId: string, targetId: string): boolean {
  if (sourceId === targetId) return true
  const visited = new Set<string>([targetId])
  const stack: string[] = [targetId]
  while (stack.length) {
    const current = stack.pop()!
    for (const dep of all) {
      if (dep.sourceId !== current) continue
      if (dep.sourceId === sourceId) return true
      if (!visited.has(dep.targetId)) {
        visited.add(dep.targetId)
        stack.push(dep.targetId)
      }
    }
  }
  return false
}

function rowToDep(row: Record<string, unknown>): TaskDependency {
  return {
    id: String(row.id),
    sourceType: (row.source_type as TaskDependency['sourceType']) ?? 'project_task',
    sourceId: String(row.source_id),
    targetType: (row.target_type as TaskDependency['targetType']) ?? 'project_task',
    targetId: String(row.target_id),
    dependencyType: (row.dependency_type as DependencyType) ?? 'blocks',
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function depToRow(d: TaskDependency): Record<string, unknown> {
  return {
    id: d.id,
    source_type: d.sourceType,
    source_id: d.sourceId,
    target_type: d.targetType,
    target_id: d.targetId,
    dependency_type: d.dependencyType,
    created_by: d.createdBy,
    created_at: d.createdAt,
  }
}