import type {
  Project,
  ProjectMilestone,
  ProjectRisk,
  ProjectTask,
  RiskProbability,
  RiskSeverity,
  RiskType,
} from '@/types/projects'
import { isTaskOverdue, daysUntil } from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'

const AUTO_MARKER_RE = /^<!--auto:(\w+):([^>]+)-->\n?/

export interface AutoRiskSource {
  type: 'task' | 'milestone' | 'project'
  id: string
}

export interface AutoRiskSuggestion {
  sourceType: AutoRiskSource['type']
  sourceId: string
  title: string
  description: string
  type: RiskType
  severity: RiskSeverity
  probability: RiskProbability
}

export function getAutoSource(risk: ProjectRisk): AutoRiskSource | null {
  const match = risk.description.match(AUTO_MARKER_RE)
  if (!match) return null
  return { type: match[1] as AutoRiskSource['type'], id: match[2]! }
}

export function isAutoRisk(risk: ProjectRisk): boolean {
  return AUTO_MARKER_RE.test(risk.description)
}

export function stripAutoMarker(description: string): string {
  return description.replace(AUTO_MARKER_RE, '').trim()
}

export function withAutoMarker(
  description: string,
  sourceType: AutoRiskSource['type'],
  sourceId: string,
): string {
  const clean = stripAutoMarker(description)
  return `<!--auto:${sourceType}:${sourceId}-->${clean ? `\n${clean}` : ''}`
}

function overdueSeverity(days: number): RiskSeverity {
  if (days >= 14) return 'critical'
  if (days >= 7) return 'high'
  if (days >= 3) return 'medium'
  return 'low'
}

export function detectAutoRisks(
  project: Project,
  tasks: ProjectTask[],
  milestones: ProjectMilestone[],
): AutoRiskSuggestion[] {
  const suggestions: AutoRiskSuggestion[] = []
  const today = new Date(new Date().toDateString())

  for (const task of tasks) {
    if (task.status === 'done') continue

    if (task.status === 'blocked') {
      suggestions.push({
        sourceType: 'task',
        sourceId: task.id,
        title: `Tarea bloqueada: ${task.title}`,
        description: 'La tarea está marcada como bloqueada y puede afectar el cronograma.',
        type: 'incident',
        severity: 'high',
        probability: 'high',
      })
      continue
    }

    if (task.dueDate && isTaskOverdue(task)) {
      const days = Math.abs(daysUntil(task.dueDate) ?? 0)
      suggestions.push({
        sourceType: 'task',
        sourceId: task.id,
        title: `Tarea vencida: ${task.title}`,
        description: `Venció el ${formatDate(task.dueDate)} y aún no está completada (${days} día${days === 1 ? '' : 's'} de retraso).`,
        type: 'incident',
        severity: overdueSeverity(days),
        probability: 'high',
      })
      continue
    }

    const daysLeft = task.dueDate ? daysUntil(task.dueDate) : null
    if (daysLeft != null && daysLeft >= 0 && daysLeft <= 3) {
      suggestions.push({
        sourceType: 'task',
        sourceId: task.id,
        title: `Tarea próxima a vencer: ${task.title}`,
        description: `Vence el ${formatDate(task.dueDate)} (${daysLeft === 0 ? 'hoy' : `en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`}).`,
        type: 'risk',
        severity: daysLeft === 0 ? 'medium' : 'low',
        probability: 'high',
      })
    }
  }

  for (const ms of milestones) {
    if (ms.completed || !ms.dueDate) continue
    const due = new Date(ms.dueDate)
    if (due >= today) continue
    const days = Math.abs(daysUntil(ms.dueDate) ?? 0)
    suggestions.push({
      sourceType: 'milestone',
      sourceId: ms.id,
      title: `Hito vencido: ${ms.title}`,
      description: `El hito debía completarse el ${formatDate(ms.dueDate)} (${days} día${days === 1 ? '' : 's'} de retraso).`,
      type: 'incident',
      severity: overdueSeverity(days),
      probability: 'high',
    })
  }

  if (
    project.dueDate &&
    project.status !== 'completed' &&
    project.status !== 'cancelled' &&
    new Date(project.dueDate) < today
  ) {
    const days = Math.abs(daysUntil(project.dueDate) ?? 0)
    suggestions.push({
      sourceType: 'project',
      sourceId: project.id,
      title: 'Proyecto fuera de plazo',
      description: `La fecha fin del proyecto (${formatDate(project.dueDate)}) ya pasó (${days} día${days === 1 ? '' : 's'}).`,
      type: 'risk',
      severity: overdueSeverity(days),
      probability: 'high',
    })
  }

  return suggestions
}
