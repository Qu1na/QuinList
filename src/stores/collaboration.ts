import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CollabToast } from '@/types/collaboration'
import type { ProjectActivity } from '@/types/projects'
import { useAuthStore } from '@/stores/auth'
import { formatActivityToast } from '@/utils/activityFormat'
import { generateId } from '@/utils/permissions'

const DEFAULT_DURATION = 4500
const MAX_TOASTS = 5

export const useCollaborationStore = defineStore('collaboration', () => {
  const toasts = ref<CollabToast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  function pushToast(input: Omit<CollabToast, 'id'>) {
    const id = generateId()
    const toast: CollabToast = { ...input, id }
    toasts.value = [toast, ...toasts.value].slice(0, MAX_TOASTS)

    const timer = setTimeout(() => dismissToast(id), input.duration ?? DEFAULT_DURATION)
    timers.set(id, timer)
  }

  function handleRemoteActivity(activity: ProjectActivity) {
    const auth = useAuthStore()
    if (activity.userId === auth.currentUserId) return

    const user = auth.getUserById(activity.userId)
    const userName = user?.name ?? 'Un miembro del equipo'
    const { message, emoji, accent } = formatActivityToast(activity, userName)

    pushToast({
      message,
      emoji,
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
  }

  return {
    toasts,
    pushToast,
    dismissToast,
    handleRemoteActivity,
    destroy,
  }
})
