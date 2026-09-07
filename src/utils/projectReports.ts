import type { ChartBar, ChartPoint } from '@/utils/workspaceStats'
import type {
  ProjectActivity,
  ProjectDeliverable,
  ProjectMember,
  ProjectTask,
  ProjectTimeEntry,
} from '@/types/projects'
import { TASK_STATUS_LABELS } from '@/utils/projectStats'
import { instantToCalendarDate, lastCalendarDays } from '@/utils/datetime'

export const REPORT_USER_COLORS = [
  '#2d7eb8',
  '#5bbce4',
  '#6554c0',
  '#f4845f',
  '#10b981',
  '#e56910',
  '#172b4d',
  '#8b5cf6',
]

export const DELIVERABLE_STATUS_LABELS: Record<ProjectDeliverable['status'], string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  delivered: 'Entregado',
  approved: 'Aprobado',
}

export const DELIVERABLE_STATUS_COLORS: Record<ProjectDeliverable['status'], string> = {
  pending: '#94a3b8',
  in_progress: '#2d7eb8',
  delivered: '#5bbce4',
  approved: '#10b981',
}

export interface MemberWorkloadRow {
  userId: string
  name: string
  tasksTotal: number
  tasksDone: number
  deliverablesTotal: number
  deliverablesApproved: number
  minutesLogged: number
  recentActivity: number
  recentEvents: { id: string; action: string; details: string; createdAt: string }[]
  collaborators: { userId: string; name: string; sharedTasks: number }[]
  activeDays: number
}

function colorAt(index: number): string {
  return REPORT_USER_COLORS[index % REPORT_USER_COLORS.length]!
}

function countByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  labelFn: (key: string) => string,
): ChartBar[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([key, value], i) => ({
      label: labelFn(key),
      value,
      color: colorAt(i),
    }))
    .sort((a, b) => b.value - a.value)
}

export function tasksByStatus(tasks: ProjectTask[]): ChartBar[] {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    const label = TASK_STATUS_LABELS[task.status]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  const statusColors: Record<string, string> = {
    'Por hacer': '#94a3b8',
    'En progreso': '#2d7eb8',
    'En revisión': '#6554c0',
    Completada: '#10b981',
    Bloqueada: '#ef4444',
  }
  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value,
    color: statusColors[label] ?? '#626f86',
  }))
}

