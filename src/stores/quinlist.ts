import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Workspace,
  Board,
  Card,
  List,
  Label,
  Comment,
  ChecklistItem,
  Attachment,
  UserRole,
  Priority,
  BoardIntegration,
} from '@/types'
import { SEED_DATA } from '@/utils/seed'
import { generateId } from '@/utils/permissions'
import { uniqueSlug } from '@/utils/slug'
import {
  defaultBoardIntegrations,
} from '@/utils/boardDefaults'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notifications'
import { useIntegrationsStore } from './integrations'
import { isMatuConfigured } from '@/lib/matu'
import {
  loadUserData,
  insertBoard,
  updateBoard,
  insertList,
  updateListRecord,
  syncListPositions,
  saveCard,
  saveWorkspace,
  deleteCardFromDb,
  deleteListFromDb,
  deleteBoardFromDb,
  subscribeRealtime,
  loadWorkspaceUsers,
  reloadListsAndCards,
} from '@/services/matuData'
import { loadBoardAccessForUser } from '@/services/boardShare'
import { ensureCardUserProfiles } from '@/composables/useBoardUsers'

const STORAGE_KEY = 'quinlist_data'

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY)
  let data: typeof SEED_DATA
  if (saved) {
    try {
      data = JSON.parse(saved) as typeof SEED_DATA
    } catch {
      data = SEED_DATA
    }
  } else {
    data = SEED_DATA
  }
  data.cards = data.cards.map((c) => ({
    ...c,
    completed: c.completed ?? false,
    createdBy: c.createdBy ?? null,
    completedAt: c.completedAt ?? null,
    durationSeconds: c.durationSeconds ?? null,
    estimateHours: c.estimateHours ?? null,
  }))
  data.boards = data.boards.map((b) => ({
    ...b,
    slug: b.slug ?? b.title.toLowerCase().replace(/\s+/g, '-'),
    background: b.background ?? 'ocean',
    starred: b.starred ?? false,
    integrations: b.integrations?.length ? b.integrations : defaultBoardIntegrations(),
  }))
  return data
}

