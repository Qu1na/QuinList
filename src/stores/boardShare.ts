import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BoardInvite, BoardInviteType, BoardMember, BoardParticipant, BoardShareRole, User } from '@/types'
import {
  buildInviteUrl,
  createBoardInvite,
  loadBoardInvites,
  loadBoardMemberUsers,
  loadBoardMembers,
  loadBoardParticipants,
  subscribeBoardShareRealtime,
} from '@/services/boardShare'
import { isMatuConfigured } from '@/lib/matu'
import { roleLabel } from '@/utils/permissions'
import { useAuthStore } from './auth'
import { useQuinListStore } from './quinlist'

export type ShareStep = 1 | 2 | 3
export type ShareMethod = BoardInviteType | null

export const useBoardShareStore = defineStore('boardShare', () => {
  const showModal = ref(false)
  const boardId = ref<string | null>(null)
  const step = ref<ShareStep>(1)
  const method = ref<ShareMethod>(null)
  const role = ref<BoardShareRole>('viewer')
  const maxUses = ref<number | null>(null)
  const email = ref('')
  const generatedInvite = ref<BoardInvite | null>(null)
  const invites = ref<BoardInvite[]>([])
  const members = ref<BoardMember[]>([])
  const memberUsers = ref<User[]>([])
  const participants = ref<BoardParticipant[]>([])
  const participantsBoardId = ref<string | null>(null)
  const loading = ref(false)
  const creating = ref(false)
  const copied = ref(false)
  const error = ref('')

  let unsubscribeModalRealtime: (() => void) | null = null

  function resetWizard() {
    step.value = 1
    method.value = null
    role.value = 'viewer'
    maxUses.value = null
    email.value = ''
    generatedInvite.value = null
    copied.value = false
    error.value = ''
  }

  function openModal(id: string) {
    boardId.value = id
    showModal.value = true
    resetWizard()
    loadShareData()
    unsubscribeModalRealtime?.()
    unsubscribeModalRealtime = subscribeBoardShareRealtime(id, () => {
      loadShareData()
      loadParticipants(id)
    })
  }

  function closeModal() {
    showModal.value = false
    boardId.value = null
    resetWizard()
    invites.value = []
    members.value = []
    memberUsers.value = []
    unsubscribeModalRealtime?.()
    unsubscribeModalRealtime = null
  }

  function selectMethod(m: BoardInviteType) {
    method.value = m
    maxUses.value = m === 'link' ? null : 1
    step.value = 2
    error.value = ''
  }

  function goBack() {
    if (step.value === 3) {
      step.value = 2
      generatedInvite.value = null
    } else if (step.value === 2) {
      step.value = 1
      method.value = null
    }
    error.value = ''
  }

  async function loadShareData() {
    const id = boardId.value
    if (!id) return

    loading.value = true
    try {
      invites.value = await loadBoardInvites(id)
      members.value = await loadBoardMembers(id)
      memberUsers.value = await loadBoardMemberUsers(members.value)
    } catch (err) {
      console.error('Error cargando compartir tablero:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadParticipants(boardIdParam: string) {
    const auth = useAuthStore()
    const store = useQuinListStore()

    try {
      if (isMatuConfigured()) {
        participants.value = await loadBoardParticipants(boardIdParam)
      } else {
        const board = store.boards.find((b) => b.id === boardIdParam)
        const ws = store.workspaces.find((w) => w.id === board?.workspaceId)
        const boardMembers = await loadBoardMembers(boardIdParam)
        const users = await loadBoardMemberUsers(boardMembers)
        const entries = new Map<string, BoardParticipant>()

        for (const m of ws?.members ?? []) {
          const user = auth.getUserById(m.userId)
          if (user) entries.set(user.id, { user, roleLabel: roleLabel(m.role) })
        }

        for (const m of boardMembers) {
          if (m.status !== 'accepted' || !m.userId) continue
          const user = users.find((u) => u.id === m.userId) ?? auth.getUserById(m.userId)
          if (!user || entries.has(user.id)) continue
          entries.set(user.id, {
            user,
            roleLabel: m.role === 'member' ? 'Miembro (tablero)' : 'Observador (tablero)',
          })
        }

        participants.value = Array.from(entries.values())
      }

      participantsBoardId.value = boardIdParam
      for (const p of participants.value) {
        auth.addUser(p.user)
      }
    } catch (err) {
      console.error('Error cargando participantes:', err)
    }
  }

  function boardSlug(): string {
    const store = useQuinListStore()
    const board = store.boards.find((b) => b.id === boardId.value)
    return board?.slug ?? 'tablero'
  }

  function inviteUrl(): string {
    if (!generatedInvite.value) return ''
    return buildInviteUrl(generatedInvite.value.boardSlug, generatedInvite.value.token)
  }

  async function copyLink() {
    const url = inviteUrl()
    if (!url) return
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  async function generateLinkInvite() {
    const auth = useAuthStore()
    if (!boardId.value || !auth.currentUserId) return

    creating.value = true
    error.value = ''
    try {
      generatedInvite.value = await createBoardInvite(
        boardId.value,
        boardSlug(),
        auth.currentUserId,
        {
          inviteType: 'link',
          role: role.value,
          maxUses: maxUses.value,
        },
      )
      step.value = 3
      await loadShareData()
      await loadParticipants(boardId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo crear el enlace'
    } finally {
      creating.value = false
    }
  }

  async function generateEmailInvite() {
    const auth = useAuthStore()
    if (!boardId.value || !auth.currentUserId) return

    if (!email.value.trim()) {
      error.value = 'Ingresa un correo electrónico'
      return
    }

    creating.value = true
    error.value = ''
    try {
      generatedInvite.value = await createBoardInvite(
        boardId.value,
        boardSlug(),
        auth.currentUserId,
        {
          inviteType: 'email',
          role: role.value,
          maxUses: 1,
          email: email.value.trim(),
        },
      )
      step.value = 3
      await loadShareData()
      await loadParticipants(boardId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo enviar la invitación'
    } finally {
      creating.value = false
    }
  }

  return {
    showModal,
    boardId,
    step,
    method,
    role,
    maxUses,
    email,
    generatedInvite,
    invites,
    members,
    memberUsers,
    participants,
    participantsBoardId,
    loading,
    creating,
    copied,
    error,
    openModal,
    closeModal,
    selectMethod,
    goBack,
    loadShareData,
    loadParticipants,
    boardSlug,
    inviteUrl,
    copyLink,
    generateLinkInvite,
    generateEmailInvite,
  }
})
