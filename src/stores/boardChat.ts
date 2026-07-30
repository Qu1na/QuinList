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
import { resolveMentionedUserIds } from '@/utils/mentions'
import { notifyMention } from '@/services/projectNotifications'
import { messagePreview } from '@/utils/renderMentions'
import { useQuinListStore } from './quinlist'

export const useBoardChatStore = defineStore('boardChat', () => {
  const boardId = ref<string | null>(null)
  const viewActive = ref(false)
  const messages = ref<BoardMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  const lastReadAt = ref<string | null>(null)

  let unsubscribeRealtime: (() => void) | null = null
  let mounting: Promise<void> | null = null

  const isActive = computed(() => boardId.value != null)

  const unreadCount = computed(() => {
    if (viewActive.value) return 0
    const auth = useAuthStore()
    const since = lastReadAt.value
    if (!since) {
      return messages.value.filter(
        (m) => !m.pending && m.userId !== auth.currentUserId,
      ).length
    }
    return messages.value.filter(
      (m) =>
        !m.pending &&
        m.createdAt > since &&
        m.userId !== auth.currentUserId,
    ).length
  })

  function setViewActive(active: boolean) {
    viewActive.value = active
    if (active) markRead()
  }

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
      if (!viewActive.value) {
        lastReadAt.value = new Date().toISOString()
      }

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
    viewActive.value = false
    boardId.value = null
    messages.value = []
    lastReadAt.value = null
    error.value = ''
    unsubscribeRealtime?.()
    unsubscribeRealtime = null
    mounting = null
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
      const quinlist = useQuinListStore()
      const ws = quinlist.currentWorkspace
      const teamUsers = (ws?.members ?? []).map((m) => {
        const authStore = useAuthStore()
        const user = authStore.getUserById(m.userId)
        return { id: m.userId, name: user?.name ?? '', email: user?.email }
      })
      const mentionIds = resolveMentionedUserIds(trimmed, teamUsers)
      const msg = await sendBoardMessage(boardId.value, auth.currentUserId, trimmed, file, mentionIds)
      replaceMessage(tempId, msg)
      markRead()
      if (mentionIds.length) {
        const board = quinlist.boards.find((b) => b.id === boardId.value)
        const recipients = mentionIds.filter((id) => id !== auth.currentUserId)
        notifyMention(recipients, board?.title ?? 'tablero', messagePreview(trimmed), {
          boardId: boardId.value,
        })
      }
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
    viewActive,
    isActive,
    messages,
    loading,
    sending,
    error,
    unreadCount,
    mount,
    ensureMounted,
    unmount,
    setViewActive,
    refresh,
    send,
    destroy,
    markRead,
  }
})
