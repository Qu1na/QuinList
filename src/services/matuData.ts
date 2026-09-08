import type {
  Board,
  Card,
  List,
  Notification,
  User,
  UserRole,
  Workspace,
  WorkspaceMember,
} from '@/types'
import { matuRealtimeRow, matuRealtimeTableChannel, rowUserId } from '@/lib/matuRealtime'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { toJsonb, fromJsonb } from '@/lib/dbJson'
import { generateId } from '@/utils/permissions'
import { todayCalendarDate } from '@/utils/datetime'
import { loadBoardIdsForUser, acceptPendingBoardInvites } from '@/services/boardShare'
import { loadProfileById } from '@/services/userModeration'
import {
  defaultBoardIntegrations,
} from '@/utils/boardDefaults'

interface DbProfile {
  id: string
  name: string
  email: string
  avatar: string
  initials: string
  suspended_at?: string | null
  suspended_until?: string | null
  suspended_reason?: string | null
  suspended_by?: string | null
  last_login_at?: string | null
}

interface DbWorkspace {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  owner_id: string
  created_at: string
}

interface DbMember {
  id: string
  workspace_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

interface DbBoard {
  id: string
  workspace_id: string
  title: string
  slug?: string
  description: string
  background: string
  starred: boolean
  integrations: string | Board['integrations']
  labels: string | Board['labels']
  created_at: string
}

interface DbList {
  id: string
  board_id: string
  title: string
  position: number
}

interface DbCard {
  id: string
  list_id: string
  board_id: string
  title: string
  description: string
  completed: boolean
  label_ids: string | string[]
  priority: Card['priority']
  due_date: string | null
  assignee_ids: string | string[]
  checklist: string | Card['checklist']
  comments: string | Card['comments']
  attachments: string | Card['attachments']
  position: number
  created_at: string
  updated_at: string
  created_by?: string | null
  completed_at?: string | null
  duration_seconds?: number | null
  estimate_hours?: number | null
  blocked?: boolean
  blocked_reason?: string | null
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join('')
}

function toUser(row: DbProfile): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? '',
    initials: row.initials,
    suspendedAt: row.suspended_at ?? null,
    suspendedUntil: row.suspended_until ?? null,
    suspendedReason: row.suspended_reason ?? null,
    suspendedBy: row.suspended_by ?? null,
    lastLoginAt: row.last_login_at ?? null,
  }
}

function toCard(row: DbCard): Card {
  return {
    id: row.id,
    listId: row.list_id,
    boardId: row.board_id,
    title: row.title,
    description: row.description ?? '',
    completed: row.completed ?? false,
    labelIds: fromJsonb<string[]>(row.label_ids, []),
    priority: row.priority ?? 'media',
    dueDate: row.due_date,
    assigneeIds: fromJsonb<string[]>(row.assignee_ids, []),
    checklist: fromJsonb(row.checklist, []),
    comments: fromJsonb(row.comments, []),
    attachments: fromJsonb(row.attachments, []),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
    completedAt: row.completed_at ?? null,
    durationSeconds: row.duration_seconds ?? null,
    estimateHours: row.estimate_hours != null ? Number(row.estimate_hours) : null,
    blocked: row.blocked ?? false,
    blockedReason: row.blocked_reason ?? null,
  }
}

function cardToDb(card: Card): Record<string, unknown> {
  return {
    id: card.id,
    list_id: card.listId,
    board_id: card.boardId,
    title: card.title,
    description: card.description ?? '',
    completed: card.completed ?? false,
    label_ids: toJsonb(card.labelIds, []),
    priority: card.priority ?? 'media',
    due_date: card.dueDate,
    assignee_ids: toJsonb(card.assigneeIds, []),
    checklist: toJsonb(card.checklist, []),
    comments: toJsonb(card.comments, []),
    attachments: toJsonb(card.attachments, []),
    position: card.position,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    created_by: card.createdBy,
    completed_at: card.completedAt,
    duration_seconds: card.durationSeconds,
    estimate_hours: card.estimateHours,
    blocked: card.blocked ?? false,
    blocked_reason: card.blockedReason,
  }
}

function boardToDb(board: Board): Record<string, unknown> {
  return {
    id: board.id,
    workspace_id: board.workspaceId,
    title: board.title,
    slug: board.slug ?? '',
    description: board.description ?? '',
    background: board.background ?? 'ocean',
    starred: board.starred ?? false,
    integrations: toJsonb(board.integrations, []),
    labels: toJsonb(board.labels, []),
    created_at: board.createdAt,
  }
}

