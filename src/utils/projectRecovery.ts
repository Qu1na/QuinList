import type { ProjectsDataState } from '@/types/projects'
import { loadProjectsMatuBackup, persistProjectsData } from '@/services/projectData'

export function countWorkspaceEntities(data: ProjectsDataState, workspaceId: string) {
  const wsProjects = data.projects.filter((p) => p.workspaceId === workspaceId)
  const projectIds = new Set(wsProjects.map((p) => p.id))
  const taskCount = data.tasks.filter((t) => projectIds.has(t.projectId)).length
  const milestoneCount = data.milestones.filter((m) => projectIds.has(m.projectId)).length
  const deliverableCount = data.deliverables.filter((d) => projectIds.has(d.projectId)).length
  return {
    projects: wsProjects.length,
    entities: taskCount + milestoneCount + deliverableCount,
  }
}

export function getWorkspaceBackupData(workspaceId: string): ProjectsDataState | null {
  const backup = loadProjectsMatuBackup()
  if (!backup) return null
  return filterWorkspaceData(backup, workspaceId)
}

export function shouldSaveProjectsBackup(
  workspaceId: string,
  data: ProjectsDataState,
): boolean {
  const counts = countWorkspaceEntities(data, workspaceId)
  return counts.projects > 0 && counts.entities > 0
}

function mergeEntityList<T extends { id: string; projectId: string }>(
  current: T[],
  backup: T[],
  projectIds: Set<string>,
): T[] {
  const byId = new Map(current.filter((item) => projectIds.has(item.projectId)).map((item) => [item.id, item]))
  for (const item of backup) {
    if (projectIds.has(item.projectId) && !byId.has(item.id)) {
      byId.set(item.id, item)
    }
  }
  const merged = [...byId.values()]
  const kept = current.filter((item) => !projectIds.has(item.projectId))
  return [...kept, ...merged]
}

export function mergeWithBackup(
  workspaceId: string,
  data: ProjectsDataState,
): ProjectsDataState {
  const backup = getWorkspaceBackupData(workspaceId)
  if (!backup) return data

  const loaded = countWorkspaceEntities(data, workspaceId)
  const backupCounts = countWorkspaceEntities(backup, workspaceId)
  if (backupCounts.projects === 0 || backupCounts.entities === 0) return data
  if (loaded.projects > 0 && loaded.entities >= backupCounts.entities) return data

  const projectById = new Map(data.projects.map((p) => [p.id, p]))
  for (const project of backup.projects) {
    if (!projectById.has(project.id)) projectById.set(project.id, project)
  }
  const projectIds = new Set(
    [...projectById.values()].filter((p) => p.workspaceId === workspaceId).map((p) => p.id),
  )

  return {
    projects: [...projectById.values()],
    tasks: mergeEntityList(data.tasks, backup.tasks, projectIds),
    milestones: mergeEntityList(data.milestones, backup.milestones, projectIds),
    costs: mergeEntityList(data.costs, backup.costs, projectIds),
    risks: mergeEntityList(data.risks, backup.risks, projectIds),
    deliverables: mergeEntityList(data.deliverables, backup.deliverables, projectIds),
    documents: mergeEntityList(data.documents, backup.documents, projectIds),
    folders: mergeEntityList(data.folders ?? [], backup.folders ?? [], projectIds),
    invites: mergeEntityList(data.invites ?? [], backup.invites ?? [], projectIds),
    members: mergeEntityList(data.members, backup.members, projectIds),
    activities: mergeEntityList(data.activities, backup.activities, projectIds),
    timeEntries: mergeEntityList(data.timeEntries ?? [], backup.timeEntries ?? [], projectIds),
    taskComments: mergeEntityList(data.taskComments ?? [], backup.taskComments ?? [], projectIds),
  }
}

function filterWorkspaceData(
  backup: ProjectsDataState,
  workspaceId: string,
): ProjectsDataState {
  const projectIds = new Set(
    backup.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id),
  )
  return {
    projects: backup.projects.filter((p) => p.workspaceId === workspaceId),
    tasks: backup.tasks.filter((t) => projectIds.has(t.projectId)),
    milestones: backup.milestones.filter((m) => projectIds.has(m.projectId)),
    costs: backup.costs.filter((c) => projectIds.has(c.projectId)),
    risks: backup.risks.filter((r) => projectIds.has(r.projectId)),
    deliverables: backup.deliverables.filter((d) => projectIds.has(d.projectId)),
    documents: backup.documents.filter((d) => projectIds.has(d.projectId)),
    folders: (backup.folders ?? []).filter((f) => projectIds.has(f.projectId)),
    invites: (backup.invites ?? []).filter((i) => projectIds.has(i.projectId)),
    members: backup.members.filter((m) => projectIds.has(m.projectId)),
    activities: backup.activities.filter((a) => projectIds.has(a.projectId)),
    timeEntries: (backup.timeEntries ?? []).filter((e) => projectIds.has(e.projectId)),
    taskComments: (backup.taskComments ?? []).filter((c) => projectIds.has(c.projectId)),
  }
}

export function hasSubstantialBackup(workspaceId: string): boolean {
  const backup = loadProjectsMatuBackup()
  if (!backup) return false
  const counts = countWorkspaceEntities(backup, workspaceId)
  return counts.projects > 0 && counts.entities > 0
}

export async function restoreProjectsFromBackup(workspaceId: string): Promise<boolean> {
  const backup = loadProjectsMatuBackup()
  if (!backup) return false

  const counts = countWorkspaceEntities(backup, workspaceId)
  if (counts.projects === 0 || counts.entities === 0) return false

  const workspaceData = filterWorkspaceData(backup, workspaceId)
  try {
    await persistProjectsData(workspaceId, workspaceData, { forceBackup: true })
    return true
  } catch (err) {
    console.error('[projectRecovery] Failed to restore backup to MatuDB:', err)
    return false
  }
}
