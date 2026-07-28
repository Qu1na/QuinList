import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BoardMessage } from '@/types'
import {
  loadBoardMessages,
  sendBoardMessage,
  subscribeBoardChatRealtime,
  ensureUserProfile,
  type ChatRealtimeEvent,
} from '@/services/boardChat'
import { useAuthStore } from './auth'
import { generateId } from '@/utils/permissions'

export const useBoardChatStore = defineStore('boardChat', () => {
  const boardId = ref<string | null>(null)
  const isOpen = ref(false)
  const messages = ref<BoardMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  const lastReadAt = ref<string | null>(null)

  let unsubscribeRealtime: (() => void) | null = null
  let mounting: Promise<void> | null = null

  const isActive = computed(() => boardId.value != null)

  const unreadCount = computed(() => {
    if (isOpen.value || !lastReadAt.value) return 0
    const auth = useAuthStore()
    return messages.value.filter(
      (m) =>
        !m.pending &&
        m.createdAt > lastReadAt.value! &&
        m.userId !== auth.currentUserId,
    ).length
  })

  function markRead() {
    lastReadAt.value = new Date().toISOString()
  }

  function upsertMessage(message: BoardMessage) {
    const idx = messages.value.findIndex((m) => m.id === message.id)
    if (idx === -1) {
      messages.value.push(message)
    } else {
      messages.value[idx] = message
    }
    messages.value.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }

  function removeMessage(id: string) {
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  function replaceMessage(tempId: string, message: BoardMessage) {
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx !== -1) {
      messages.value[idx] = message
    } else {
      upsertMessage(message)
    }
  }

  async function handleRealtime(event: ChatRealtimeEvent, message: BoardMessage) {
    if (message.boardId !== boardId.value) return

    await ensureUserProfile(message.userId)

    if (event === 'DELETE') {
      removeMessage(message.id)
      return
    }

    const auth = useAuthStore()
    const withoutPendingDupes = messages.value.filter(
      (m) =>
        !(
          m.pending &&
          m.userId === message.userId &&
          m.text === message.text &&
          m.userId === auth.currentUserId
        ),
    )
    messages.value = withoutPendingDupes
    upsertMessage(message)

    if (!isOpen.value && message.userId !== auth.currentUserId) {
      // unreadCount picks this up via lastReadAt
    }
  }

  async function mount(boardIdParam: string) {
    if (boardId.value === boardIdParam && unsubscribeRealtime) return

    if (mounting) {
      await mounting
      if (boardId.value === boardIdParam && unsubscribeRealtime) return
    }

    mounting = (async () => {
      unsubscribeRealtime?.()
      unsubscribeRealtime = null

      boardId.value = boardIdParam
      await refresh()
      lastReadAt.value = new Date().toISOString()

      unsubscribeRealtime = subscribeBoardChatRealtime(boardIdParam, (event, message) => {
        handleRealtime(event, message).catch(console.error)
      })
    })()

    try {
      await mounting
    } finally {
      mounting = null
    }
  }

  async function ensureMounted(boardIdParam: string) {
    if (!boardIdParam) return
    await mount(boardIdParam)
  }

  function unmount() {
    isOpen.value = false
    boardId.value = null
    messages.value = []
    lastReadAt.value = null
    error.value = ''
    unsubscribeRealtime?.()
    unsubscribeRealtime = null
    mounting = null
  }

  async function toggle(boardIdParam?: string) {
    if (boardIdParam) await ensureMounted(boardIdParam)
    isOpen.value = !isOpen.value
    if (isOpen.value) markRead()
  }

  async function open(boardIdParam?: string) {
    if (boardIdParam) await ensureMounted(boardIdParam)
    isOpen.value = true
    markRead()
  }

  function minimize() {
    isOpen.value = false
    markRead()
  }

  async function refresh() {
    if (!boardId.value) return
    loading.value = messages.value.length === 0
    try {
      messages.value = await loadBoardMessages(boardId.value)
    } catch (err) {
      console.error('Error cargando chat:', err)
      messages.value = []
    } finally {
      loading.value = false
    }
  }

  async function send(text: string, file?: File | null) {
    const auth = useAuthStore()
    if (!boardId.value || !auth.currentUserId) return

    const trimmed = text.trim()
    if (!trimmed && !file) return

    error.value = ''
    const tempId = `pending-${generateId()}`
    const optimistic: BoardMessage = {
      id: tempId,
      boardId: boardId.value,
      userId: auth.currentUserId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      attachment: file
        ? { name: file.name, url: '', type: file.type, size: file.size }
        : null,
      pending: true,
    }
    upsertMessage(optimistic)

    sending.value = true
    try {
      const msg = await sendBoardMessage(boardId.value, auth.currentUserId, trimmed, file)
      replaceMessage(tempId, msg)
      markRead()
    } catch (err) {
      removeMessage(tempId)
      error.value = err instanceof Error ? err.message : 'No se pudo enviar'
    } finally {
      sending.value = false
    }
  }

  function destroy() {
    unmount()
  }

  return {
    boardId,
    isOpen,
    isActive,
    messages,
    loading,
    sending,
    error,
    unreadCount,
    mount,
    ensureMounted,
    unmount,
    toggle,
    open,
    minimize,
    refresh,
    send,
    destroy,
    markRead,
  }
})