function listToDb(list: List): Record<string, unknown> {
  return {
    id: list.id,
    board_id: list.boardId,
    title: list.title,
    position: list.position,
  }
}

/** MatuDB client upsert() is insert-only — use saveRecord for real upsert. */
async function saveRecord(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = getMatuClient()
  const { data: existing, error: findErr } = await db
    .from(table)
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) {
    const msg = findErr.message || 'Error al consultar MatuDB'
    // Acceso al proyecto / tabla: no tratar como “no existe la fila”
    if (/project not found|access denied|unauthorized|forbidden/i.test(msg)) {
      throw new Error(
        'No hay acceso a los datos de MatuDB (proyecto o permisos). Revisa VITE_MATUDB_PROJECT_ID, la API key y que exista la tabla profiles.',
      )
    }
    throw new Error(msg)
  }

  if (existing) {
    const { id: _rowId, ...updateData } = data
    const { error } = await db.from(table).eq('id', id).update(updateData)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await db.from(table).insert(data)
    if (error) throw new Error(error.message)
  }
}

async function saveWorkspaceMember(
  workspaceId: string,
  member: WorkspaceMember,
): Promise<void> {
  const db = getMatuClient()
  const { data: existing, error: findErr } = await db
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', member.userId)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)

  if (existing) {
    const row = existing as { id: string }
    const { error } = await db.from('workspace_members').eq('id', row.id).update({
      role: member.role,
      joined_at: member.joinedAt,
    })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await db.from('workspace_members').insert({
      id: generateId(),
      workspace_id: workspaceId,
      user_id: member.userId,
      role: member.role,
      joined_at: member.joinedAt,
    })
    if (error) throw new Error(error.message)
  }
}

export interface LoadedData {
  users: User[]
  workspaces: Workspace[]
  boards: Board[]
  cards: Card[]
}

