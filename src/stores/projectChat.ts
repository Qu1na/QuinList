import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ProjectChatMessage } from '@/types/projects'
import type { ProjectPresence } from '@/types/collaboration'
import {
  loadProjectChatMessages,
  sendProjectChatMessage,
  subscribeProjectChatRealtime,
  ensureUserProfile,
  type ProjectChatRealtimeEvent,
} from '@/services/projectChat'
import { markProjectChatRead, subscribeProjectChatReadState } from '@/services/projectChatRead'
import {
  clearProjectChatTyping,
  loadProjectChatTyping,
  setProjectChatTyping,
  subscribeProjectChatTyping,
} from '@/services/projectChatTyping'
import {
  loadProjectPresence,
  subscribeProjectPresenceRealtime,
  upsertProjectPresence,
  removeProjectPresence,
} from '@/services/projectPresence'
import { useAuthStore } from './auth'
import { generateId } from '@/utils/permissions'
import { resolveMentionedUserIds } from '@/utils/mentions'
import { notifyMention, notifyProjectChat } from '@/services/projectNotifications'
import { messagePreview } from '@/utils/renderMentions'
import { useProjectsStore } from './projects'

export const useProjectChatStore = defineStore('projectChat', () => {
  const projectId = ref<string | null>(null)
  const viewActive = ref(false)
  const messages = ref<ProjectChatMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  const lastReadAt = ref<string | null>(null)
  const teamUsers = ref<{ id: string; name: string; email?: string }[]>([])
  const typingUserIds = ref<string[]>([])
  const presence = ref<ProjectPresence[]>([])

  let unsubscribeRealtime: (() => void) | null = null
  let unsubscribeTyping: (() => void) | null = null
  let unsubscribeRead: (() => void) | null = null
  let unsubscribePresence: (() => void) | null = null
  let typingTimer: ReturnType<typeof setTimeout> | null = null
  let presenceTimer: ReturnType<typeof setInterval> | null = null
  let mounting: Promise<void> | null = null

  const otherMemberIds = computed(() => {
    const auth = useAuthStore()
    return teamUsers.value.map((u) => u.id).filter((id) => id !== auth.currentUserId)
  })

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

  async function refreshTyping() {
    if (!projectId.value) return
    const list = await loadProjectChatTyping(projectId.value)
    const auth = useAuthStore()
    typingUserIds.value = list.map((t) => t.userId).filter((id) => id !== auth.currentUserId)
  }

  async function refreshPresence() {
    if (!projectId.value) return
    presence.value = await loadProjectPresence(projectId.value)
  }

  function setViewActive(active: boolean) {
    viewActive.value = active
    if (active) void markRead()
  }

  async function markRead() {
    const auth = useAuthStore()
    if (!projectId.value || !auth.currentUserId) return
    lastReadAt.value = new Date().toISOString()

    const last = [...messages.value]
      .filter((m) => !m.pending && m.userId !== auth.currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (last) {
      await markProjectChatRead(projectId.value, auth.currentUserId, last.id)
    }
  }

  function upsertMessage(message: ProjectChatMessage) {
    const idx = messages.value.findIndex((m) => m.id === message.id)
    if (idx === -1) messages.value.push(message)
    else messages.value[idx] = message
    messages.value.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }

  function removeMessage(id: string) {
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  function replaceMessage(tempId: string, message: ProjectChatMessage) {
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx !== -1) messages.value[idx] = message
    else upsertMessage(message)
  }

  async function handleRealtime(event: ProjectChatRealtimeEvent, message: ProjectChatMessage) {
    if (message.projectId !== projectId.value) return
    await ensureUserProfile(message.userId)
    if (event === 'DELETE') {
      removeMessage(message.id)
      return
    }
    upsertMessage(message)
    if (viewActive.value) void markRead()
  }

  async function startPresenceHeartbeat(pid: string) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return
    await upsertProjectPresence(pid, auth.currentUserId, 'online', 'chat')
    presenceTimer = setInterval(() => {
      if (!projectId.value || !auth.currentUserId) return
      void upsertProjectPresence(projectId.value, auth.currentUserId, 'online', 'chat')
    }, 25_000)
  }

  async function stopPresenceHeartbeat() {
    const auth = useAuthStore()
    if (presenceTimer) {
      clearInterval(presenceTimer)
      presenceTimer = null
    }
    if (projectId.value && auth.currentUserId) {
      await removeProjectPresence(projectId.value, auth.currentUserId).catch(() => {})
    }
  }

  async function mount(projectIdParam: string) {
    if (projectId.value === projectIdParam && unsubscribeRealtime) return

    if (mounting) {
      await mounting
      if (projectId.value === projectIdParam && unsubscribeRealtime) return
    }

    mounting = (async () => {
      unsubscribeRealtime?.()
      unsubscribeTyping?.()
      unsubscribeRead?.()
      unsubscribePresence?.()
      await stopPresenceHeartbeat()

      projectId.value = projectIdParam
      const projectsStore = useProjectsStore()
      teamUsers.value = projectsStore
        .getProjectMembers(projectIdParam)
        .map((m) => {
          const auth = useAuthStore()
          const user = auth.getUserById(m.userId)
          return { id: m.userId, name: user?.name ?? 'Usuario', email: user?.email }
        })

      loading.value = messages.value.length === 0
      try {
        messages.value = await loadProjectChatMessages(projectIdParam)
      } finally {
        loading.value = false
      }

      await refreshPresence()
      await refreshTyping()
      if (viewActive.value) await markRead()
      else lastReadAt.value = new Date().toISOString()

      unsubscribeRealtime = subscribeProjectChatRealtime(projectIdParam, (event, message) => {
        handleRealtime(event, message).catch(console.error)
      })

      unsubscribeTyping = subscribeProjectChatTyping(projectIdParam, () => {
        refreshTyping().catch(console.error)
      })

      unsubscribeRead = subscribeProjectChatReadState(projectIdParam, async () => {
        messages.value = await loadProjectChatMessages(projectIdParam)
      })

      unsubscribePresence = subscribeProjectPresenceRealtime(projectIdParam, () => {
        refreshPresence().catch(console.error)
      })

      if (viewActive.value) await startPresenceHeartbeat(projectIdParam)
    })()

    try {
      await mounting
    } finally {
      mounting = null
    }
  }

  async function ensureMounted(projectIdParam: string) {
    if (!projectIdParam) return
    await mount(projectIdParam)
  }

  async function unmount() {
    viewActive.value = false
    await stopPresenceHeartbeat()
    await clearTyping()
    projectId.value = null
    messages.value = []
    teamUsers.value = []
    typingUserIds.value = []
    presence.value = []
    lastReadAt.value = null
    error.value = ''
    unsubscribeRealtime?.()
    unsubscribeTyping?.()
    unsubscribeRead?.()
    unsubscribePresence?.()
    unsubscribeRealtime = null
    unsubscribeTyping = null
    unsubscribeRead = null
    unsubscribePresence = null
    mounting = null
  }

  async function notifyTyping() {
    const auth = useAuthStore()
    if (!projectId.value || !auth.currentUserId) return
    await setProjectChatTyping(projectId.value, auth.currentUserId)
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      void clearTyping()
    }, 3000)
  }

  async function clearTyping() {
    const auth = useAuthStore()
    if (!projectId.value || !auth.currentUserId) return
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    await clearProjectChatTyping(projectId.value, auth.currentUserId)
  }

  async function send(text: string, file?: File | null) {
    const auth = useAuthStore()
    if (!projectId.value || !auth.currentUserId) return

    const trimmed = text.trim()
    if (!trimmed && !file) return

    await clearTyping()

    const mentionIds = resolveMentionedUserIds(trimmed, teamUsers.value)
    const preview = messagePreview(trimmed)
    error.value = ''
    const tempId = `pending-${generateId()}`
    const optimistic: ProjectChatMessage = {
      id: tempId,
      projectId: projectId.value,
      userId: auth.currentUserId,
      text: trimmed,
      mentionIds,
      createdAt: new Date().toISOString(),
      attachment: file
        ? { name: file.name, url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '', type: file.type, size: file.size }
        : null,
      status: 'sending',
      readBy: [],
      pending: true,
    }
    upsertMessage(optimistic)

    sending.value = true
    try {
      const msg = await sendProjectChatMessage(
        projectId.value,
        auth.currentUserId,
        trimmed,
        mentionIds,
        file,
      )
      replaceMessage(tempId, msg)
      await markRead()

      const projectsStore = useProjectsStore()
      const project = projectsStore.getProject(projectId.value)
      const authorName = auth.currentUser?.name ?? 'Alguien'

      if (mentionIds.length) {
        const recipients = mentionIds.filter((id) => id !== auth.currentUserId)
        notifyMention(recipients, project?.name ?? 'proyecto', preview, {
          projectId: projectId.value,
          tab: 'messages',
        })
      } else {
        const recipients = teamUsers.value
          .map((u) => u.id)
          .filter((id) => id !== auth.currentUserId)
        notifyProjectChat(recipients, project?.name ?? 'Proyecto', projectId.value, authorName, preview)
      }
    } catch (err) {
      removeMessage(tempId)
      error.value = err instanceof Error ? err.message : 'No se pudo enviar'
    } finally {
      sending.value = false
    }
  }

  return {
    projectId,
    viewActive,
    messages,
    loading,
    sending,
    error,
    unreadCount,
    teamUsers,
    typingUserIds,
    presence,
    otherMemberIds,
    ensureMounted,
    unmount,
    setViewActive,
    send,
    markRead,
    notifyTyping,
    clearTyping,
  }
})
