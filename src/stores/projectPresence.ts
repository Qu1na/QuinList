import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ProjectPresence, ProjectPresenceStatus } from '@/types/collaboration'
import {
  isProjectPresenceActive,
  loadProjectPresence,
  removeProjectPresence,
  subscribeProjectPresenceRealtime,
  upsertProjectPresence,
  type ProjectPresenceEvent,
} from '@/services/projectPresence'
import { useAuthStore } from './auth'

export const useProjectPresenceStore = defineStore('projectPresence', () => {
  const projectId = ref<string | null>(null)
  const entries = ref<ProjectPresence[]>([])

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let unsubscribeRealtime: (() => void) | null = null
  let currentStatus: ProjectPresenceStatus = 'online'
  let currentActivity = ''

  const activeEntries = computed(() =>
    entries.value.filter((e) => isProjectPresenceActive(e.lastSeen)),
  )

  const onlineCount = computed(() => activeEntries.value.length)

  const editingUsers = computed(() =>
    activeEntries.value.filter((e) => e.status === 'editing'),
  )

  function upsertLocal(presence: ProjectPresence) {
    if (!isProjectPresenceActive(presence.lastSeen)) {
      entries.value = entries.value.filter((e) => e.userId !== presence.userId)
      return
    }
    const idx = entries.value.findIndex((e) => e.userId === presence.userId)
    if (idx === -1) entries.value.push(presence)
    else entries.value[idx] = presence
  }

  function handleRealtime(event: ProjectPresenceEvent, presence: ProjectPresence) {
    if (presence.projectId !== projectId.value) return
    if (event === 'DELETE') {
      entries.value = entries.value.filter((e) => e.userId !== presence.userId)
      return
    }
    upsertLocal(presence)
  }

  async function sendHeartbeat() {
    const auth = useAuthStore()
    if (!projectId.value || !auth.currentUserId) return
    try {
      const presence = await upsertProjectPresence(
        projectId.value,
        auth.currentUserId,
        currentStatus,
        currentActivity,
      )
      upsertLocal(presence)
    } catch (err) {
      console.error('[presence] heartbeat error:', err)
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    void sendHeartbeat()
    heartbeatTimer = setInterval(() => void sendHeartbeat(), 20_000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  async function setActivity(status: ProjectPresenceStatus, activity = '') {
    currentStatus = status
    currentActivity = activity
    await sendHeartbeat()
  }

  async function mount(projectIdParam: string) {
    if (projectId.value === projectIdParam && heartbeatTimer) return

    await unmount()
    projectId.value = projectIdParam

    try {
      entries.value = await loadProjectPresence(projectIdParam)
      unsubscribeRealtime = subscribeProjectPresenceRealtime(projectIdParam, handleRealtime)
      currentStatus = 'online'
      currentActivity = ''
      startHeartbeat()
    } catch (err) {
      console.error('[presence] mount error:', err)
    }
  }

  async function unmount() {
    const auth = useAuthStore()
    const id = projectId.value
    const userId = auth.currentUserId

    stopHeartbeat()
    unsubscribeRealtime?.()
    unsubscribeRealtime = null

    if (id && userId) {
      try {
        await removeProjectPresence(id, userId)
      } catch {
        /* ignore */
      }
    }

    projectId.value = null
    entries.value = []
    currentStatus = 'online'
    currentActivity = ''
  }

  function isUserOnline(userId: string): boolean {
    return activeEntries.value.some((e) => e.userId === userId)
  }

  function getUserPresence(userId: string): ProjectPresence | undefined {
    return activeEntries.value.find((e) => e.userId === userId)
  }

  return {
    projectId,
    entries,
    activeEntries,
    onlineCount,
    editingUsers,
    mount,
    unmount,
    setActivity,
    isUserOnline,
    getUserPresence,
  }
})