export async function loadUserData(userId: string): Promise<LoadedData> {
  const db = getMatuClient()

  const { data: memberships, error: memErr } = await db
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId)

  if (memErr) throw new Error(memErr.message)

  const workspaceIds = (memberships as DbMember[] | null)?.map((m) => m.workspace_id) ?? []

  if (workspaceIds.length === 0) {
    return { users: [], workspaces: [], boards: [], cards: [] }
  }

  const { data: wsRows, error: wsErr } = await db
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds)

  if (wsErr) throw new Error(wsErr.message)

  const { data: allMembers, error: allMemErr } = await db
    .from('workspace_members')
    .select('*')
    .in('workspace_id', workspaceIds)

  if (allMemErr) throw new Error(allMemErr.message)

  const memberById = new Map<string, DbMember>()
  for (const m of (allMembers as DbMember[]) ?? []) {
    memberById.set(m.id, m)
  }

  // Fallback: per-workspace queries in case bulk .in() is limited by RLS
  for (const wsId of workspaceIds) {
    const { data: wsMembers, error: wsMemErr } = await db
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', wsId)

    if (wsMemErr) {
      console.warn('[matuData] workspace_members fallback failed for', wsId, wsMemErr.message)
      continue
    }

    for (const m of (wsMembers as DbMember[]) ?? []) {
      memberById.set(m.id, m)
    }
  }

  const allMemberRows = [...memberById.values()]
  const memberUserIds = [...new Set(allMemberRows.map((m) => m.user_id))]

  const profileById = new Map<string, User>()
  if (memberUserIds.length > 0) {
    const { data: profiles, error: profErr } = await db
      .from('profiles')
      .select('*')
      .in('id', memberUserIds)

    if (profErr) throw new Error(profErr.message)

    for (const row of (profiles as DbProfile[]) ?? []) {
      profileById.set(row.id, toUser(row))
    }

    const missingProfileIds = memberUserIds.filter((id) => !profileById.has(id))
    for (const userId of missingProfileIds) {
      const { data: profile, error: singleErr } = await db
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (singleErr) {
        console.warn('[matuData] profile fallback failed for', userId, singleErr.message)
        continue
      }
      if (profile) profileById.set(userId, toUser(profile as DbProfile))
    }
  }

  const users = [...profileById.values()]

  const membersByWs = new Map<string, WorkspaceMember[]>()
  for (const m of allMemberRows) {
    const list = membersByWs.get(m.workspace_id) ?? []
    list.push({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
    })
    membersByWs.set(m.workspace_id, list)
  }

  const workspaces: Workspace[] = ((wsRows as DbWorkspace[]) ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    icon: w.icon,
    color: w.color,
    members: membersByWs.get(w.id) ?? [],
    createdAt: w.created_at,
  }))

  const { data: boardRows, error: boardErr } = await db
    .from('boards')
    .select('*')
    .in('workspace_id', workspaceIds)

  if (boardErr) throw new Error(boardErr.message)

  const boardIds = ((boardRows as DbBoard[]) ?? []).map((b) => b.id)

  const sharedBoardIds = await loadBoardIdsForUser(userId)
  const extraBoardIds = sharedBoardIds.filter((id) => !boardIds.includes(id))

  let extraBoardRows: DbBoard[] = []
  if (extraBoardIds.length > 0) {
    const { data: extra, error: extraErr } = await db
      .from('boards')
      .select('*')
      .in('id', extraBoardIds)

    if (extraErr) throw new Error(extraErr.message)
    extraBoardRows = (extra as DbBoard[]) ?? []

    const extraWsIds = [
      ...new Set(extraBoardRows.map((b) => b.workspace_id).filter((id) => !workspaceIds.includes(id))),
    ]

    if (extraWsIds.length > 0) {
      const { data: extraWs, error: extraWsErr } = await db
        .from('workspaces')
        .select('*')
        .in('id', extraWsIds)

      if (extraWsErr) throw new Error(extraWsErr.message)

      for (const w of (extraWs as DbWorkspace[]) ?? []) {
        workspaces.push({
          id: w.id,
          name: w.name,
          slug: w.slug,
          icon: w.icon,
          color: w.color,
          members: [],
          createdAt: w.created_at,
        })
      }
    }
  }

  const allBoardIds = [...boardIds, ...extraBoardIds]
  const allBoardRows = [...((boardRows as DbBoard[]) ?? []), ...extraBoardRows]

  let listRows: DbList[] = []
  let cardRows: DbCard[] = []

  if (allBoardIds.length > 0) {
    const { data: lists, error: listErr } = await db
      .from('lists')
      .select('*')
      .in('board_id', allBoardIds)
      .order('position', { ascending: true })

    if (listErr) throw new Error(listErr.message)
    listRows = (lists as DbList[]) ?? []

    const { data: cards, error: cardErr } = await db
      .from('cards')
      .select('*')
      .in('board_id', allBoardIds)
      .order('position', { ascending: true })

    if (cardErr) throw new Error(cardErr.message)
    cardRows = (cards as DbCard[]) ?? []
  }

  const listsByBoard = new Map<string, List[]>()
  for (const l of listRows) {
    const list = listsByBoard.get(l.board_id) ?? []
    list.push({
      id: l.id,
      boardId: l.board_id,
      title: l.title,
      position: l.position,
    })
    listsByBoard.set(l.board_id, list)
  }

  const boards: Board[] = allBoardRows.map((b) => ({
    id: b.id,
    workspaceId: b.workspace_id,
    title: b.title,
    slug: b.slug || b.title.toLowerCase().replace(/\s+/g, '-'),
    description: b.description ?? '',
    background: b.background ?? 'ocean',
    starred: b.starred ?? false,
    integrations: (() => {
      const parsed = fromJsonb<Board['integrations']>(b.integrations, [])
      return parsed.length ? parsed : defaultBoardIntegrations()
    })(),
    labels: fromJsonb(b.labels, []),
    lists: listsByBoard.get(b.id) ?? [],
    createdAt: b.created_at,
  }))

  const cards = cardRows.map(toCard)

  return { users, workspaces, boards, cards }
}

