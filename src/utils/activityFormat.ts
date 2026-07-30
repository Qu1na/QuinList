import type { ActivityActionType } from '@/types/collaboration'
import type { ProjectActivity } from '@/types/projects'
import { getActivityIcon } from '@/utils/activityIcons'

const TOAST_META: Record<
  ActivityActionType,
  { accent: string; verb: (details: string) => string }
> = {
  task_created: { accent: '#10b981', verb: (d) => `creó la tarea «${d}»` },
  task_updated: { accent: '#2d7eb8', verb: (d) => `actualizó «${d}»` },
  task_deleted: { accent: '#ef4444', verb: (d) => `eliminó la tarea «${d}»` },
  task_completed: { accent: '#10b981', verb: (d) => `completó «${d}»` },
  task_moved: { accent: '#6554c0', verb: (d) => `movió «${d}»` },
  milestone_created: { accent: '#2d7eb8', verb: (d) => `creó el hito «${d}»` },
  milestone_completed: { accent: '#10b981', verb: (d) => `completó el hito «${d}»` },
  milestone_deleted: { accent: '#ef4444', verb: (d) => `eliminó el hito «${d}»` },
  deliverable_created: { accent: '#5bbce4', verb: (d) => `creó el entregable «${d}»` },
  deliverable_completed: { accent: '#10b981', verb: (d) => `completó el entregable «${d}»` },
  deliverable_deleted: { accent: '#ef4444', verb: (d) => `eliminó el entregable «${d}»` },
  note_created: { accent: '#f59e0b', verb: (d) => `añadió la nota «${d}»` },
  note_updated: { accent: '#d97706', verb: (d) => `actualizó la nota «${d}»` },
  note_deleted: { accent: '#ef4444', verb: (d) => `eliminó la nota «${d}»` },
  document_created: { accent: '#2d7eb8', verb: (d) => `añadió «${d}»` },
  file_uploaded: { accent: '#5bbce4', verb: (d) => `subió «${d}»` },
  risk_created: { accent: '#e56910', verb: (d) => `registró el riesgo «${d}»` },
  member_joined: { accent: '#6554c0', verb: () => 'se unió al proyecto' },
  member_removed: { accent: '#626f86', verb: () => 'salió del proyecto' },
  comment_added: { accent: '#6554c0', verb: (d) => `comentó en «${d}»` },
  comment_deleted: { accent: '#626f86', verb: (d) => `eliminó un comentario en «${d}»` },
  project_updated: { accent: '#2d7eb8', verb: () => 'actualizó el proyecto' },
  finance_added: { accent: '#10b981', verb: (d) => `registró «${d}»` },
  custom: { accent: '#626f86', verb: (d) => d },
}

function resolveActionType(action: string): ActivityActionType {
  if (action in TOAST_META) return action as ActivityActionType
  return mapLegacyAction(action)
}

export function getActivityParts(activity: ProjectActivity, userName: string) {
  const type = resolveActionType(activity.action)
  const meta = TOAST_META[type]
  const label = activity.entityTitle || activity.details || ''
  const verb =
    type === 'custom'
      ? `${activity.action}${label ? `: ${label}` : ''}`
      : meta.verb(label)
  return {
    type,
    icon: getActivityIcon(type),
    accent: meta.accent,
    userName,
    verb,
  }
}

export function formatActivityLine(activity: ProjectActivity, userName: string): string {
  const { userName: name, verb } = getActivityParts(activity, userName)
  return `${name} ${verb}`
}

export function formatActivityToast(
  activity: ProjectActivity,
  userName: string,
): { message: string; actionType: ActivityActionType; accent: string } {
  const type = resolveActionType(activity.action)
  const meta = TOAST_META[type]
  const label = activity.entityTitle || activity.details || ''
  return {
    actionType: type,
    accent: meta.accent,
    message:
      type === 'custom'
        ? `${userName} ${activity.action}${label ? `: ${label}` : ''}`
        : `${userName} ${meta.verb(label)}`,
  }
}

export function mapLegacyAction(action: string): ActivityActionType {
  const lower = action.toLowerCase()
  if (lower.includes('coment')) return 'comment_added'
  if (lower.includes('tarea') && lower.includes('añad')) return 'task_created'
  if (lower.includes('tarea') && lower.includes('elimin')) return 'task_deleted'
  if (lower.includes('tarea') && lower.includes('complet')) return 'task_completed'
  if (lower.includes('tarea') && lower.includes('mov')) return 'task_moved'
  if (lower.includes('tarea') && lower.includes('actualiz')) return 'task_updated'
  if (lower.includes('hito') && lower.includes('añad')) return 'milestone_created'
  if (lower.includes('hito') && lower.includes('complet')) return 'milestone_completed'
  if (lower.includes('hito') && lower.includes('elimin')) return 'milestone_deleted'
  if (lower.includes('entregable') && lower.includes('elimin')) return 'deliverable_deleted'
  if (lower.includes('entregable') && lower.includes('complet')) return 'deliverable_completed'
  if (lower.includes('entregable')) return 'deliverable_created'
  if (lower.includes('nota')) return 'note_created'
  if (lower.includes('documento')) return 'document_created'
  if (lower.includes('archivo') || lower.includes('subió')) return 'file_uploaded'
  if (lower.includes('riesgo')) return 'risk_created'
  if (lower.includes('equipo') || lower.includes('miembro')) return 'member_joined'
  if (lower.includes('finanz') || lower.includes('movimiento')) return 'finance_added'
  if (lower.includes('proyecto')) return 'project_updated'
  return 'custom'
}
