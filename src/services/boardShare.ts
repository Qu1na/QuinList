import type {
  BoardInvite,
  BoardInviteType,
  BoardMember,
  BoardParticipant,
  BoardShareRole,
  User,
} from '@/types'
import { matuRealtimeRow, matuRealtimeTableChannel, rowBelongsToBoard } from '@/lib/matuRealtime'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { generateId, roleLabel } from '@/utils/permissions'
import type { UserRole } from '@/types'
import { slugify } from '@/utils/slug'

interface DbBoardInvite {
  id: string
  board_id: string
  token: string
  board_slug: string
  invite_type: BoardInviteType
  email: string | null
  role: BoardShareRole
  max_uses: number | null
  use_count: number
  enabled: boolean
  created_by: string
  created_at: string
}

interface DbBoardMember {
  id: string
  board_id: string
  user_id: string | null
  email: string | null
  role: BoardShareRole
  invited_by: string
  status: 'pending' | 'accepted'
  created_at: string
}

interface DbProfile {
  id: string
  name: string
  email: string
  avatar: string
  initials: string
}

export class InviteError extends Error {
  constructor(
    message: string,
    public code: 'expired' | 'email_mismatch' | 'not_found' | 'already_used' | 'disabled',
  ) {
    super(message)
    this.name = 'InviteError'
  }
}

function toBoardInvite(row: DbBoardInvite): BoardInvite {
  return {
    id: row.id,
    boardId: row.board_id,
    token: row.token,
    boardSlug: row.board_slug,
    inviteType: row.invite_type,
    email: row.email,
    role: row.role,
    maxUses: row.max_uses,
    useCount: row.use_count,
    enabled: row.enabled,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function toBoardMember(row: DbBoardMember): BoardMember {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    status: row.status,
    createdAt: row.created_at,
  }
}

function createToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

const LOCAL_KEY = 'quinlist_board_invites'

interface LocalState {
  invites: BoardInvite[]
  members: Record<string, BoardMember[]>
  uses: Record<string, string[]>
}

function loadLocal(): LocalState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as LocalState
  } catch {
    /* ignore */
  }
  return { invites: [], members: {}, uses: {} }
}

function saveLocal(state: LocalState) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
}

export function buildInviteUrl(boardSlug: string, token: string): string {
  return `${window.location.origin}/join/${boardSlug}/${token}`
}

export async function createBoardInvite(
  boardId: string,
  boardSlug: string,
  createdBy: string,
  options: {
    inviteType: BoardInviteType
    role: BoardShareRole
    maxUses: number | null
    email?: string
  },
): Promise<BoardInvite> {
  const invite: BoardInvite = {
    id: generateId(),
    boardId,
    token: createToken(),
    boardSlug: slugify(boardSlug) || slugify('tablero'),
    inviteType: options.inviteType,
    email: options.email?.trim().toLowerCase() ?? null,
    role: options.role,
    maxUses: options.maxUses,
    useCount: 0,
    enabled: true,
    createdBy,
    createdAt: new Date().toISOString(),
  }

  if (!isMatuConfigured()) {
    const local = loadLocal()
    local.invites.push(invite)
    saveLocal(local)
    return invite
  }

  const db = getMatuClient()
  const { error } = await db.from('board_invites').insert({
    id: invite.id,
    board_id: invite.boardId,
    token: invite.token,
    board_slug: invite.boardSlug,
    invite_type: invite.inviteType,
    email: invite.email,
    role: invite.role,
    max_uses: invite.maxUses,
    use_count: 0,
    enabled: true,
    created_by: invite.createdBy,
    created_at: invite.createdAt,
  })
  if (error) throw new Error(error.message)

  if (invite.inviteType === 'email' && invite.email) {
    await ensureBoardMemberPending(boardId, invite.email, invite.role, createdBy, invite.id)
  }

  return invite
}

async function ensureBoardMemberPending(
  boardId: string,
  email: string,
  role: BoardShareRole,
  invitedBy: string,
  inviteId: string,
): Promise<void> {
  void inviteId
  if (!isMatuConfigured()) return

  const db = getMatuClient()
  const { data: existing } = await db
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('email', email)
    .maybeSingle()

  if (existing) return

  await db.from('board_members').insert({
    id: generateId(),
    board_id: boardId,
    user_id: null,
    email,
    role,
    invited_by: invitedBy,
    status: 'pending',
  })
}

