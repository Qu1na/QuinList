import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActivityActionType, CollabToast } from '@/types/collaboration'
import type { ProjectActivity } from '@/types/projects'
import { useAuthStore } from '@/stores/auth'
import { formatActivityToast } from '@/utils/activityFormat'
import { generateId } from '@/utils/permissions'

const DEFAULT_DURATION = 2800
const MAX_TOASTS = 2
const DEDUPE_MS = 8000

/** Acciones muy frecuentes que no merecen interrumpir al usuario. */
const SILENT_ACTIONS = new Set<ActivityActionType>([
  'task_moved',
  'task_updated',
  'comment_deleted',
])

function resolveActionType(action: string): ActivityActionType {
  const known: ActivityActionType[] = [
    'task_created',
    'task_updated',
    'task_deleted',
    'task_completed',
    'task_moved',
    'milestone_created',
    'milestone_completed',
    'milestone_deleted',
    'deliverable_created',
    'deliverable_completed',
    'deliverable_deleted',
    'document_created',
    'file_uploaded',
    'risk_created',
    'member_joined',
    'member_removed',
    'comment_added',
    'comment_deleted',
    'project_updated',
    'finance_added',
    'custom',
  ]
  if (known.includes(action as ActivityActionType)) return action as ActivityActionType
  return 'custom'
}

export const useCollaborationStore = defineStore('collaboration', () => {
  const toasts = ref<CollabToast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const seenActivityIds = new Set<string>()
  const recentMessageAt = new Map<string, number>()

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  function dismissAll() {
    for (const toast of toasts.value) dismissToast(toast.id)
  }

  function pushToast(input: Omit<CollabToast, 'id'>) {
    const id = generateId()
    const toast: CollabToast = { ...input, id }
    toasts.value = [toast, ...toasts.value].slice(0, MAX_TOASTS)

    const timer = setTimeout(() => dismissToast(id), input.duration ?? DEFAULT_DURATION)
    timers.set(id, timer)
  }

  function shouldSkipActivity(activity: ProjectActivity, message: string): boolean {
    const action = resolveActionType(activity.action)
    if (SILENT_ACTIONS.has(action)) return true

    if (seenActivityIds.has(activity.id)) return true
    seenActivityIds.add(activity.id)
    setTimeout(() => seenActivityIds.delete(activity.id), 30_000)

    const dedupeKey = `${activity.userId}:${activity.entityId ?? ''}:${message}`
    const lastAt = recentMessageAt.get(dedupeKey)
    const now = Date.now()
    if (lastAt && now - lastAt < DEDUPE_MS) return true
    recentMessageAt.set(dedupeKey, now)

    return false
  }

  function handleRemoteActivity(activity: ProjectActivity) {
    const auth = useAuthStore()
    if (activity.userId === auth.currentUserId) return

    const user = auth.getUserById(activity.userId)
    const userName = user?.name ?? 'Un miembro del equipo'
    const { message, actionType, accent } = formatActivityToast(activity, userName)

    if (shouldSkipActivity(activity, message)) return

    pushToast({
      message,
      actionType,
      accent,
      userId: activity.userId,
      userName,
      duration: DEFAULT_DURATION,
    })
  }

  function destroy() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    toasts.value = []
    seenActivityIds.clear()
    recentMessageAt.clear()
  }

  return {
    toasts,
    pushToast,
    dismissToast,
    dismissAll,
    handleRemoteActivity,
    destroy,
  }
})