export async function reloadListsAndCards(
  boardIds: string[],
): Promise<{ boards: Board[]; cards: Card[] }> {
  if (!boardIds.length) return { boards: [], cards: [] }

  const db = getMatuClient()
  const { data: lists, error: listErr } = await db
    .from('lists')
    .select('*')
    .in('board_id', boardIds)
    .order('position', { ascending: true })

  if (listErr) throw new Error(listErr.message)
  const listRows = (lists as DbList[]) ?? []

  const { data: cardRows, error: cardErr } = await db
    .from('cards')
    .select('*')
    .in('board_id', boardIds)
    .order('position', { ascending: true })

  if (cardErr) throw new Error(cardErr.message)

  const listsByBoard = new Map<string, List[]>()
  for (const l of listRows) {
    const list = listsByBoard.get(l.board_id) ?? []
    list.push({
      id: l.id,
      boardId: l.board_id,
      title: l.title,
      position: l.position,
    })
    listsByBoard.set(l.board_id, list)
  }

  const { data: boardRows, error: boardErr } = await db
    .from('boards')
    .select('*')
    .in('id', boardIds)

  if (boardErr) throw new Error(boardErr.message)

  const boards: Board[] = ((boardRows as DbBoard[]) ?? []).map((b) => ({
    id: b.id,
    workspaceId: b.workspace_id,
    title: b.title,
    slug: b.slug || b.title.toLowerCase().replace(/\s+/g, '-'),
    description: b.description ?? '',
    background: b.background ?? 'ocean',
    starred: b.starred ?? false,
    integrations: (() => {
      const parsed = fromJsonb<Board['integrations']>(b.integrations, [])
      return parsed.length ? parsed : defaultBoardIntegrations()
    })(),
    labels: fromJsonb(b.labels, []),
    lists: listsByBoard.get(b.id) ?? [],
    createdAt: b.created_at,
  }))

  const cards = ((cardRows as DbCard[]) ?? []).map(toCard)
  return { boards, cards }
}

export async function saveProfile(user: User): Promise<void> {
  await saveRecord('profiles', user.id, {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    avatar: user.avatar ?? '',
    initials: user.initials,
  })
}

/** @deprecated use saveProfile */
export const upsertProfile = saveProfile

/**
 * Garantiza que exista la fila en `profiles` para el userId de auth.
 * Sin esto, inserts en project_members / workspace_members fallan por FK.
 */
export async function ensureUserProfile(user: User): Promise<User> {
  if (!isMatuConfigured()) return user

  const existing = await loadProfileById(user.id)
  if (existing) return existing

  const normalized: User = {
    ...user,
    email: user.email.trim().toLowerCase(),
  }

  const byEmail = await searchProfileByEmail(normalized.email)
  if (byEmail && byEmail.id !== normalized.id) {
    throw new Error(
      'Ya existe un perfil con este correo bajo otro usuario. Cierra sesión e inicia con la cuenta correcta, o contacta al administrador.',
    )
  }

  try {
    await saveProfile(normalized)
  } catch (err) {
    // Si otro proceso creó el perfil en paralelo, re-leer
    const raced = await loadProfileById(normalized.id)
    if (raced) return raced
    throw err instanceof Error ? err : new Error(String(err))
  }

  const verified = await loadProfileById(normalized.id)
  if (!verified) {
    throw new Error(
      'No se pudo crear tu perfil en la base de datos. Cierra sesión, vuelve a entrar e inténtalo de nuevo.',
    )
  }
  return verified
}

export async function createDefaultWorkspace(
  userId: string,
  userName: string,
): Promise<{ workspace: Workspace; board: Board }> {
  const db = getMatuClient()
  const wsId = generateId()
  const boardId = generateId()
  const firstName = userName.split(' ')[0] ?? 'Mi'
  const wsName = `Espacio de ${firstName}`

  const workspace: Workspace = {
    id: wsId,
    name: wsName,
    slug: wsName.toLowerCase().replace(/\s+/g, '-'),
    icon: firstName[0]?.toUpperCase() ?? 'E',
    color: '#1e3a5f',
    members: [
      {
        userId,
        role: 'owner',
        joinedAt: todayCalendarDate(),
      },
    ],
    createdAt: todayCalendarDate(),
  }

  const board: Board = {
    id: boardId,
    workspaceId: wsId,
    title: 'Mi primer tablero',
    slug: 'mi-primer-tablero',
    description: '',
    background: 'ocean',
    starred: false,
    integrations: defaultBoardIntegrations(),
    labels: [],
    lists: [],
    createdAt: todayCalendarDate(),
  }

  const { error: wsErr } = await db.from('workspaces').insert({
    id: wsId,
    name: workspace.name,
    slug: workspace.slug,
    icon: workspace.icon,
    color: workspace.color,
    owner_id: userId,
    created_at: workspace.createdAt,
  })
  if (wsErr) throw new Error(wsErr.message)

  const { error: memErr } = await db.from('workspace_members').insert({
    id: generateId(),
    workspace_id: wsId,
    user_id: userId,
    role: 'owner',
    joined_at: workspace.members[0]!.joinedAt,
  })
  if (memErr) throw new Error(memErr.message)

  await insertBoard(board)
  return { workspace, board }
}