export async function loadBoardInvites(boardId: string): Promise<BoardInvite[]> {
  if (!isMatuConfigured()) {
    return loadLocal().invites.filter((i) => i.boardId === boardId)
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_invites')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data as DbBoardInvite[]) ?? []).map(toBoardInvite)
}

export async function loadInviteByToken(token: string): Promise<BoardInvite | null> {
  if (!isMatuConfigured()) {
    return loadLocal().invites.find((i) => i.token === token) ?? null
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? toBoardInvite(data as DbBoardInvite) : null
}

export async function loadBoardMembers(boardId: string): Promise<BoardMember[]> {
  if (!isMatuConfigured()) {
    return loadLocal().members[boardId] ?? []
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_members')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data as DbBoardMember[]) ?? []).map(toBoardMember)
}

export async function loadBoardMemberUsers(members: BoardMember[]): Promise<User[]> {
  const userIds = members.map((m) => m.userId).filter(Boolean) as string[]
  return loadProfilesByIds(userIds)
}

export async function loadProfilesByIds(userIds: string[]): Promise<User[]> {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!unique.length) return []

  if (!isMatuConfigured()) {
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    return unique
      .map((id) => auth.getUserById(id))
      .filter((u): u is User => Boolean(u))
  }

  const db = getMatuClient()
  const { data, error } = await db.from('profiles').select('*').in('id', unique)
  if (error) throw new Error(error.message)

  return ((data as DbProfile[]) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar ?? '',
    initials: p.initials,
  }))
}

export async function loadBoardParticipants(boardId: string): Promise<BoardParticipant[]> {
  if (!isMatuConfigured()) return []

  const db = getMatuClient()
  const { data: boardRow, error: boardErr } = await db
    .from('boards')
    .select('workspace_id')
    .eq('id', boardId)
    .maybeSingle()

  if (boardErr) throw new Error(boardErr.message)
  if (!boardRow) return []

  const workspaceId = (boardRow as { workspace_id: string }).workspace_id

  const { data: wsRow } = await db
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  const ownerId = (wsRow as { owner_id: string } | null)?.owner_id

  const { data: wsMembers, error: wsMemErr } = await db
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)

  if (wsMemErr) throw new Error(wsMemErr.message)

  const boardMembers = await loadBoardMembers(boardId)
  const userIds = new Set<string>()
  const roleByUser = new Map<string, string>()

  if (ownerId) {
    userIds.add(ownerId)
    roleByUser.set(ownerId, 'Propietario')
  }

  for (const m of (wsMembers as { user_id: string; role: UserRole }[]) ?? []) {
    userIds.add(m.user_id)
    if (!roleByUser.has(m.user_id)) {
      roleByUser.set(m.user_id, roleLabel(m.role))
    }
  }

  for (const m of boardMembers) {
    if (m.status !== 'accepted' || !m.userId) continue
    userIds.add(m.userId)
    if (!roleByUser.has(m.userId)) {
      roleByUser.set(
        m.userId,
        m.role === 'member' ? 'Miembro (tablero)' : 'Observador (tablero)',
      )
    }
  }

  if (!userIds.size) return []

  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('*')
    .in('id', [...userIds])

  if (profErr) throw new Error(profErr.message)

  return ((profiles as DbProfile[]) ?? []).map((p) => ({
    user: {
      id: p.id,
      name: p.name,
      email: p.email,
      avatar: p.avatar ?? '',
      initials: p.initials,
    },
    roleLabel: roleByUser.get(p.id) ?? 'Miembro',
  }))
}

