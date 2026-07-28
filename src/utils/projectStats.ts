import type {
  Project,
  ProjectCost,
  ProjectTask,
  ProjectsDataState,
} from '@/types/projects'
import { calcFinanceSummary as calcFullFinance } from '@/utils/projectFinance'

export function calcProjectProgress(tasks: ProjectTask[]): number {
  if (!tasks.length) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

export function calcFinanceSummary(project: Project, costs: ProjectCost[]) {
  return calcFullFinance(project, costs)
}

export function getPendingTasks(tasks: ProjectTask[]): ProjectTask[] {
  return tasks.filter((t) => t.status !== 'done')
}

export function getCompletedTasks(tasks: ProjectTask[]): ProjectTask[] {
  return tasks.filter((t) => t.status === 'done')
}

export function getUpcomingTasks(tasks: ProjectTask[], limit = 5): ProjectTask[] {
  return getPendingTasks(tasks)
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, limit)
}

export function collectProjectFiles(state: ProjectsDataState, projectId: string) {
  const items: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
    storageFilename?: string
    uploadedAt: string
    uploadedBy: string
    source: string
    sourceId: string
  }> = []

  for (const task of state.tasks.filter((t) => t.projectId === projectId)) {
    for (const att of task.attachments ?? []) {
      items.push({
        ...att,
        source: 'Tarea',
        sourceId: task.id,
      })
    }
  }

  for (const doc of state.documents.filter((d) => d.projectId === projectId)) {
    for (const att of doc.attachments ?? []) {
      items.push({
        ...att,
        source: 'Documento',
        sourceId: doc.id,
      })
    }
  }

  return items.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
}

export const PROJECT_STATUS_LABELS: Record<Project['status'], string> = {
  planning: 'Planificación',
  active: 'Activo',
  on_hold: 'En pausa',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const TASK_STATUS_LABELS: Record<ProjectTask['status'], string> = {
  todo: 'Por hacer',
  in_progress: 'En progreso',
  review: 'En revisión',
  done: 'Completada',
  blocked: 'Bloqueada',
}

export const KANBAN_COLUMNS: ProjectTask['status'][] = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
]

export const PRIORITY_LABELS: Record<ProjectTask['priority'], string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const PRIORITY_COLORS: Record<ProjectTask['priority'], string> = {
  baja: 'bg-slate-100 text-slate-600',
  media: 'bg-blue-50 text-blue-700',
  alta: 'bg-red-50 text-red-700',
}

export const TASK_STATUS_COLORS: Record<ProjectTask['status'], string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-700',
}

export const PROJECT_STATUS_COLORS: Record<Project['status'], string> = {
  planning: '#94a3b8',
  active: '#0c66e4',
  on_hold: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
}

export function isTaskOverdue(task: ProjectTask): boolean {
  if (!task.dueDate || task.status === 'done') return false
  return new Date(task.dueDate) < new Date(new Date().toDateString())
}

export function isProjectOverdue(project: Project): boolean {
  if (!project.dueDate || project.status === 'completed' || project.status === 'cancelled') {
    return false
  }
  return new Date(project.dueDate) < new Date(new Date().toDateString())
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