export async function saveWorkspace(workspace: Workspace, ownerId: string): Promise<void> {
  await saveRecord('workspaces', workspace.id, {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    icon: workspace.icon,
    color: workspace.color,
    owner_id: ownerId,
    created_at: workspace.createdAt,
  })

  for (const m of workspace.members) {
    await saveWorkspaceMember(workspace.id, m)
  }
}

/** @deprecated use saveWorkspace */
export const upsertWorkspace = saveWorkspace

export async function insertBoard(board: Board): Promise<void> {
  await saveRecord('boards', board.id, boardToDb(board))
}

export async function updateBoard(board: Board): Promise<void> {
  const db = getMatuClient()
  const { error } = await db.from('boards').eq('id', board.id).update(boardToDb(board))
  if (error) throw new Error(error.message)
}

export async function insertList(list: List): Promise<void> {
  await saveRecord('lists', list.id, listToDb(list))
}

export async function updateListRecord(list: List): Promise<void> {
  const db = getMatuClient()
  const { error } = await db.from('lists').eq('id', list.id).update(listToDb(list))
  if (error) throw new Error(error.message)
}

export async function syncListPositions(lists: List[]): Promise<void> {
  for (const list of lists) {
    await updateListRecord(list)
  }
}

/** Insert or update board row only (no lists). */
export async function upsertBoard(board: Board): Promise<void> {
  await saveRecord('boards', board.id, boardToDb(board))
}

export async function saveCard(card: Card): Promise<void> {
  await saveRecord('cards', card.id, cardToDb(card))
}

/** @deprecated use saveCard */
export const upsertCard = saveCard

export async function deleteCardFromDb(cardId: string): Promise<void> {
  const db = getMatuClient()
  const { error } = await db.from('cards').eq('id', cardId).delete()
  if (error) throw new Error(error.message)
}

export async function deleteListFromDb(listId: string): Promise<void> {
  const db = getMatuClient()
  const { error } = await db.from('lists').eq('id', listId).delete()
  if (error) throw new Error(error.message)
}

export async function deleteBoardFromDb(boardId: string): Promise<void> {
  const db = getMatuClient()
  await db.from('cards').eq('board_id', boardId).delete()
  await db.from('lists').eq('board_id', boardId).delete()
  const { error } = await db.from('boards').eq('id', boardId).delete()
  if (error) throw new Error(error.message)
}

export async function syncBoardLists(board: Board): Promise<void> {
  await updateBoard(board)
  await syncListPositions(board.lists)
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: UserRole,
  invitedBy: string,
): Promise<void> {
  const db = getMatuClient()
  const normalized = email.trim().toLowerCase()

  const { data: existing } = await db
    .from('profiles')
    .select('id, email')
    .eq('email', normalized)
    .maybeSingle()

  if (existing) {
    const profile = existing as DbProfile
    const { data: member } = await db
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (member) throw new Error('Este usuario ya es miembro del espacio')

    const { error } = await db.from('workspace_members').insert({
      id: generateId(),
      workspace_id: workspaceId,
      user_id: profile.id,
      role,
      joined_at: todayCalendarDate(),
    })
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await db.from('workspace_invites').upsert({
    id: generateId(),
    workspace_id: workspaceId,
    email: normalized,
    role,
    invited_by: invitedBy,
    status: 'pending',
  })
  if (error) throw new Error(error.message)
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: UserRole,
): Promise<void> {
  const db = getMatuClient()
  const { data: existing, error: findErr } = await db
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)
  if (!existing) throw new Error('Miembro no encontrado')

  const row = existing as { id: string; role: UserRole }
  if (row.role === 'owner') throw new Error('No se puede cambiar el rol del propietario')

  const { error } = await db.from('workspace_members').eq('id', row.id).update({ role })
  if (error) throw new Error(error.message)
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const db = getMatuClient()
  const { data: existing, error: findErr } = await db
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)
  if (!existing) return

  const row = existing as { id: string; role: UserRole }
  if (row.role === 'owner') throw new Error('No se puede quitar al propietario del espacio')

  const { error } = await db.from('workspace_members').eq('id', row.id).delete()
  if (error) throw new Error(error.message)
}