export async function acceptBoardInvite(
  boardSlug: string,
  token: string,
  userId: string,
  email: string,
): Promise<{ boardId: string; role: BoardShareRole }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!isMatuConfigured()) {
    const local = loadLocal()
    const invite = local.invites.find((i) => i.token === token)
    if (!invite) throw new InviteError('Invitación no encontrada', 'not_found')
    if (invite.boardSlug !== boardSlug) throw new InviteError('Enlace inválido', 'not_found')
    if (!invite.enabled) throw new InviteError('Este enlace ya no está disponible', 'disabled')
    if (invite.inviteType === 'email' && invite.email !== normalizedEmail) {
      throw new InviteError('Este enlace es solo para el correo invitado', 'email_mismatch')
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new InviteError('Este enlace ya expiró', 'expired')
    }

    const usedBy = local.uses[invite.id] ?? []
    if (usedBy.includes(userId)) {
      return { boardId: invite.boardId, role: invite.role }
    }

    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new InviteError('Este enlace ya expiró', 'expired')
    }

    const list = local.members[invite.boardId] ?? []
    const existing = list.find((m) => m.userId === userId)
    if (!existing) {
      list.push({
        id: generateId(),
        boardId: invite.boardId,
        userId,
        email: normalizedEmail,
        role: invite.role,
        invitedBy: invite.createdBy,
        status: 'accepted',
        createdAt: new Date().toISOString(),
      })
      local.members[invite.boardId] = list
    }

    local.uses[invite.id] = [...usedBy, userId]
    invite.useCount += 1
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      invite.enabled = false
    }
    saveLocal(local)
    return { boardId: invite.boardId, role: invite.role }
  }

  const db = getMatuClient()
  const { data: row, error } = await db
    .from('board_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!row) throw new InviteError('Invitación no encontrada', 'not_found')

  const invite = toBoardInvite(row as DbBoardInvite)

  if (invite.boardSlug !== boardSlug) {
    throw new InviteError('Enlace inválido', 'not_found')
  }
  if (!invite.enabled) {
    throw new InviteError('Este enlace ya no está disponible', 'disabled')
  }
  if (invite.inviteType === 'email' && invite.email !== normalizedEmail) {
    throw new InviteError('Este enlace es solo para el correo invitado', 'email_mismatch')
  }
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    throw new InviteError('Este enlace ya expiró (límite de usuarios alcanzado)', 'expired')
  }

  const { data: priorUse } = await db
    .from('board_invite_uses')
    .select('id')
    .eq('invite_id', invite.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (priorUse) {
    return { boardId: invite.boardId, role: invite.role }
  }

  const { data: existingMember } = await db
    .from('board_members')
    .select('id, role')
    .eq('board_id', invite.boardId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existingMember) {
    const { error: memberErr } = await db.from('board_members').insert({
      id: generateId(),
      board_id: invite.boardId,
      user_id: userId,
      email: normalizedEmail,
      role: invite.role,
      invited_by: invite.createdBy,
      status: 'accepted',
    })
    if (memberErr) throw new Error(memberErr.message)
  } else {
    await db.from('board_members').eq('id', (existingMember as { id: string }).id).update({
      status: 'accepted',
      role: invite.role,
    })
  }

  await db.from('board_invite_uses').insert({
    id: generateId(),
    invite_id: invite.id,
    user_id: userId,
  })

  const newCount = invite.useCount + 1
  const updates: Record<string, unknown> = { use_count: newCount }
  if (invite.maxUses !== null && newCount >= invite.maxUses) {
    updates.enabled = false
  }
  await db.from('board_invites').eq('id', invite.id).update(updates)

  return { boardId: invite.boardId, role: invite.role }
}

export async function acceptPendingBoardInvites(userId: string, email: string): Promise<void> {
  if (!isMatuConfigured()) return

  const db = getMatuClient()
  const normalized = email.trim().toLowerCase()

  const { data: invites, error } = await db
    .from('board_members')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'pending')

  if (error || !invites?.length) return

  for (const inv of invites as DbBoardMember[]) {
    await db.from('board_members').eq('id', inv.id).update({
      user_id: userId,
      status: 'accepted',
    })
  }
}

export async function loadBoardAccessForUser(
  userId: string,
): Promise<Record<string, BoardShareRole>> {
  if (!isMatuConfigured()) {
    const local = loadLocal()
    const access: Record<string, BoardShareRole> = {}
    for (const [, members] of Object.entries(local.members)) {
      const member = members.find((m) => m.userId === userId && m.status === 'accepted')
      if (member) access[member.boardId] = member.role
    }
    return access
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('board_members')
    .select('board_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (error) throw new Error(error.message)

  const access: Record<string, BoardShareRole> = {}
  for (const row of (data as { board_id: string; role: BoardShareRole }[]) ?? []) {
    access[row.board_id] = row.role
  }
  return access
}

export async function loadBoardIdsForUser(userId: string): Promise<string[]> {
  const access = await loadBoardAccessForUser(userId)
  return Object.keys(access)
}

export function subscribeBoardShareRealtime(
  boardId: string,
  onChange: () => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const tables = ['board_invites', 'board_members', 'board_invite_uses']

  const channels = tables.map((table) => {
    return db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, (raw: unknown) => {
        const p = raw as Record<string, unknown>
        const event = String(p.eventType ?? p.action ?? p.event ?? 'INSERT').toUpperCase()
        const row = matuRealtimeRow(p, event)
        if (table === 'board_invite_uses' || rowBelongsToBoard(row, boardId)) {
          onChange()
        }
      })
      .subscribe()
  })

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}
