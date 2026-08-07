import type { Project, ProjectMilestone, ProjectRisk, ProjectTask } from '@/types/projects'
import type { ProjectDetailTab } from '@/types/projects'
import type { FinanceSummary } from '@/utils/projectFinance'
import type { ChartBar, ChartPoint } from '@/utils/workspaceStats'
import {
  compareCalendarDates,
  daysUntilDue,
  instantToCalendarDate,
  isDueSoon,
  lastCalendarDays,
} from '@/utils/datetime'
import {
  PRIORITY_LABELS,
  completedOnCalendarDay,
  isProjectOverdue,
  isTaskOverdue,
} from '@/utils/projectStats'

export type ScheduleTone = 'ahead' | 'on_track' | 'behind' | 'unknown'

export interface ScheduleVariance {
  delta: number | null
  label: string
  tone: ScheduleTone
}

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface DashboardAlert {
  id: string
  severity: AlertSeverity
  label: string
  tab: ProjectDetailTab
}

export type AttentionReason = 'overdue' | 'blocked' | 'high_priority' | 'due_soon'

export interface AttentionItem {
  task: ProjectTask
  reason: AttentionReason
  reasonLabel: string
}

const PRIORITY_HEX: Record<ProjectTask['priority'], string> = {
  alta: '#f4845f',
  media: '#5bbce4',
  baja: '#94a3b8',
}

const SEVERITY_RANK: Record<ProjectRisk['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Avance de tareas vs % de plazo consumido (no es SPI/EVM real). */
export function scheduleVariance(
  progressPct: number,
  timeElapsedPct: number | null,
): ScheduleVariance {
  if (timeElapsedPct == null) {
    return { delta: null, label: 'Sin plazo definido', tone: 'unknown' }
  }
  const delta = progressPct - timeElapsedPct
  if (delta >= 8) {
    return { delta, label: `${delta} pts adelantado vs plazo`, tone: 'ahead' }
  }
  if (delta <= -8) {
    return { delta, label: `${Math.abs(delta)} pts atrasado vs plazo`, tone: 'behind' }
  }
  return { delta, label: 'A ritmo del calendario', tone: 'on_track' }
}

export function dueSoonTasks(tasks: ProjectTask[], withinDays = 7): ProjectTask[] {
  return tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isDueSoon(t.dueDate, withinDays),
  )
}

export function velocitySeries(tasks: ProjectTask[], days = 7): ChartPoint[] {
  return lastCalendarDays(days).map(({ key, label }) => ({
    label,
    value: tasks.filter((t) => completedOnCalendarDay(t.completedAt, key)).length,
  }))
}

export function avgVelocity(series: ChartPoint[]): number {
  if (!series.length) return 0
  const sum = series.reduce((acc, p) => acc + p.value, 0)
  return Math.round((sum / series.length) * 10) / 10
}

/** Acumulado de tareas completadas al cierre de cada día. */
export function burnupSeries(tasks: ProjectTask[], days = 14): ChartPoint[] {
  const dayList = lastCalendarDays(days)
  return dayList.map(({ key, label }) => {
    const done = tasks.filter((t) => {
      if (t.status !== 'done') return false
      if (!t.completedAt) return true
      return instantToCalendarDate(t.completedAt) <= key
    }).length
    return { label, value: done }
  })
}

export function priorityDistribution(tasks: ProjectTask[]): ChartBar[] {
  const pending = tasks.filter((t) => t.status !== 'done')
  const order: ProjectTask['priority'][] = ['alta', 'media', 'baja']
  return order
    .map((priority) => ({
      label: PRIORITY_LABELS[priority],
      value: pending.filter((t) => t.priority === priority).length,
      color: PRIORITY_HEX[priority],
    }))
    .filter((row) => row.value > 0)
}