export async function acceptPendingInvites(userId: string, email: string): Promise<void> {
  const db = getMatuClient()
  const normalized = email.trim().toLowerCase()

  const { data: invites, error } = await db
    .from('workspace_invites')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'pending')

  if (error || !invites?.length) return

  for (const inv of invites as { id: string; workspace_id: string; role: UserRole }[]) {
    await db.from('workspace_members').insert({
      id: generateId(),
      workspace_id: inv.workspace_id,
      user_id: userId,
      role: inv.role,
      joined_at: todayCalendarDate(),
    })
    await db.from('workspace_invites').eq('id', inv.id).update({ status: 'accepted' })
  }
}

export async function searchProfileByEmail(email: string): Promise<User | null> {
  const db = getMatuClient()
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error || !data) return null
  return toUser(data as DbProfile)
}

export async function loadWorkspaceUsers(workspace: Workspace): Promise<User[]> {
  const db = getMatuClient()
  const ids = workspace.members.map((m) => m.userId)
  if (!ids.length) return []

  const { data, error } = await db.from('profiles').select('*').in('id', ids)
  if (error) throw new Error(error.message)
  return ((data as DbProfile[]) ?? []).map(toUser)
}

export async function pushNotification(notification: Notification): Promise<void> {
  const db = getMatuClient()
  const { error } = await db.from('notifications').insert({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    user_id: notification.userId,
    read: notification.read,
    metadata: toJsonb(notification.metadata ?? {}, {}),
    created_at: notification.createdAt,
  })
  if (error) throw new Error(error.message)
}

export async function loadNotifications(userId: string): Promise<Notification[]> {
  const db = getMatuClient()
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data as {
    id: string
    type: Notification['type']
    title: string
    message: string
    user_id: string
    read: boolean
    metadata: Notification['metadata']
    created_at: string
  }[]) ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    userId: n.user_id,
    read: n.read,
    metadata: fromJsonb(n.metadata, {}),
    createdAt: n.created_at,
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isMatuConfigured()) return
  const db = getMatuClient()
  const { error } = await db.from('notifications').eq('id', id).update({ read: true })
  if (error) throw new Error(error.message)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!isMatuConfigured()) return
  const db = getMatuClient()
  const { error } = await db.from('notifications').eq('user_id', userId).update({ read: true })
  if (error) throw new Error(error.message)
}

export function subscribeNotificationsRealtime(
  userId: string,
  onChange: () => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const channel = db
    .channel('notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (raw: unknown) => {
      const p = raw as Record<string, unknown>
      const event = String(p.eventType ?? p.action ?? 'INSERT').toUpperCase()
      const row = matuRealtimeRow(p, event)
      if (rowUserId(row) === userId) onChange()
    })
    .subscribe()

  return () => {
    db.removeChannel(channel)
  }
}

export function subscribeRealtime(
  onChange: (table: string) => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  // Solo tablas estructurales — presence, chat y notificaciones tienen stores dedicados.
  const tables = [
    'cards',
    'lists',
    'boards',
    'workspaces',
    'workspace_members',
    'board_members',
    'board_invite_uses',
  ]

  const channels = tables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange(table)
      })
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}

export function profileFromAuth(
  userId: string,
  email: string,
  name?: string | null,
  avatar?: string | null,
): User {
  const normalizedEmail = email.trim().toLowerCase()
  const displayName = name?.trim() || normalizedEmail.split('@')[0] || 'Usuario'
  return {
    id: userId,
    name: displayName,
    email: normalizedEmail,
    avatar: avatar?.trim() || '',
    initials: initialsFromName(displayName),
  }
}

/**
 * After MatuDB auth (email or OAuth): upsert profiles row, accept invites,
 * and create the default workspace when the user has none yet.
 */
export async function bootstrapAppUser(
  userId: string,
  email: string,
  name?: string | null,
  avatar?: string | null,
): Promise<User> {
  const draft = profileFromAuth(userId, email, name, avatar)
  const profile = await ensureUserProfile(draft)

  try {
    await acceptPendingInvites(userId, profile.email)
    await acceptPendingBoardInvites(userId, profile.email)
  } catch (err) {
    console.warn('[matuData] bootstrap invites:', err)
  }

  try {
    const db = getMatuClient()
    const { data: memberships, error } = await db
      .from('workspace_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      console.warn('[matuData] bootstrap memberships:', error.message)
      return profile
    }

    const hasWorkspace = Array.isArray(memberships) && memberships.length > 0
    if (!hasWorkspace) {
      await createDefaultWorkspace(userId, profile.name)
    }
  } catch (err) {
    console.warn('[matuData] bootstrap workspace:', err)
  }

  return profile
}
