import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BoardPresence, BoardPresenceStatus } from '@/types'
import {
  isPresenceActive,
  loadBoardPresence,
  removeBoardPresence,
  subscribeBoardPresenceRealtime,
  upsertBoardPresence,
  type PresenceRealtimeEvent,
} from '@/services/boardPresence'
import { useAuthStore } from './auth'

export const useBoardPresenceStore = defineStore('boardPresence', () => {
  const boardId = ref<string | null>(null)
  const entries = ref<BoardPresence[]>([])
  const showPanel = ref(false)
  const loading = ref(false)

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let unsubscribeRealtime: (() => void) | null = null
  let currentStatus: BoardPresenceStatus = 'online'
  let currentActivity = ''

  const activeEntries = computed(() =>
    entries.value.filter((e) => isPresenceActive(e.lastSeen)),
  )

  const onlineCount = computed(
    () => activeEntries.value.filter((e) => e.status === 'online').length,
  )

  const editingCount = computed(
    () => activeEntries.value.filter((e) => e.status === 'editing').length,
  )

  function upsertLocalEntry(presence: BoardPresence) {
    if (!isPresenceActive(presence.lastSeen)) {
      entries.value = entries.value.filter((e) => e.userId !== presence.userId)
      return
    }
    const idx = entries.value.findIndex((e) => e.userId === presence.userId)
    if (idx === -1) entries.value.push(presence)
    else entries.value[idx] = presence
  }

  function removeLocalEntry(userId: string) {
    entries.value = entries.value.filter((e) => e.userId !== userId)
  }

  function handleRealtime(event: PresenceRealtimeEvent, presence: BoardPresence) {
    if (presence.boardId !== boardId.value) return
    if (event === 'DELETE') {
      removeLocalEntry(presence.userId)
      return
    }
    upsertLocalEntry(presence)
  }

  async function sendHeartbeat() {
    const auth = useAuthStore()
    if (!boardId.value || !auth.currentUserId) return

    try {
      const presence = await upsertBoardPresence(
        boardId.value,
        auth.currentUserId,
        currentStatus,
        currentActivity,
      )
      upsertLocalEntry(presence)
    } catch (err) {
      console.error('Error enviando presencia:', err)
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    void sendHeartbeat()
    heartbeatTimer = setInterval(() => {
      void sendHeartbeat()
    }, 20_000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  async function setActivity(status: BoardPresenceStatus, activity = '') {
    currentStatus = status
    currentActivity = activity
    await sendHeartbeat()
  }

  async function mount(boardIdParam: string) {
    if (boardId.value === boardIdParam && heartbeatTimer) return

    await unmount()
    boardId.value = boardIdParam
    loading.value = true

    try {
      entries.value = await loadBoardPresence(boardIdParam)
      unsubscribeRealtime = subscribeBoardPresenceRealtime(boardIdParam, handleRealtime)
      currentStatus = 'online'
      currentActivity = ''
      startHeartbeat()
    } catch (err) {
      console.error('Error montando presencia:', err)
    } finally {
      loading.value = false
    }
  }

  async function unmount() {
    const auth = useAuthStore()
    const id = boardId.value
    const userId = auth.currentUserId

    stopHeartbeat()
    unsubscribeRealtime?.()
    unsubscribeRealtime = null

    if (id && userId) {
      try {
        await removeBoardPresence(id, userId)
      } catch {
        /* ignore */
      }
    }

    boardId.value = null
    entries.value = []
    showPanel.value = false
    currentStatus = 'online'
    currentActivity = ''
  }

  function isUserOnline(userId: string): boolean {
    const entry = activeEntries.value.find((e) => e.userId === userId)
    return Boolean(entry)
  }

  function getUserPresence(userId: string): BoardPresence | undefined {
    return activeEntries.value.find((e) => e.userId === userId)
  }

  function openPanel() {
    showPanel.value = true
  }

  function closePanel() {
    showPanel.value = false
  }

  function togglePanel() {
    showPanel.value = !showPanel.value
  }

  return {
    boardId,
    entries,
    activeEntries,
    onlineCount,
    editingCount,
    showPanel,
    loading,
    mount,
    unmount,
    setActivity,
    isUserOnline,
    getUserPresence,
    openPanel,
    closePanel,
    togglePanel,
  }
})
