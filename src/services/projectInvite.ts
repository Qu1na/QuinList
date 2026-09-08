import type { ProjectMember, ProjectTeamInvite } from '@/types/projects'
import type { UserRole } from '@/types'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { matuRealtimeRow, matuRealtimeTableChannel, rowBelongsToProject } from '@/lib/matuRealtime'
import { generateId } from '@/utils/permissions'
import { todayCalendarDate } from '@/utils/datetime'

interface DbProjectTeamInvite {
  id: string
  project_id: string
  token: string
  role: UserRole
  can_view_finance: boolean
  can_manage_tasks: boolean
  can_manage_team: boolean
  max_uses: number | null
  use_count: number
  enabled: boolean
  created_by: string
  created_at: string
}

export class ProjectInviteError extends Error {
  constructor(
    message: string,
    public code: 'expired' | 'not_found' | 'disabled',
  ) {
    super(message)
    this.name = 'ProjectInviteError'
  }
}

const LOCAL_KEY = 'quinlist_project_team_invites'

interface LocalState {
  invites: ProjectTeamInvite[]
  uses: Record<string, string[]>
}

function loadLocal(): LocalState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as LocalState
  } catch {
    /* ignore */
  }
  return { invites: [], uses: {} }
}

function saveLocal(state: LocalState) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
}

function createToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function toInvite(row: DbProjectTeamInvite): ProjectTeamInvite {
  return {
    id: row.id,
    projectId: row.project_id,
    token: row.token,
    role: row.role,
    canViewFinance: row.can_view_finance,
    canManageTasks: row.can_manage_tasks,
    canManageTeam: row.can_manage_team,
    maxUses: row.max_uses,
    useCount: row.use_count,
    enabled: row.enabled,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function buildProjectInviteUrl(projectId: string, token: string): string {
  return `${window.location.origin}/join/project/${projectId}/${token}`
}

export async function createProjectTeamInvite(
  projectId: string,
  createdBy: string,
  options: {
    role: UserRole
    canViewFinance?: boolean
    canManageTasks?: boolean
    canManageTeam?: boolean
    maxUses?: number | null
  },
): Promise<ProjectTeamInvite> {
  const invite: ProjectTeamInvite = {
    id: generateId(),
    projectId,
    token: createToken(),
    role: options.role,
    canViewFinance: options.canViewFinance ?? false,
    canManageTasks: options.canManageTasks ?? true,
    canManageTeam: options.canManageTeam ?? false,
    maxUses: options.maxUses ?? null,
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
  const { error } = await db.from('project_team_invites').insert({
    id: invite.id,
    project_id: invite.projectId,
    token: invite.token,
    role: invite.role,
    can_view_finance: invite.canViewFinance,
    can_manage_tasks: invite.canManageTasks,
    can_manage_team: invite.canManageTeam,
    max_uses: invite.maxUses,
    use_count: 0,
    enabled: true,
    created_by: invite.createdBy,
    created_at: invite.createdAt,
  })
  if (error) {
    if (/table does not exist|does not exist|404/i.test(error.message)) {
      throw new Error('La tabla project_team_invites no existe. Ejecuta docs/migration-project-modules.sql en MatuDB.')
    }
    throw new Error(error.message)
  }

  return invite
}

export async function loadProjectTeamInvites(projectId: string): Promise<ProjectTeamInvite[]> {
  if (!isMatuConfigured()) {
    return loadLocal().invites.filter((i) => i.projectId === projectId)
  }

  const db = getMatuClient()
  const { data, error } = await db
    .from('project_team_invites')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    if (/table does not exist|does not exist|404/i.test(error.message)) {
      console.warn('[projectInvite] Tabla project_team_invites no existe. Ejecuta docs/migration-project-modules.sql')
      return []
    }
    throw new Error(error.message)
  }
  return ((data as DbProjectTeamInvite[]) ?? []).map(toInvite)
}

export async function revokeProjectTeamInvite(inviteId: string): Promise<void> {
  if (!isMatuConfigured()) {
    const local = loadLocal()
    local.invites = local.invites.map((i) => (i.id === inviteId ? { ...i, enabled: false } : i))
    saveLocal(local)
    return
  }

  const db = getMatuClient()
  const { error } = await db.from('project_team_invites').eq('id', inviteId).update({ enabled: false })
  if (error) throw new Error(error.message)
}

export async function acceptProjectTeamInvite(
  projectId: string,
  token: string,
  userId: string,
): Promise<{ projectId: string; member: ProjectMember }> {
  if (!isMatuConfigured()) {
    const local = loadLocal()
    const invite = local.invites.find((i) => i.token === token && i.projectId === projectId)
    if (!invite) throw new ProjectInviteError('Invitación no encontrada', 'not_found')
    if (!invite.enabled) throw new ProjectInviteError('Este enlace ya no está disponible', 'disabled')
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new ProjectInviteError('Este enlace ya expiró', 'expired')
    }

    const usedBy = local.uses[invite.id] ?? []
    if (usedBy.includes(userId)) {
      return {
        projectId: invite.projectId,
        member: {
          id: generateId(),
          projectId: invite.projectId,
          userId,
          role: invite.role,
          canViewFinance: invite.canViewFinance,
          canManageTasks: invite.canManageTasks,
          canManageTeam: invite.canManageTeam,
          joinedAt: todayCalendarDate(),
        },
      }
    }

    invite.useCount += 1
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) invite.enabled = false
    local.uses[invite.id] = [...usedBy, userId]
    saveLocal(local)

    return {
      projectId: invite.projectId,
      member: {
        id: generateId(),
        projectId: invite.projectId,
        userId,
        role: invite.role,
        canViewFinance: invite.canViewFinance,
        canManageTasks: invite.canManageTasks,
        canManageTeam: invite.canManageTeam,
        joinedAt: todayCalendarDate(),
      },
    }
  }

  const db = getMatuClient()
  const { data: row, error } = await db
    .from('project_team_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!row) throw new ProjectInviteError('Invitación no encontrada', 'not_found')

  const invite = toInvite(row as DbProjectTeamInvite)
  if (invite.projectId !== projectId) {
    throw new ProjectInviteError('Enlace inválido', 'not_found')
  }
  if (!invite.enabled) {
    throw new ProjectInviteError('Este enlace ya no está disponible', 'disabled')
  }
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    throw new ProjectInviteError('Este enlace ya expiró', 'expired')
  }

  const { data: existingUse } = await db
    .from('project_team_invite_uses')
    .select('id')
    .eq('invite_id', invite.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingUse) {
    const { data: existingMember } = await db
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      return {
        projectId,
        member: {
          id: existingMember.id as string,
          projectId,
          userId,
          role: (existingMember.role as UserRole) ?? invite.role,
          canViewFinance: Boolean(existingMember.can_view_finance),
          canManageTasks: Boolean(existingMember.can_manage_tasks),
          canManageTeam: Boolean(existingMember.can_manage_team),
          joinedAt: existingMember.joined_at as string,
        },
      }
    }
  }

  const { data: existingMember } = await db
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  const memberId = (existingMember?.id as string | undefined) ?? generateId()
  const joinedAt = todayCalendarDate()

  // Defensa: profiles debe existir antes del insert (FK project_members_user_id_fkey)
  const { data: profileRow } = await db
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!profileRow) {
    throw new Error(
      'Tu perfil aún no está listo en la base de datos. Cierra sesión, vuelve a entrar e intenta de nuevo con el enlace.',
    )
  }

  if (existingMember) {
    await db.from('project_members').eq('id', memberId).update({
      role: invite.role,
      can_view_finance: invite.canViewFinance,
      can_manage_tasks: invite.canManageTasks,
      can_manage_team: invite.canManageTeam,
    })
  } else {
    const { error: memberErr } = await db.from('project_members').insert({
      id: memberId,
      project_id: projectId,
      user_id: userId,
      role: invite.role,
      can_view_finance: invite.canViewFinance,
      can_manage_tasks: invite.canManageTasks,
      can_manage_team: invite.canManageTeam,
      joined_at: joinedAt,
    })
    if (memberErr) throw new Error(memberErr.message)
  }

  if (!existingUse) {
    await db.from('project_team_invite_uses').insert({
      id: generateId(),
      invite_id: invite.id,
      user_id: userId,
    })

    const newCount = invite.useCount + 1
    const updates: Record<string, unknown> = { use_count: newCount }
    if (invite.maxUses !== null && newCount >= invite.maxUses) updates.enabled = false
    await db.from('project_team_invites').eq('id', invite.id).update(updates)
  }

  return {
    projectId,
    member: {
      id: memberId,
      projectId,
      userId,
      role: invite.role,
      canViewFinance: invite.canViewFinance,
      canManageTasks: invite.canManageTasks,
      canManageTeam: invite.canManageTeam,
      joinedAt,
    },
  }
}

export function subscribeProjectTeamInvitesRealtime(
  projectId: string,
  onChange: () => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const tables = ['project_team_invites', 'project_members'] as const
  const channels = tables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, (raw: unknown) => {
        const p = raw as Record<string, unknown>
        const event = String(p.eventType ?? p.action ?? p.event ?? 'INSERT').toUpperCase()
        const row = matuRealtimeRow(p, event)
        if (rowBelongsToProject(row, projectId, table)) onChange()
      })
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}