function persistLocal(state: { workspaces: Workspace[]; boards: Board[]; cards: Card[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useQuinListStore = defineStore('quinlist', () => {
  const initial = loadLocalState()
  const workspaces = ref<Workspace[]>(initial.workspaces)
  const boards = ref<Board[]>(initial.boards)
  const cards = ref<Card[]>(initial.cards)
  const currentWorkspaceId = ref<string>('ws1')
  const currentBoardId = ref<string>('b1')
  const isLoading = ref(false)
  const isReady = ref(false)
  const boardRoles = ref<Record<string, UserRole>>({})

  let unsubscribeRealtime: (() => void) | null = null
  let reloading = false
  let pendingReload = false
  let reloadingCards = false
  let pendingCardsReload = false
  let dragLock = 0

  const currentWorkspace = computed(() =>
    workspaces.value.find((w) => w.id === currentWorkspaceId.value),
  )

  const currentBoard = computed(() =>
    boards.value.find((b) => b.id === currentBoardId.value),
  )

  const workspaceBoards = computed(() =>
    boards.value.filter((b) => b.workspaceId === currentWorkspaceId.value),
  )

  function saveLocal() {
    persistLocal({ workspaces: workspaces.value, boards: boards.value, cards: cards.value })
  }

  async function persistCard(card: Card) {
    if (isMatuConfigured()) {
      await saveCard(card)
    } else {
      saveLocal()
    }
  }

  async function persistBoard(board: Board) {
    if (isMatuConfigured()) {
      await updateBoard(board)
    } else {
      saveLocal()
    }
  }

  async function persistWorkspace(workspace: Workspace) {
    const auth = useAuthStore()
    if (isMatuConfigured() && auth.currentUserId) {
      await saveWorkspace(workspace, auth.currentUserId)
    } else {
      saveLocal()
    }
  }

  function save() {
    if (!isMatuConfigured()) saveLocal()
  }

  async function reloadFromDb() {
    const auth = useAuthStore()
    if (!isMatuConfigured() || !auth.currentUserId) return

    const data = await loadUserData(auth.currentUserId)
    auth.setUsers(data.users)
    workspaces.value = data.workspaces
    boards.value = data.boards
    cards.value = data.cards
    boardRoles.value = await loadBoardAccessForUser(auth.currentUserId)
    await ensureCardUserProfiles(data.cards)

    if (data.workspaces.length > 0) {
      const hasCurrent = data.workspaces.some((w) => w.id === currentWorkspaceId.value)
      if (!hasCurrent) currentWorkspaceId.value = data.workspaces[0]!.id

      const wsBoards = data.boards.filter((b) => b.workspaceId === currentWorkspaceId.value)
      if (wsBoards.length > 0) {
        const hasBoard = wsBoards.some((b) => b.id === currentBoardId.value)
        if (!hasBoard) currentBoardId.value = wsBoards[0]!.id
      }
    }
  }

  async function scheduleReload() {
    if (reloading) {
      pendingReload = true
      return
    }
    reloading = true
    try {
      await reloadFromDb()
    } catch (err) {
      console.error(err)
    } finally {
      reloading = false
      if (pendingReload) {
        pendingReload = false
        scheduleReload()
      }
    }
  }

  async function reloadCardsFromDb() {
    const auth = useAuthStore()
    if (!isMatuConfigured() || !auth.currentUserId) return

    const boardIds = boards.value.map((b) => b.id)
    if (!boardIds.length) return

    const { boards: updatedBoards, cards: updatedCards } = await reloadListsAndCards(boardIds)

    for (const board of updatedBoards) {
      const idx = boards.value.findIndex((b) => b.id === board.id)
      if (idx !== -1) {
        boards.value[idx] = { ...boards.value[idx]!, lists: board.lists }
      }
    }
    cards.value = updatedCards
    await ensureCardUserProfiles(updatedCards)
  }

  async function scheduleCardsReload() {
    if (dragLock > 0) {
      pendingCardsReload = true
      return
    }
    if (reloadingCards) {
      pendingCardsReload = true
      return
    }
    reloadingCards = true
    try {
      await reloadCardsFromDb()
    } catch (err) {
      console.error(err)
    } finally {
      reloadingCards = false
      if (pendingCardsReload) {
        pendingCardsReload = false
        scheduleCardsReload()
      }
    }
  }

  function beginCardDrag() {
    dragLock++
  }

  function endCardDrag() {
    dragLock = Math.max(0, dragLock - 1)
    if (dragLock === 0 && pendingCardsReload) {
      pendingCardsReload = false
      scheduleCardsReload()
    }
  }

  async function init() {
    if (!isMatuConfigured()) {
      isReady.value = true
      return
    }

    isLoading.value = true
    try {
      await reloadFromDb()
      unsubscribeRealtime?.()
      unsubscribeRealtime = subscribeRealtime((table) => {
        if (table === 'cards' || table === 'lists') {
          scheduleCardsReload()
        } else {
          scheduleReload()
        }
      })
    } catch (err) {
      console.error('Error cargando datos de MatuDB:', err)
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  function destroy() {
    unsubscribeRealtime?.()
    unsubscribeRealtime = null
  }

  function getUserRole(workspaceId: string): UserRole {
    const auth = useAuthStore()
    const ws = workspaces.value.find((w) => w.id === workspaceId)
    if (!ws || !auth.currentUserId) return 'viewer'
    const member = ws.members.find((m) => m.userId === auth.currentUserId)
    return member?.role ?? 'viewer'
  }

  function getBoardRole(boardId: string): UserRole {
    const auth = useAuthStore()
    const board = boards.value.find((b) => b.id === boardId)
    if (!board || !auth.currentUserId) return 'viewer'

    const ws = workspaces.value.find((w) => w.id === board.workspaceId)
    const wsMember = ws?.members.find((m) => m.userId === auth.currentUserId)
    if (wsMember) return wsMember.role

    return boardRoles.value[boardId] ?? 'viewer'
  }

  function setBoardRole(boardId: string, role: UserRole) {
    boardRoles.value[boardId] = role
  }

  function getCardsByList(listId: string): Card[] {
    return cards.value
      .filter((c) => c.listId === listId)
      .sort((a, b) => a.position - b.position)
  }

  function getListsByBoard(boardId: string): List[] {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return []
    return [...board.lists].sort((a, b) => a.position - b.position)
  }

  function getLabel(boardId: string, labelId: string): Label | undefined {
    const board = boards.value.find((b) => b.id === boardId)
    return board?.labels.find((l) => l.id === labelId)
  }

  function getCard(cardId: string): Card | undefined {
    return cards.value.find((c) => c.id === cardId)
  }

  function getBoardCards(boardId: string): Card[] {
    return cards.value.filter((c) => c.boardId === boardId)
  }

  function getBoardStats(boardId: string) {
    const boardCards = getBoardCards(boardId)
    return {
      total: boardCards.length,
      completed: boardCards.filter((c) => c.completed).length,
      inProgress: boardCards.filter((c) => !c.completed).length,
    }
  }

  function getCardsByDate(date: string): Card[] {
    return cards.value.filter((c) => {
      if (c.dueDate !== date) return false
      const board = boards.value.find((b) => b.id === c.boardId)
      return board?.workspaceId === currentWorkspaceId.value
    })
  }

  function getWorkspaceCards(): Card[] {
    const boardIds = boards.value
      .filter((b) => b.workspaceId === currentWorkspaceId.value)
      .map((b) => b.id)
    return cards.value.filter((c) => boardIds.includes(c.boardId))
  }

  function setCurrentWorkspace(id: string) {
    currentWorkspaceId.value = id
    const firstBoard = boards.value.find((b) => b.workspaceId === id)
    if (firstBoard) currentBoardId.value = firstBoard.id
  }

  function setCurrentBoard(id: string) {
    currentBoardId.value = id
  }

  async function createCard(listId: string, title: string) {
    const auth = useAuthStore()
    const list = boards.value.flatMap((b) => b.lists).find((l) => l.id === listId)
    if (!list) return

    const listCards = getCardsByList(listId)
    const now = new Date().toISOString()
    const card: Card = {
      id: generateId(),
      listId,
      boardId: list.boardId,
      title,
      description: '',
      completed: false,
      labelIds: [],
      priority: 'media',
      dueDate: null,
      assigneeIds: auth.currentUserId ? [auth.currentUserId] : [],
      checklist: [],
      comments: [],
      attachments: [],
      position: listCards.length,
      createdAt: now,
      updatedAt: now,
      createdBy: auth.currentUserId,
      completedAt: null,
      durationSeconds: null,
      estimateHours: null,
      blocked: false,
      blockedReason: null,
    }
    cards.value.push(card)
    await persistCard(card)
    return card
  }

  async function updateCard(cardId: string, updates: Partial<Card>) {
    const idx = cards.value.findIndex((c) => c.id === cardId)
    if (idx === -1) return
    cards.value[idx] = {
      ...cards.value[idx]!,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await persistCard(cards.value[idx]!)
  }

  async function moveCard(cardId: string, toListId: string, newPosition: number, silent = false) {
    const card = cards.value.find((c) => c.id === cardId)
    if (!card) return

    const oldListId = card.listId
    const fromList = getCardsByList(oldListId).filter((c) => c.id !== cardId)
    const toList =
      oldListId === toListId
        ? fromList
        : getCardsByList(toListId).filter((c) => c.id !== cardId)

    card.listId = toListId
    toList.splice(newPosition, 0, card)

    fromList.forEach((c, i) => {
      const idx = cards.value.findIndex((x) => x.id === c.id)
      if (idx !== -1) cards.value[idx]!.position = i
    })
    toList.forEach((c, i) => {
      const idx = cards.value.findIndex((x) => x.id === c.id)
      if (idx !== -1) {
        cards.value[idx]!.position = i
        cards.value[idx]!.updatedAt = new Date().toISOString()
      }
    })

    const affected = new Set([...fromList, ...toList].map((c) => c.id))
    if (isMatuConfigured()) {
      for (const id of affected) {
        const c = getCard(id)
        if (c) await saveCard(c)
      }
    } else {
      saveLocal()
    }

    if (!silent) {
      const notif = useNotificationStore()
      const auth = useAuthStore()
      const list = boards.value.flatMap((b) => b.lists).find((l) => l.id === toListId)
      notif.push({
        type: 'card_moved',
        title: 'Tarjeta movida',
        message: `"${card.title}" movida a ${list?.title ?? 'otra lista'}`,
        userId: auth.currentUserId!,
        metadata: { cardId, boardId: card.boardId },
      })
      const integrations = useIntegrationsStore()
      integrations.notifyEvent(card.boardId, 'card_moved', {
        title: card.title,
        message: `Movida a ${list?.title}`,
        cardId,
      })
    }
  }

  async function deleteCard(cardId: string) {
    cards.value = cards.value.filter((c) => c.id !== cardId)
    if (isMatuConfigured()) {
      await deleteCardFromDb(cardId)
    } else {
      saveLocal()
    }
  }

  async function createBoard(workspaceId: string, title: string, description = '') {
    const boardId = generateId()
    const existingSlugs = boards.value.map((b) => b.slug)
    const board: Board = {
      id: boardId,
      workspaceId,
      title,
      slug: uniqueSlug(title, existingSlugs),
      description,
      background: 'ocean',
      starred: false,
      integrations: defaultBoardIntegrations(),
      labels: [],
      lists: [],
      createdAt: new Date().toISOString().split('T')[0]!,
    }
    boards.value.push(board)
    currentBoardId.value = boardId
    if (isMatuConfigured()) {
      await insertBoard(board)
    } else {
      saveLocal()
    }
    return board
  }

  async function createWorkspace(name: string, icon: string, color: string) {
    const auth = useAuthStore()
    const ws: Workspace = {
      id: generateId(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      icon: icon || name[0]?.toUpperCase() || 'W',
      color,
      members: auth.currentUserId
        ? [{ userId: auth.currentUserId, role: 'owner', joinedAt: new Date().toISOString().split('T')[0]! }]
        : [],
      createdAt: new Date().toISOString().split('T')[0]!,
    }
    workspaces.value.push(ws)
    currentWorkspaceId.value = ws.id
    await persistWorkspace(ws)
    return ws
  }

  async function toggleCardCompleted(cardId: string) {
    const card = getCard(cardId)
    const auth = useAuthStore()
    if (!card) return

    const now = new Date().toISOString()
    if (!card.completed) {
      card.completed = true
      card.completedAt = now
      const start = new Date(card.createdAt).getTime()
      card.durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000))
      card.updatedAt = now
      await persistCard(card)

      const notif = useNotificationStore()
      const board = boards.value.find((b) => b.id === card.boardId)
      for (const member of getBoardNotifyTargets(card)) {
        if (member === auth.currentUserId) continue
        notif.push({
          type: 'card_moved',
          title: 'Tarea completada',
          message: `"${card.title}" fue completada en ${board?.title ?? 'tablero'}`,
          userId: member,
          metadata: { boardId: card.boardId, cardId: card.id, workspaceId: board?.workspaceId },
        })
      }
    } else {
      card.completed = false
      card.completedAt = null
      card.durationSeconds = null
      card.updatedAt = now
      await persistCard(card)
    }
  }

  function getBoardNotifyTargets(card: Card): string[] {
    const board = boards.value.find((b) => b.id === card.boardId)
    if (!board) return []
    const ws = workspaces.value.find((w) => w.id === board.workspaceId)
    return ws?.members.map((m) => m.userId) ?? []
  }

  async function createList(boardId: string, title: string) {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return
    const list: List = {
      id: generateId(),
      boardId,
      title,
      position: board.lists.length,
    }
    board.lists.push(list)
    if (isMatuConfigured()) {
      await insertList(list)
    } else {
      saveLocal()
    }
    return list
  }

  async function updateList(listId: string, title: string) {
    const list = boards.value.flatMap((b) => b.lists).find((l) => l.id === listId)
    if (!list) return
    list.title = title.trim()
    if (isMatuConfigured()) {
      await updateListRecord(list)
    } else {
      saveLocal()
    }
  }

  async function deleteList(listId: string) {
    const board = boards.value.find((b) => b.lists.some((l) => l.id === listId))
    if (!board) return

    const otherList = board.lists.find((l) => l.id !== listId)
    const listCards = getCardsByList(listId)

    if (otherList) {
      const basePosition = getCardsByList(otherList.id).length
      for (let i = 0; i < listCards.length; i++) {
        await moveCard(listCards[i]!.id, otherList.id, basePosition + i, true)
      }
    } else {
      for (const c of listCards) {
        await deleteCard(c.id)
      }
    }

    board.lists = board.lists
      .filter((l) => l.id !== listId)
      .map((l, i) => ({ ...l, position: i }))

    if (isMatuConfigured()) {
      await deleteListFromDb(listId)
      await syncListPositions(board.lists)
    } else {
      saveLocal()
    }
  }

  async function addComment(cardId: string, text: string) {
    const auth = useAuthStore()
    const card = getCard(cardId)
    if (!card || !auth.currentUser) return

    const comment: Comment = {
      id: generateId(),
      userId: auth.currentUser.id,
      text,
      createdAt: new Date().toISOString(),
    }
    card.comments.push(comment)
    card.updatedAt = new Date().toISOString()
    await persistCard(card)

    const notif = useNotificationStore()
    const integrations = useIntegrationsStore()
    card.assigneeIds
      .filter((id) => id !== auth.currentUser!.id)
      .forEach((userId) => {
        notif.push({
          type: 'card_commented',
          title: 'Nuevo comentario',
          message: `${auth.currentUser!.name} comentó en "${card.title}"`,
          userId,
          metadata: { cardId, boardId: card.boardId },
        })
      })
    integrations.notifyEvent(card.boardId, 'card_commented', {
      title: card.title,
      message: `${auth.currentUser!.name}: ${text}`,
      cardId,
    })
  }

  async function toggleChecklistItem(cardId: string, itemId: string) {
    const card = getCard(cardId)
    if (!card) return
    const item = card.checklist.find((i) => i.id === itemId)
    if (item) item.completed = !item.completed
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
  }

  async function addChecklistItem(cardId: string, text: string) {
    const card = getCard(cardId)
    if (!card) return
    const item: ChecklistItem = { id: generateId(), text, completed: false }
    card.checklist.push(item)
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
  }

  async function removeChecklistItem(cardId: string, itemId: string) {
    const card = getCard(cardId)
    if (!card) return
    card.checklist = card.checklist.filter((i) => i.id !== itemId)
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
  }

  async function addAttachment(cardId: string, file: File) {
    const auth = useAuthStore()
    const card = getCard(cardId)
    if (!card || !auth.currentUser) return

    try {
      const { uploadCardFile, deleteStorageFile } = await import('@/services/storage')
      const uploaded = await uploadCardFile(card.boardId, cardId, file)
      const attachment: Attachment = {
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploaded.url,
        storageFilename: uploaded.storageFilename || undefined,
        uploadedAt: new Date().toISOString(),
        uploadedBy: auth.currentUser.id,
      }
      card.attachments.push(attachment)
      card.updatedAt = new Date().toISOString()
      await persistCard(card)
    } catch (err) {
      console.error('Error subiendo archivo:', err)
    }
  }

  async function removeAttachment(cardId: string, attachmentId: string) {
    const card = getCard(cardId)
    if (!card) return
    const removed = card.attachments.find((a) => a.id === attachmentId)
    card.attachments = card.attachments.filter((a) => a.id !== attachmentId)
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
    if (removed) {
      const { deleteStorageFile } = await import('@/services/storage')
      await deleteStorageFile(removed)
    }
  }

  async function toggleLabel(cardId: string, labelId: string) {
    const card = getCard(cardId)
    if (!card) return
    const idx = card.labelIds.indexOf(labelId)
    if (idx === -1) card.labelIds.push(labelId)
    else card.labelIds.splice(idx, 1)
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
  }

  async function setPriority(cardId: string, priority: Priority) {
    await updateCard(cardId, { priority })
  }

  async function setDueDate(cardId: string, dueDate: string | null) {
    await updateCard(cardId, { dueDate })
  }

  async function setBlocked(cardId: string, blocked: boolean, reason: string | null = null) {
    await updateCard(cardId, {
      blocked,
      blockedReason: blocked ? reason?.trim() || null : null,
    })
  }

  async function toggleAssignee(cardId: string, userId: string) {
    const card = getCard(cardId)
    if (!card) return
    const auth = useAuthStore()
    const idx = card.assigneeIds.indexOf(userId)
    if (idx === -1) {
      card.assigneeIds.push(userId)
      if (userId !== auth.currentUserId) {
        const notif = useNotificationStore()
        notif.push({
          type: 'card_assigned',
          title: 'Nueva asignación',
          message: `Te asignaron "${card.title}"`,
          userId,
          metadata: { cardId, boardId: card.boardId },
        })
      }
    } else {
      card.assigneeIds.splice(idx, 1)
    }
    card.updatedAt = new Date().toISOString()
    await persistCard(card)
  }

  function getUpcomingCards(): Card[] {
    return cards.value
      .filter((c) => c.dueDate && c.boardId === currentBoardId.value)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5)
  }

  async function toggleBoardStar(boardId: string) {
    const board = boards.value.find((b) => b.id === boardId)
    if (board) {
      board.starred = !board.starred
      await persistBoard(board)
    }
  }

  async function renameBoard(boardId: string, title: string) {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return
    board.title = title.trim()
    await persistBoard(board)
  }

  async function deleteBoard(boardId: string) {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return

    boards.value = boards.value.filter((b) => b.id !== boardId)
    cards.value = cards.value.filter((c) => c.boardId !== boardId)

    if (currentBoardId.value === boardId) {
      const next = boards.value.find((b) => b.workspaceId === board.workspaceId)
      currentBoardId.value = next?.id ?? ''
    }

    delete boardRoles.value[boardId]

    if (isMatuConfigured()) {
      await deleteBoardFromDb(boardId)
    } else {
      saveLocal()
    }
  }

  async function setBoardBackground(boardId: string, background: string) {
    const board = boards.value.find((b) => b.id === boardId)
    if (board) {
      board.background = background
      await persistBoard(board)
    }
  }

  async function setIntegrationEnabled(boardId: string, type: BoardIntegration['type'], enabled: boolean) {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return
    const integration = board.integrations.find((i) => i.type === type)
    if (integration) integration.enabled = enabled
    else board.integrations.push({ type, enabled, config: {} })
    await persistBoard(board)
  }

  async function setIntegrationConfig(
    boardId: string,
    type: BoardIntegration['type'],
    config: Record<string, string>,
  ) {
    const board = boards.value.find((b) => b.id === boardId)
    if (!board) return
    const integration = board.integrations.find((i) => i.type === type)
    if (integration) integration.config = { ...integration.config, ...config }
    await persistBoard(board)
  }

  function getStarredBoards() {
    return boards.value.filter(
      (b) => b.starred && b.workspaceId === currentWorkspaceId.value,
    )
  }

  function searchCards(query: string): Card[] {
    const q = query.toLowerCase()
    const boardIds = boards.value
      .filter((b) => b.workspaceId === currentWorkspaceId.value)
      .map((b) => b.id)
    return cards.value.filter(
      (c) =>
        boardIds.includes(c.boardId) &&
        (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    )
  }

  async function inviteTeamMember(email: string, role: UserRole) {
    const auth = useAuthStore()
    const ws = currentWorkspace.value
    if (!ws || !auth.currentUserId) throw new Error('No hay espacio activo')

    if (isMatuConfigured()) {
      const { inviteMember } = await import('@/services/matuData')
      await inviteMember(ws.id, email, role, auth.currentUserId)
      const users = await loadWorkspaceUsers(ws)
      auth.setUsers(users)
      await reloadFromDb()
      return
    }

    const normalized = email.trim().toLowerCase()
    const user = auth.users.find((u) => u.email === normalized)
    if (!user) throw new Error('Usuario no encontrado. En modo demo solo puedes invitar usuarios existentes.')

    if (ws.members.some((m) => m.userId === user.id)) {
      throw new Error('Este usuario ya es miembro del espacio')
    }

    ws.members.push({
      userId: user.id,
      role,
      joinedAt: new Date().toISOString().split('T')[0]!,
    })
    saveLocal()
  }

  return {
    workspaces,
    boards,
    cards,
    currentWorkspaceId,
    currentBoardId,
    currentWorkspace,
    currentBoard,
    workspaceBoards,
    isLoading,
    isReady,
    init,
    destroy,
    beginCardDrag,
    endCardDrag,
    reloadFromDb,
    getUserRole,
    getBoardRole,
    setBoardRole,
    getCardsByList,
    getListsByBoard,
    getLabel,
    getCard,
    getBoardCards,
    getBoardStats,
    getCardsByDate,
    getWorkspaceCards,
    setCurrentWorkspace,
    setCurrentBoard,
    createBoard,
    createWorkspace,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    toggleCardCompleted,
    createList,
    updateList,
    deleteList,
    addComment,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    addAttachment,
    removeAttachment,
    toggleLabel,
    setPriority,
    setDueDate,
    setBlocked,
    toggleAssignee,
    getUpcomingCards,
    searchCards,
    toggleBoardStar,
    setBoardBackground,
    renameBoard,
    deleteBoard,
    setIntegrationEnabled,
    setIntegrationConfig,
    getStarredBoards,
    inviteTeamMember,
    save: saveLocal,
  }
})