export function buildAttentionQueue(tasks: ProjectTask[], limit = 8): AttentionItem[] {
  const pending = tasks.filter((t) => t.status !== 'done')
  const seen = new Set<string>()
  const items: AttentionItem[] = []

  const push = (task: ProjectTask, reason: AttentionReason, reasonLabel: string) => {
    if (seen.has(task.id) || items.length >= limit) return
    seen.add(task.id)
    items.push({ task, reason, reasonLabel })
  }

  const byDue = (a: ProjectTask, b: ProjectTask) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return compareCalendarDates(a.dueDate, b.dueDate)
  }

  for (const task of [...pending].filter(isTaskOverdue).sort(byDue)) {
    push(task, 'overdue', 'Vencida')
  }
  for (const task of pending.filter((t) => t.status === 'blocked').sort(byDue)) {
    push(task, 'blocked', 'Bloqueada')
  }
  for (const task of pending
    .filter((t) => t.priority === 'alta' && !isTaskOverdue(t))
    .sort(byDue)) {
    push(task, 'high_priority', 'Alta prioridad')
  }
  for (const task of dueSoonTasks(pending, 7).sort(byDue)) {
    const days = daysUntilDue(task.dueDate)
    const reasonLabel =
      days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence en ${days}d`
    push(task, 'due_soon', reasonLabel)
  }

  return items.slice(0, limit)
}

export function upcomingMilestones(
  milestones: ProjectMilestone[],
  limit = 5,
): ProjectMilestone[] {
  return [...milestones]
    .filter((m) => !m.completed)
    .sort((a, b) => {
      const aDue = a.dueDate ?? '9999-12-31'
      const bDue = b.dueDate ?? '9999-12-31'
      return compareCalendarDates(aDue, bDue)
    })
    .slice(0, limit)
}

export function topOpenRisks(risks: ProjectRisk[], limit = 3): ProjectRisk[] {
  return risks
    .filter((r) => r.status === 'open')
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, limit)
}

export function buildAlertItems(input: {
  project: Project
  overdueTasks: number
  blockedTasks: number
  dueSoonCount: number
  openRisks: ProjectRisk[]
  finance: FinanceSummary | null
  financeEnabled: boolean
  timeElapsedPct: number | null
  progressPct: number
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  const {
    project,
    overdueTasks,
    blockedTasks,
    dueSoonCount,
    openRisks,
    finance,
    financeEnabled,
    timeElapsedPct,
    progressPct,
  } = input

  if (isProjectOverdue(project)) {
    alerts.push({
      id: 'project-overdue',
      severity: 'critical',
      label: 'Proyecto vencido',
      tab: 'info',
    })
  } else if (timeElapsedPct != null && timeElapsedPct >= 85 && progressPct < timeElapsedPct - 8) {
    alerts.push({
      id: 'schedule-risk',
      severity: 'warning',
      label: 'Plazo al límite vs avance',
      tab: 'gantt',
    })
  }

  if (overdueTasks > 0) {
    alerts.push({
      id: 'tasks-overdue',
      severity: 'critical',
      label: `${overdueTasks} tarea${overdueTasks === 1 ? '' : 's'} vencida${overdueTasks === 1 ? '' : 's'}`,
      tab: 'tasks',
    })
  }

  if (blockedTasks > 0) {
    alerts.push({
      id: 'tasks-blocked',
      severity: 'warning',
      label: `${blockedTasks} bloqueada${blockedTasks === 1 ? '' : 's'}`,
      tab: 'tasks',
    })
  }

  if (dueSoonCount > 0) {
    alerts.push({
      id: 'tasks-due-soon',
      severity: 'info',
      label: `${dueSoonCount} por vencer (7d)`,
      tab: 'tasks',
    })
  }

  const highRisks = openRisks.filter(
    (r) => r.severity === 'high' || r.severity === 'critical',
  )
  if (highRisks.length > 0) {
    alerts.push({
      id: 'risks-high',
      severity: 'critical',
      label: `${highRisks.length} riesgo${highRisks.length === 1 ? '' : 's'} alto${highRisks.length === 1 ? '' : 's'}`,
      tab: 'risks',
    })
  } else if (openRisks.length > 0) {
    alerts.push({
      id: 'risks-open',
      severity: 'warning',
      label: `${openRisks.length} riesgo${openRisks.length === 1 ? '' : 's'} abierto${openRisks.length === 1 ? '' : 's'}`,
      tab: 'risks',
    })
  }

  if (financeEnabled && finance) {
    if (finance.usagePercent >= 100) {
      alerts.push({
        id: 'budget-over',
        severity: 'critical',
        label: 'Presupuesto agotado',
        tab: 'finance',
      })
    } else if (finance.usagePercent >= 90) {
      alerts.push({
        id: 'budget-warn',
        severity: 'warning',
        label: `Presupuesto al ${finance.usagePercent}%`,
        tab: 'finance',
      })
    }
  }

  return alerts
}

export function unassignedActiveCount(tasks: ProjectTask[]): number {
  return tasks.filter((t) => t.status !== 'done' && t.assigneeIds.length === 0).length
}
