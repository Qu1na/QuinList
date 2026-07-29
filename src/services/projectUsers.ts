import type { User } from '@/types'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import {
  matuRealtimeRow,
  matuRealtimeTableChannel,
  rowBelongsToProject,
} from '@/lib/matuRealtime'
import { loadProfilesByIds } from '@/services/boardShare'
import { subscribeProjectDataRealtime } from '@/services/projectMatuData'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'

interface DbProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  initials: string
}

function toUser(row: DbProfile): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? '',
    initials: row.initials,
  }
}

export function collectProjectUserIds(projectId: string): string[] {
  const projectsStore = useProjectsStore()
  const ids = new Set<string>()

  for (const m of projectsStore.getProjectMembers(projectId)) ids.add(m.userId)

  for (const t of projectsStore.getProjectTasks(projectId)) {
    if (t.createdBy) ids.add(t.createdBy)
    for (const uid of t.assigneeIds) ids.add(uid)
  }

  for (const a of projectsStore.getProjectActivities(projectId)) ids.add(a.userId)

  for (const d of projectsStore.getProjectDocuments(projectId)) {
    if (d.createdBy) ids.add(d.createdBy)
  }

  for (const c of projectsStore.getProjectCosts(projectId)) {
    if (c.createdBy) ids.add(c.createdBy)
  }

  for (const r of projectsStore.getProjectRisks(projectId)) {
    if (r.ownerId) ids.add(r.ownerId)
  }

  for (const m of projectsStore.getProjectMilestones(projectId)) {
    if (m.createdBy) ids.add(m.createdBy)
    if (m.updatedBy) ids.add(m.updatedBy)
  }

  for (const del of projectsStore.getProjectDeliverables(projectId)) {
    if (del.assigneeId) ids.add(del.assigneeId)
    for (const entry of del.log ?? []) {
      if (entry.uploadedBy) ids.add(entry.uploadedBy)
    }
  }

  for (const comment of projectsStore.taskComments) {
    if (comment.projectId === projectId) ids.add(comment.userId)
  }

  return [...ids]
}

export async function ensureProjectUserProfiles(projectId: string): Promise<void> {
  const auth = useAuthStore()
  const ids = collectProjectUserIds(projectId)
  const missing = ids.filter((id) => !auth.getUserById(id))
  if (!missing.length) return

  try {
    const profiles = await loadProfilesByIds(missing)
    for (const user of profiles) auth.addUser(user)
  } catch (err) {
    console.error('[projectUsers] Error cargando perfiles:', err)
  }
}

let profilesChannel: ReturnType<ReturnType<typeof getMatuClient>['channel']> | null = null
let profilesSubscribers = 0
const profileListeners = new Set<(user: User) => void>()

function dispatchProfile(raw: unknown) {
  const p = raw as Record<string, unknown>
  const event = String(p.eventType ?? p.action ?? p.event ?? 'INSERT').toUpperCase()
  const row = matuRealtimeRow(p, event) as DbProfile | undefined
  if (!row?.id) return
  const user = toUser(row)
  for (const listener of profileListeners) listener(user)
}

export function subscribeProfilesRealtime(onUser: (user: User) => void): () => void {
  if (!isMatuConfigured()) return () => {}

  profileListeners.add(onUser)
  profilesSubscribers += 1

  if (!profilesChannel) {
    const db = getMatuClient()
    profilesChannel = db
      .channel(matuRealtimeTableChannel('profiles'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, dispatchProfile)
      .subscribe()
  }

  return () => {
    profileListeners.delete(onUser)
    profilesSubscribers = Math.max(0, profilesSubscribers - 1)
    if (profilesSubscribers === 0 && profilesChannel) {
      getMatuClient().removeChannel(profilesChannel)
      profilesChannel = null
    }
  }
}

/**
 * Realtime sync for a single project: tasks, docs, deliverables, gantt, team, etc.
 */
export function subscribeProjectTeamRealtime(
  projectId: string,
  onChange: () => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const unsubData = subscribeProjectDataRealtime(projectId, onChange)

  const unsubProfiles = subscribeProfilesRealtime((user) => {
    useAuthStore().addUser(user)
    onChange()
  })

  const db = getMatuClient()
  const inviteTables = ['project_team_invites', 'project_team_invite_uses'] as const
  const teamInviteChannels = inviteTables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, (raw: unknown) => {
        const p = raw as Record<string, unknown>
        const event = String(p.eventType ?? p.action ?? p.event ?? 'INSERT').toUpperCase()
        const row = matuRealtimeRow(p, event)
        if (table === 'project_team_invite_uses' || rowBelongsToProject(row, projectId, table)) {
          onChange()
        }
      })
      .subscribe(),
  )

  return () => {
    unsubData()
    unsubProfiles()
    teamInviteChannels.forEach((ch) => db.removeChannel(ch))
  }
}

/** @deprecated use subscribeProjectTeamRealtime */
export const subscribeProjectUsersRealtime = subscribeProjectTeamRealtime
