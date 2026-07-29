import type { ActivityActionType } from '@/types/collaboration'
import type { ProjectActivity } from '@/types/projects'

const TOAST_META: Record<
  ActivityActionType,
  { emoji: string; accent: string; verb: (details: string) => string }
> = {
  task_created: { emoji: '🟢', accent: '#10b981', verb: (d) => `creó la tarea «${d}»` },
  task_updated: { emoji: '🔵', accent: '#2d7eb8', verb: (d) => `actualizó «${d}»` },
  task_deleted: { emoji: '🔴', accent: '#ef4444', verb: (d) => `eliminó la tarea «${d}»` },
  task_completed: { emoji: '✅', accent: '#10b981', verb: (d) => `completó «${d}»` },
  task_moved: { emoji: '🟣', accent: '#6554c0', verb: (d) => `movió «${d}»` },
  milestone_created: { emoji: '🔵', accent: '#2d7eb8', verb: (d) => `creó el hito «${d}»` },
  milestone_completed: { emoji: '🏁', accent: '#10b981', verb: (d) => `completó el hito «${d}»` },
  milestone_deleted: { emoji: '🔴', accent: '#ef4444', verb: (d) => `eliminó el hito «${d}»` },
  deliverable_created: { emoji: '📦', accent: '#5bbce4', verb: (d) => `creó el entregable «${d}»` },
  deliverable_completed: { emoji: '🟠', accent: '#e56910', verb: (d) => `completó «${d}»` },
  deliverable_deleted: { emoji: '🔴', accent: '#ef4444', verb: (d) => `eliminó el entregable «${d}»` },
  document_created: { emoji: '📄', accent: '#2d7eb8', verb: (d) => `añadió «${d}»` },
  file_uploaded: { emoji: '📎', accent: '#5bbce4', verb: (d) => `subió «${d}»` },
  risk_created: { emoji: '⚠️', accent: '#e56910', verb: (d) => `registró el riesgo «${d}»` },
  member_joined: { emoji: '👋', accent: '#6554c0', verb: () => 'se unió al proyecto' },
  member_removed: { emoji: '👋', accent: '#626f86', verb: () => 'salió del proyecto' },
  comment_added: { emoji: '💬', accent: '#6554c0', verb: (d) => `comentó en «${d}»` },
  comment_deleted: { emoji: '🔴', accent: '#626f86', verb: (d) => `eliminó un comentario en «${d}»` },
  project_updated: { emoji: '✏️', accent: '#2d7eb8', verb: () => 'actualizó el proyecto' },
  finance_added: { emoji: '💰', accent: '#10b981', verb: (d) => `registró «${d}»` },
  custom: { emoji: '🔔', accent: '#626f86', verb: (d) => d },
}

function resolveActionType(action: string): ActivityActionType {
  if (action in TOAST_META) return action as ActivityActionType
  return mapLegacyAction(action)
}

export function formatActivityLine(activity: ProjectActivity, userName: string): string {
  const type = resolveActionType(activity.action)
  const meta = TOAST_META[type]
  const label = activity.entityTitle || activity.details || ''
  if (type === 'custom') {
    return `${userName} ${activity.action}${label ? `: ${label}` : ''}`
  }
  return `${userName} ${meta.verb(label)}`
}

export function formatActivityToast(
  activity: ProjectActivity,
  userName: string,
): { message: string; emoji: string; accent: string } {
  const type = resolveActionType(activity.action)
  const meta = TOAST_META[type]
  const label = activity.entityTitle || activity.details || ''
  return {
    emoji: meta.emoji,
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
  if (lower.includes('entregable')) return 'deliverable_created'
  if (lower.includes('documento')) return 'document_created'
  if (lower.includes('archivo') || lower.includes('subió')) return 'file_uploaded'
  if (lower.includes('riesgo')) return 'risk_created'
  if (lower.includes('equipo') || lower.includes('miembro')) return 'member_joined'
  if (lower.includes('finanz') || lower.includes('movimiento')) return 'finance_added'
  if (lower.includes('proyecto')) return 'project_updated'
  return 'custom'
}
