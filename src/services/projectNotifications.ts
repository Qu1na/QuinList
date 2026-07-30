import type { NotificationType } from '@/types'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

type NotifyInput = {
  type: NotificationType
  title: string
  message: string
  userId: string
  metadata?: {
    boardId?: string
    cardId?: string
    workspaceId?: string
    projectId?: string
    taskId?: string
    tab?: string
  }
}

function pushToUser(input: NotifyInput) {
  const auth = useAuthStore()
  if (!input.userId || input.userId === auth.currentUserId) return
  void useNotificationStore().push(input)
}

export function notifyUsers(
  userIds: string[],
  input: Omit<NotifyInput, 'userId'>,
) {
  const unique = [...new Set(userIds)]
  for (const userId of unique) {
    pushToUser({ ...input, userId })
  }
}

export function notifyTaskAssigned(
  assigneeIds: string[],
  taskTitle: string,
  projectId: string,
  taskId: string,
  projectName: string,
) {
  notifyUsers(assigneeIds, {
    type: 'task_assigned',
    title: 'Tarea asignada',
    message: `«${taskTitle}» en ${projectName}`,
    metadata: { projectId, taskId, tab: 'tasks' },
  })
}

export function notifyTaskComment(
  recipientIds: string[],
  taskTitle: string,
  projectId: string,
  taskId: string,
  authorName: string,
) {
  notifyUsers(recipientIds, {
    type: 'task_commented',
    title: 'Nuevo comentario',
    message: `${authorName} comentó en «${taskTitle}»`,
    metadata: { projectId, taskId, tab: 'tasks' },
  })
}

export function notifyMention(
  userIds: string[],
  contextTitle: string,
  preview: string,
  metadata: NotifyInput['metadata'],
) {
  notifyUsers(userIds, {
    type: 'mention',
    title: `Te mencionaron en ${contextTitle}`,
    message: preview.slice(0, 120),
    metadata,
  })
}

export function notifyProjectChat(
  recipientIds: string[],
  projectName: string,
  projectId: string,
  authorName: string,
  preview: string,
) {
  notifyUsers(recipientIds, {
    type: 'project_chat',
    title: `Chat · ${projectName}`,
    message: `${authorName}: ${preview.slice(0, 100)}`,
    metadata: { projectId, tab: 'messages' },
  })
}
