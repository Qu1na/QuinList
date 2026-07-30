import type { Project } from '@/types/projects'
import type { FinanceSummary } from '@/utils/projectFinance'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'

export type HealthLabel = 'Excelente' | 'Bueno' | 'Atención' | 'Crítico'

export interface ProjectHealthFactors {
  taskProgress: boolean
  overdueTasks: boolean
  blockedTasks: boolean
  openRisks: boolean
  projectSchedule: boolean
  milestones: boolean
  finance: boolean
}

export interface ProjectHealthBreakdownItem {
  id: keyof ProjectHealthFactors
  label: string
  enabled: boolean
  available: boolean
  impact: number
  detail: string
}

export interface ProjectHealthResult {
  score: number
  label: HealthLabel
  color: string
  factors: ProjectHealthFactors
  breakdown: ProjectHealthBreakdownItem[]
}

export const HEALTH_FACTOR_LABELS: Record<keyof ProjectHealthFactors, string> = {
  taskProgress: 'Avance de tareas',
  overdueTasks: 'Tareas vencidas',
  blockedTasks: 'Tareas bloqueadas',
  openRisks: 'Riesgos abiertos',
  projectSchedule: 'Plazo del proyecto',
  milestones: 'Hitos completados',
  finance: 'Presupuesto y finanzas',
}

export const HEALTH_STORAGE_KEY = 'ql-health-factors'

export function deriveHealthFactorAvailability(
  project: Project,
  counts: { tasks: number; milestones: number },
): Record<keyof ProjectHealthFactors, boolean> {
  return {
    taskProgress: counts.tasks > 0,
    overdueTasks: counts.tasks > 0,
    blockedTasks: counts.tasks > 0,
    openRisks: true,
    projectSchedule: Boolean(project.dueDate),
    milestones: counts.milestones > 0,
    finance: isProjectFinanceEnabled(project),
  }
}

export function resolveHealthFactors(
  project: Project,
  counts: { tasks: number; milestones: number },
  saved?: Partial<ProjectHealthFactors> | null,
): ProjectHealthFactors {
  const availability = deriveHealthFactorAvailability(project, counts)
  const resolved = { ...availability, ...saved }

  for (const key of Object.keys(availability) as (keyof ProjectHealthFactors)[]) {
    if (!availability[key]) resolved[key] = false
  }

  return resolved
}

export function calculateProjectHealth(input: {
  taskProgress: number
  overdueTasks: number
  blockedTasks: number
  openRisks: number
  projectOverdue: boolean
  milestonePercent: number | null
  finance: FinanceSummary | null
  factors: ProjectHealthFactors
}): ProjectHealthResult {
  const breakdown: ProjectHealthBreakdownItem[] = []
  let score = input.factors.taskProgress ? input.taskProgress : 50

  if (input.factors.taskProgress) {
    breakdown.push({
      id: 'taskProgress',
      label: HEALTH_FACTOR_LABELS.taskProgress,
      enabled: true,
      available: true,
      impact: input.taskProgress,
      detail: `Base: ${input.taskProgress}% de avance`,
    })
  }

  if (input.factors.overdueTasks && input.overdueTasks > 0) {
    const impact = input.overdueTasks * 8
    score -= impact
    breakdown.push({
      id: 'overdueTasks',
      label: HEALTH_FACTOR_LABELS.overdueTasks,
      enabled: true,
      available: true,
      impact: -impact,
      detail: `${input.overdueTasks} tarea${input.overdueTasks === 1 ? '' : 's'} vencida${input.overdueTasks === 1 ? '' : 's'}`,
    })
  }

  if (input.factors.blockedTasks && input.blockedTasks > 0) {
    const impact = input.blockedTasks * 5
    score -= impact
    breakdown.push({
      id: 'blockedTasks',
      label: HEALTH_FACTOR_LABELS.blockedTasks,
      enabled: true,
      available: true,
      impact: -impact,
      detail: `${input.blockedTasks} bloqueada${input.blockedTasks === 1 ? '' : 's'}`,
    })
  }

  if (input.factors.openRisks && input.openRisks > 0) {
    const impact = input.openRisks * 6
    score -= impact
    breakdown.push({
      id: 'openRisks',
      label: HEALTH_FACTOR_LABELS.openRisks,
      enabled: true,
      available: true,
      impact: -impact,
      detail: `${input.openRisks} riesgo${input.openRisks === 1 ? '' : 's'} abierto${input.openRisks === 1 ? '' : 's'}`,
    })
  }

  if (input.factors.projectSchedule && input.projectOverdue) {
    score -= 15
    breakdown.push({
      id: 'projectSchedule',
      label: HEALTH_FACTOR_LABELS.projectSchedule,
      enabled: true,
      available: true,
      impact: -15,
      detail: 'Proyecto fuera de plazo',
    })
  }

  if (input.factors.finance && input.finance) {
    if (input.finance.usagePercent >= 100) {
      score -= 12
      breakdown.push({
        id: 'finance',
        label: HEALTH_FACTOR_LABELS.finance,
        enabled: true,
        available: true,
        impact: -12,
        detail: 'Presupuesto superado',
      })
    } else if (input.finance.usagePercent >= 90) {
      score -= 6
      breakdown.push({
        id: 'finance',
        label: HEALTH_FACTOR_LABELS.finance,
        enabled: true,
        available: true,
        impact: -6,
        detail: `${input.finance.usagePercent}% del presupuesto usado`,
      })
    }
    if (input.finance.balance < 0) {
      score -= 8
      breakdown.push({
        id: 'finance',
        label: HEALTH_FACTOR_LABELS.finance,
        enabled: true,
        available: true,
        impact: -8,
        detail: 'Saldo negativo',
      })
    }
  }

  if (input.factors.milestones && input.milestonePercent != null) {
    const before = score
    score = score * 0.7 + input.milestonePercent * 0.3
    breakdown.push({
      id: 'milestones',
      label: HEALTH_FACTOR_LABELS.milestones,
      enabled: true,
      available: true,
      impact: Math.round(score - before),
      detail: `${input.milestonePercent}% de hitos completados`,
    })
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)))
  const label = healthLabelFromScore(finalScore)
  const color = healthColorFromScore(finalScore)

  return { score: finalScore, label, color, factors: input.factors, breakdown }
}

export function healthLabelFromScore(score: number): HealthLabel {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Atención'
  return 'Crítico'
}

export function healthColorFromScore(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#5bbce4'
  if (score >= 40) return '#f59e0b'
  return '#f4845f'
}

export function loadSavedHealthFactors(projectId: string): Partial<ProjectHealthFactors> | null {
  try {
    const raw = localStorage.getItem(`${HEALTH_STORAGE_KEY}-${projectId}`)
    return raw ? (JSON.parse(raw) as Partial<ProjectHealthFactors>) : null
  } catch {
    return null
  }
}

export function saveHealthFactors(projectId: string, factors: ProjectHealthFactors) {
  localStorage.setItem(`${HEALTH_STORAGE_KEY}-${projectId}`, JSON.stringify(factors))
}