export function tasksByAssignee(
  tasks: ProjectTask[],
  resolveName: (userId: string) => string,
): ChartBar[] {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    if (!task.assigneeIds.length) {
      counts.set('__unassigned__', (counts.get('__unassigned__') ?? 0) + 1)
      continue
    }
    for (const userId of task.assigneeIds) {
      counts.set(userId, (counts.get(userId) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([key, value], i) => ({
      label: key === '__unassigned__' ? 'Sin asignar' : resolveName(key),
      value,
      color: colorAt(i),
    }))
    .sort((a, b) => b.value - a.value)
}

export function tasksCompletedByUser(
  tasks: ProjectTask[],
  resolveName: (userId: string) => string,
): ChartBar[] {
  const done = tasks.filter((t) => t.status === 'done')
  return countByKey(
    done.flatMap((t) => (t.assigneeIds.length ? t.assigneeIds.map((id) => ({ userId: id })) : [{ userId: '__unassigned__' }])),
    (row) => row.userId,
    (key) => (key === '__unassigned__' ? 'Sin asignar' : resolveName(key)),
  )
}

export function deliverablesByStatus(deliverables: ProjectDeliverable[]): ChartBar[] {
  const counts = new Map<ProjectDeliverable['status'], number>()
  for (const d of deliverables) {
    counts.set(d.status, (counts.get(d.status) ?? 0) + 1)
  }
  return (['pending', 'in_progress', 'delivered', 'approved'] as const)
    .filter((status) => (counts.get(status) ?? 0) > 0)
    .map((status) => ({
      label: DELIVERABLE_STATUS_LABELS[status],
      value: counts.get(status) ?? 0,
      color: DELIVERABLE_STATUS_COLORS[status],
    }))
}

export function deliverablesByAssignee(
  deliverables: ProjectDeliverable[],
  resolveName: (userId: string) => string,
): ChartBar[] {
  return countByKey(
    deliverables,
    (d) => d.assigneeId ?? '__unassigned__',
    (key) => (key === '__unassigned__' ? 'Sin asignar' : resolveName(key)),
  )
}

export function activitiesByUser(
  activities: ProjectActivity[],
  resolveName: (userId: string) => string,
  withinDays = 30,
): ChartBar[] {
  const cutoff = Date.now() - withinDays * 86_400_000
  const recent = activities.filter((a) => new Date(a.createdAt).getTime() >= cutoff)
  return countByKey(recent, (a) => a.userId, (id) => resolveName(id))
}

export function activityTimeline(activities: ProjectActivity[], days = 14): ChartPoint[] {
  const daysList = lastCalendarDays(days)
  return daysList.map(({ key, label }) => ({
    label,
    value: activities.filter((a) => instantToCalendarDate(a.createdAt) === key).length,
  }))
}

export function timeLoggedByUser(
  entries: ProjectTimeEntry[],
  resolveName: (userId: string) => string,
): ChartBar[] {
  const minutes = new Map<string, number>()
  for (const entry of entries) {
    minutes.set(entry.userId, (minutes.get(entry.userId) ?? 0) + entry.minutes)
  }
  return Array.from(minutes.entries())
    .map(([userId, totalMinutes], i) => ({
      label: resolveName(userId),
      value: Math.round((totalMinutes / 60) * 10) / 10,
      color: colorAt(i),
    }))
    .sort((a, b) => b.value - a.value)
}

export function memberWorkload(
  members: ProjectMember[],
  tasks: ProjectTask[],
  deliverables: ProjectDeliverable[],
  activities: ProjectActivity[],
  timeEntries: ProjectTimeEntry[],
  resolveName: (userId: string) => string,
): MemberWorkloadRow[] {
  const cutoff = Date.now() - 7 * 86_400_000
  const activityWindow = Date.now() - 30 * 86_400_000

  return members.map((member) => {
    const userTasks = tasks.filter((t) => t.assigneeIds.includes(member.userId))
    const userDeliverables = deliverables.filter((d) => d.assigneeId === member.userId)
    const userMinutes = timeEntries
      .filter((e) => e.userId === member.userId)
      .reduce((sum, e) => sum + e.minutes, 0)
    const userRecent = activities
      .filter(
        (a) => a.userId === member.userId && new Date(a.createdAt).getTime() >= cutoff,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const collabCounts = new Map<string, number>()
    for (const task of userTasks) {
      for (const otherId of task.assigneeIds) {
        if (otherId === member.userId) continue
        collabCounts.set(otherId, (collabCounts.get(otherId) ?? 0) + 1)
      }
    }
    const collaborators = Array.from(collabCounts.entries())
      .map(([userId, sharedTasks]) => ({
        userId,
        name: resolveName(userId),
        sharedTasks,
      }))
      .sort((a, b) => b.sharedTasks - a.sharedTasks)
      .slice(0, 5)

    const dayKeys = new Set<string>()
    for (const a of activities) {
      if (a.userId !== member.userId) continue
      if (new Date(a.createdAt).getTime() < activityWindow) continue
      dayKeys.add(instantToCalendarDate(a.createdAt))
    }
    for (const e of timeEntries) {
      if (e.userId !== member.userId) continue
      const when = e.entryDate || e.createdAt
      if (!when || new Date(when).getTime() < activityWindow) continue
      dayKeys.add(instantToCalendarDate(when))
    }

    return {
      userId: member.userId,
      name: resolveName(member.userId),
      tasksTotal: userTasks.length,
      tasksDone: userTasks.filter((t) => t.status === 'done').length,
      deliverablesTotal: userDeliverables.length,
      deliverablesApproved: userDeliverables.filter((d) => d.status === 'approved').length,
      minutesLogged: userMinutes,
      recentActivity: userRecent.length,
      recentEvents: userRecent.slice(0, 5).map((a) => ({
        id: a.id,
        action: a.action,
        details: a.details,
        createdAt: a.createdAt,
      })),
      collaborators,
      activeDays: dayKeys.size,
    }
  })
}

export function formatLoggedHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours} h`
}
