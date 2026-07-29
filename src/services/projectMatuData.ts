import type {
  Project,
  ProjectActivity,
  ProjectCost,
  ProjectDeliverable,
  ProjectDocument,
  ProjectFolder,
  ProjectInvite,
  ProjectMember,
  ProjectMilestone,
  ProjectRisk,
  ProjectTask,
  ProjectTaskComment,
  ProjectTimeEntry,
  ProjectsDataState,
} from '@/types/projects'
import { getMatuClient, isMatuConfigured } from '@/lib/matu'
import { fromJsonb, toJsonb } from '@/lib/dbJson'
import { DEFAULT_CURRENCY } from '@/utils/currency'
import {
  clearTableMissing,
  isCollaborationTable,
  isMissingTableError,
  isTableMissing,
  markTableMissing,
} from '@/lib/matuTables'
import {
  matuRealtimeRow,
  matuRealtimeTableChannel,
  payloadBelongsToProject,
} from '@/lib/matuRealtime'

function isDuplicateKeyError(message: string): boolean {
  return /already exists|duplicate key|unique constraint|409/i.test(message)
}

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

  if (findErr) throw new Error(findErr.message)

  const { id: _id, ...updateData } = data

  if (existing) {
    const { error } = await db.from(table).eq('id', id).update(updateData)
    if (error) throw new Error(error.message)
    return
  }

  const { error: insertErr } = await db.from(table).insert(data)
  if (!insertErr) return

  if (isDuplicateKeyError(insertErr.message)) {
    const { error: retryErr } = await db.from(table).eq('id', id).update(updateData)
    if (retryErr) throw new Error(retryErr.message)
    return
  }

  throw new Error(insertErr.message)
}

async function deleteOrphans(
  table: string,
  projectIds: string[],
  keepIds: string[],
): Promise<void> {
  if (projectIds.length === 0) return
  const db = getMatuClient()
  const { data: rows, error } = await db
    .from(table)
    .select('id, project_id')
    .in('project_id', projectIds)

  if (error) throw new Error(error.message)

  const keep = new Set(keepIds)
  for (const row of (rows as { id: string; project_id: string }[] | null) ?? []) {
    if (!keep.has(row.id)) {
      const { error: delErr } = await db.from(table).eq('id', row.id).delete()
      if (delErr) throw new Error(delErr.message)
    }
  }
}

async function queryRowsByProjectIds(
  projectIds: string[],
  table: string,
): Promise<Record<string, unknown>[]> {
  if (projectIds.length === 0 || isTableMissing(table)) return []

  const db = getMatuClient()
  const { data, error } = await db.from(table).select('*').in('project_id', projectIds)
  if (error) {
    if (isCollaborationTable(table) && isMissingTableError(error.message)) {
      markTableMissing(table)
      return []
    }
    throw new Error(error.message)
  }
  if (isCollaborationTable(table)) clearTableMissing(table)
  return (data as Record<string, unknown>[]) ?? []
}

async function queryRowsByProjectId(
  projectId: string,
  table: string,
): Promise<Record<string, unknown>[]> {
  return queryRowsByProjectIds([projectId], table)
}

async function saveRecordSafe(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (isTableMissing(table)) return
  try {
    await saveRecord(table, id, data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (isCollaborationTable(table) && isMissingTableError(msg)) {
      markTableMissing(table)
      return
    }
    throw err
  }
}

async function deleteOrphansSafe(
  table: string,
  projectIds: string[],
  keepIds: string[],
): Promise<void> {
  if (isTableMissing(table)) return
  try {
    await deleteOrphans(table, projectIds, keepIds)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (isCollaborationTable(table) && isMissingTableError(msg)) {
      markTableMissing(table)
      return
    }
    throw err
  }
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    client: (row.client as string) ?? '',
    responsibleId: (row.responsible_id as string) ?? null,
    priority: (row.priority as Project['priority']) ?? 'media',
    status: (row.status as Project['status']) ?? 'planning',
    category: (row.category as string) ?? '',
    tags: fromJsonb<string[]>(row.tags, []),
    startDate: (row.start_date as string) ?? null,
    dueDate: (row.due_date as string) ?? null,
    budget: Number(row.budget ?? 0),
    currency: (row.currency as string) ?? DEFAULT_CURRENCY,
    profitabilityTarget:
      row.profitability_target != null ? Number(row.profitability_target) : null,
    boardId: (row.board_id as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function projectToDb(p: Project): Record<string, unknown> {
  return {
    id: p.id,
    workspace_id: p.workspaceId,
    name: p.name,
    description: p.description,
    client: p.client,
    responsible_id: p.responsibleId,
    priority: p.priority,
    status: p.status,
    category: p.category,
    tags: toJsonb(p.tags, []),
    start_date: p.startDate,
    due_date: p.dueDate,
    budget: p.budget,
    currency: p.currency,
    profitability_target: p.profitabilityTarget,
    board_id: p.boardId,
    created_by: p.createdBy,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

function toTask(row: Record<string, unknown>): ProjectTask {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    status: (row.status as ProjectTask['status']) ?? 'todo',
    priority: (row.priority as ProjectTask['priority']) ?? 'media',
    assigneeIds: fromJsonb<string[]>(row.assignee_ids, []),
    startDate: (row.start_date as string) ?? null,
    dueDate: (row.due_date as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    position: Number(row.position ?? 0),
    kanbanColumn: (row.kanban_column as ProjectTask['kanbanColumn']) ?? 'todo',
    boardCardId: (row.board_card_id as string) ?? null,
    boardId: (row.board_id as string) ?? null,
    attachments: fromJsonb(row.attachments, []),
    estimateHours: row.estimate_hours != null ? Number(row.estimate_hours) : null,
    loggedMinutes: Number(row.logged_minutes ?? 0),
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function taskToDb(t: ProjectTask): Record<string, unknown> {
  return {
    id: t.id,
    project_id: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee_ids: toJsonb(t.assigneeIds, []),
    start_date: t.startDate,
    due_date: t.dueDate,
    completed_at: t.completedAt,
    position: t.position,
    kanban_column: t.kanbanColumn,
    board_card_id: t.boardCardId,
    board_id: t.boardId,
    attachments: toJsonb(t.attachments, []),
    estimate_hours: t.estimateHours,
    logged_minutes: t.loggedMinutes,
    created_by: t.createdBy,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

function toMilestone(row: Record<string, unknown>): ProjectMilestone {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    startDate: (row.start_date as string) ?? null,
    dueDate: (row.due_date as string) ?? null,
    completed: Boolean(row.completed),
    position: Number(row.position ?? 0),
    createdBy: (row.created_by as string) ?? null,
    updatedBy: (row.updated_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  }
}

function milestoneToDb(m: ProjectMilestone): Record<string, unknown> {
  return {
    id: m.id,
    project_id: m.projectId,
    title: m.title,
    description: m.description,
    start_date: m.startDate,
    due_date: m.dueDate,
    completed: m.completed,
    position: m.position,
    created_by: m.createdBy,
    updated_by: m.updatedBy,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }
}

function toCost(row: Record<string, unknown>): ProjectCost {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    type: (row.type as ProjectCost['type']) ?? 'expense',
    title: row.title as string,
    amount: Number(row.amount ?? 0),
    category: (row.category as string) ?? '',
    paymentMethod: (row.payment_method as ProjectCost['paymentMethod']) ?? 'transfer',
    reference: (row.reference as string) ?? '',
    notes: (row.notes as string) ?? '',
    date: row.date as string,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function costToDb(c: ProjectCost): Record<string, unknown> {
  return {
    id: c.id,
    project_id: c.projectId,
    type: c.type,
    title: c.title,
    amount: c.amount,
    category: c.category,
    payment_method: c.paymentMethod,
    reference: c.reference,
    notes: c.notes,
    date: c.date,
    created_by: c.createdBy,
    created_at: c.createdAt,
  }
}

function toRisk(row: Record<string, unknown>): ProjectRisk {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    type: (row.type as ProjectRisk['type']) ?? 'risk',
    severity: (row.severity as ProjectRisk['severity']) ?? 'medium',
    probability: (row.probability as ProjectRisk['probability']) ?? 'medium',
    status: (row.status as ProjectRisk['status']) ?? 'open',
    mitigationPlan: (row.mitigation_plan as string) ?? '',
    ownerId: (row.owner_id as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function riskToDb(r: ProjectRisk): Record<string, unknown> {
  return {
    id: r.id,
    project_id: r.projectId,
    title: r.title,
    description: r.description,
    type: r.type,
    severity: r.severity,
    probability: r.probability,
    status: r.status,
    mitigation_plan: r.mitigationPlan,
    owner_id: r.ownerId,
    created_by: r.createdBy,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

function toDeliverable(row: Record<string, unknown>): ProjectDeliverable {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    dueDate: (row.due_date as string) ?? null,
    status: (row.status as ProjectDeliverable['status']) ?? 'pending',
    completed: Boolean(row.completed),
    assigneeId: (row.assignee_id as string) ?? null,
    milestoneId: (row.milestone_id as string) ?? null,
    attachments: fromJsonb(row.attachments, []),
    log: fromJsonb(row.log, []),
    createdBy: (row.created_by as string) ?? null,
    updatedBy: (row.updated_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  }
}

function deliverableToDb(d: ProjectDeliverable): Record<string, unknown> {
  return {
    id: d.id,
    project_id: d.projectId,
    title: d.title,
    description: d.description,
    due_date: d.dueDate,
    status: d.status,
    completed: d.completed,
    assignee_id: d.assigneeId,
    milestone_id: d.milestoneId,
    attachments: toJsonb(d.attachments, []),
    log: toJsonb(d.log, []),
    created_by: d.createdBy,
    updated_by: d.updatedBy,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

function toDocument(row: Record<string, unknown>): ProjectDocument {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    folderId: (row.folder_id as string) ?? null,
    title: row.title as string,
    content: (row.content as string) ?? '',
    category: (row.category as string) ?? 'General',
    attachments: fromJsonb(row.attachments, []),
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function documentToDb(d: ProjectDocument): Record<string, unknown> {
  return {
    id: d.id,
    project_id: d.projectId,
    folder_id: d.folderId,
    title: d.title,
    content: d.content,
    category: d.category,
    attachments: toJsonb(d.attachments, []),
    created_by: d.createdBy,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

function toFolder(row: Record<string, unknown>): ProjectFolder {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    parentId: (row.parent_id as string) ?? null,
    name: row.name as string,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function folderToDb(f: ProjectFolder): Record<string, unknown> {
  return {
    id: f.id,
    project_id: f.projectId,
    parent_id: f.parentId,
    name: f.name,
    created_by: f.createdBy,
    created_at: f.createdAt,
  }
}

function toInvite(row: Record<string, unknown>): ProjectInvite {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    email: row.email as string,
    role: (row.role as ProjectInvite['role']) ?? 'member',
    canViewFinance: Boolean(row.can_view_finance),
    canManageTasks: Boolean(row.can_manage_tasks),
    canManageTeam: Boolean(row.can_manage_team),
    status: (row.status as ProjectInvite['status']) ?? 'pending',
    invitedBy: (row.invited_by as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function inviteToDb(i: ProjectInvite): Record<string, unknown> {
  return {
    id: i.id,
    project_id: i.projectId,
    email: i.email,
    role: i.role,
    can_view_finance: i.canViewFinance,
    can_manage_tasks: i.canManageTasks,
    can_manage_team: i.canManageTeam,
    status: i.status,
    invited_by: i.invitedBy,
    created_at: i.createdAt,
  }
}

function toMember(row: Record<string, unknown>): ProjectMember {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    userId: row.user_id as string,
    role: (row.role as ProjectMember['role']) ?? 'member',
    canViewFinance: Boolean(row.can_view_finance),
    canManageTasks: Boolean(row.can_manage_tasks),
    canManageTeam: Boolean(row.can_manage_team),
    joinedAt: row.joined_at as string,
  }
}

function memberToDb(m: ProjectMember): Record<string, unknown> {
  return {
    id: m.id,
    project_id: m.projectId,
    user_id: m.userId,
    role: m.role,
    can_view_finance: m.canViewFinance,
    can_manage_tasks: m.canManageTasks,
    can_manage_team: m.canManageTeam,
    joined_at: m.joinedAt,
  }
}

function toActivity(row: Record<string, unknown>): ProjectActivity {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    workspaceId: (row.workspace_id as string) ?? null,
    userId: row.user_id as string,
    action: row.action as string,
    details: (row.details as string) ?? '',
    entityType: (row.entity_type as string) ?? null,
    entityId: (row.entity_id as string) ?? null,
    entityTitle: (row.entity_title as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function activityToDb(a: ProjectActivity): Record<string, unknown> {
  return {
    id: a.id,
    project_id: a.projectId,
    workspace_id: a.workspaceId ?? null,
    user_id: a.userId,
    action: a.action,
    details: a.details,
    entity_type: a.entityType ?? null,
    entity_id: a.entityId ?? null,
    entity_title: a.entityTitle ?? null,
    created_at: a.createdAt,
  }
}

function toTimeEntry(row: Record<string, unknown>): ProjectTimeEntry {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    taskId: (row.task_id as string) ?? null,
    userId: row.user_id as string,
    description: (row.description as string) ?? '',
    minutes: Number(row.minutes ?? 0),
    entryDate: row.entry_date as string,
    createdAt: row.created_at as string,
  }
}

function timeEntryToDb(e: ProjectTimeEntry): Record<string, unknown> {
  return {
    id: e.id,
    project_id: e.projectId,
    task_id: e.taskId,
    user_id: e.userId,
    description: e.description,
    minutes: e.minutes,
    entry_date: e.entryDate,
    created_at: e.createdAt,
  }
}

function toTaskComment(row: Record<string, unknown>): ProjectTaskComment {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    taskId: row.task_id as string,
    userId: row.user_id as string,
    content: (row.content as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  }
}

function taskCommentToDb(c: ProjectTaskComment): Record<string, unknown> {
  return {
    id: c.id,
    project_id: c.projectId,
    task_id: c.taskId,
    user_id: c.userId,
    content: c.content,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

async function loadProjectRowsByIds(projectIds: string[]): Promise<Project[]> {
  if (projectIds.length === 0) return []
  const db = getMatuClient()
  const { data, error } = await db.from('projects').select('*').in('id', projectIds)
  if (error) throw new Error(error.message)
  return ((data as Record<string, unknown>[]) ?? []).map(toProject)
}

export async function loadProjectById(projectId: string): Promise<Project | null> {
  const rows = await loadProjectRowsByIds([projectId])
  return rows[0] ?? null
}

async function loadProjectsDataForIds(projectIds: string[]): Promise<ProjectsDataState> {
  const projects = await loadProjectRowsByIds(projectIds)

  if (projectIds.length === 0) {
    return {
      projects: [],
      tasks: [],
      milestones: [],
      costs: [],
      risks: [],
      deliverables: [],
      documents: [],
      folders: [],
      invites: [],
      members: [],
      activities: [],
      timeEntries: [],
      taskComments: [],
    }
  }

  const [
    taskRows,
    milestoneRows,
    costRows,
    riskRows,
    deliverableRows,
    documentRows,
    folderRows,
    inviteRows,
    memberRows,
    activityRows,
    timeRows,
    commentRows,
  ] = await Promise.all([
    queryRowsByProjectIds(projectIds, 'project_tasks'),
    queryRowsByProjectIds(projectIds, 'project_milestones'),
    queryRowsByProjectIds(projectIds, 'project_costs'),
    queryRowsByProjectIds(projectIds, 'project_risks'),
    queryRowsByProjectIds(projectIds, 'project_deliverables'),
    queryRowsByProjectIds(projectIds, 'project_documents'),
    queryRowsByProjectIds(projectIds, 'project_folders'),
    queryRowsByProjectIds(projectIds, 'project_invites'),
    queryRowsByProjectIds(projectIds, 'project_members'),
    queryRowsByProjectIds(projectIds, 'project_activities'),
    queryRowsByProjectIds(projectIds, 'project_time_entries'),
    queryRowsByProjectIds(projectIds, 'project_task_comments'),
  ])

  return {
    projects,
    tasks: taskRows.map(toTask),
    milestones: milestoneRows.map(toMilestone),
    costs: costRows.map(toCost),
    risks: riskRows.map(toRisk),
    deliverables: deliverableRows.map(toDeliverable),
    documents: documentRows.map(toDocument),
    folders: folderRows.map(toFolder),
    invites: inviteRows.map(toInvite),
    members: memberRows.map(toMember),
    activities: activityRows.map(toActivity),
    timeEntries: timeRows.map(toTimeEntry),
    taskComments: commentRows.map(toTaskComment),
  }
}

export async function loadProjectsForUser(
  workspaceId: string,
  userId: string,
  isWorkspaceMember: boolean,
): Promise<ProjectsDataState> {
  const db = getMatuClient()
  const projectIdSet = new Set<string>()

  if (isWorkspaceMember) {
    const { data: projectRows, error: pErr } = await db
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)

    if (pErr) throw new Error(pErr.message)
    for (const row of (projectRows as { id: string }[] | null) ?? []) {
      projectIdSet.add(row.id)
    }
  }

  const { data: memberRows, error: mErr } = await db
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)

  if (mErr) throw new Error(mErr.message)
  for (const row of (memberRows as { project_id: string }[] | null) ?? []) {
    projectIdSet.add(row.project_id)
  }

  return loadProjectsDataForIds([...projectIdSet])
}

export async function loadProjectsFromMatu(workspaceId: string): Promise<ProjectsDataState> {
  const db = getMatuClient()

  const { data: projectRows, error: pErr } = await db
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)

  if (pErr) throw new Error(pErr.message)

  const projectIds = ((projectRows as { id: string }[] | null) ?? []).map((row) => row.id)
  return loadProjectsDataForIds(projectIds)
}

export async function syncProjectToMatu(
  projectId: string,
  data: ProjectsDataState,
  options?: { prune?: boolean },
): Promise<void> {
  const project = data.projects.find((p) => p.id === projectId)
  if (project) {
    await saveRecord('projects', project.id, projectToDb(project))
  }

  const byProject = <T extends { projectId: string }>(items: T[]) =>
    items.filter((i) => i.projectId === projectId)

  const tasks = byProject(data.tasks)
  const milestones = byProject(data.milestones)
  const costs = byProject(data.costs)
  const risks = byProject(data.risks)
  const deliverables = byProject(data.deliverables)
  const documents = byProject(data.documents)
  const folders = byProject(data.folders)
  const invites = byProject(data.invites)
  const members = byProject(data.members)
  const activities = byProject(data.activities)
  const timeEntries = byProject(data.timeEntries)
  const taskComments = byProject(data.taskComments ?? [])
  const projectIds = [projectId]

  await Promise.all([
    ...tasks.map((t) => saveRecord('project_tasks', t.id, taskToDb(t))),
    ...milestones.map((m) => saveRecord('project_milestones', m.id, milestoneToDb(m))),
    ...costs.map((c) => saveRecord('project_costs', c.id, costToDb(c))),
    ...risks.map((r) => saveRecord('project_risks', r.id, riskToDb(r))),
    ...deliverables.map((d) => saveRecord('project_deliverables', d.id, deliverableToDb(d))),
    ...documents.map((d) => saveRecord('project_documents', d.id, documentToDb(d))),
    ...folders.map((f) => saveRecord('project_folders', f.id, folderToDb(f))),
    ...invites.map((i) => saveRecord('project_invites', i.id, inviteToDb(i))),
    ...members.map((m) => saveRecord('project_members', m.id, memberToDb(m))),
    ...activities.map((a) => saveRecord('project_activities', a.id, activityToDb(a))),
    ...timeEntries.map((e) => saveRecord('project_time_entries', e.id, timeEntryToDb(e))),
    ...taskComments.map((c) => saveRecordSafe('project_task_comments', c.id, taskCommentToDb(c))),
  ])

  // Never prune on routine upsert — incomplete in-memory state was deleting DB rows.
  if (!options?.prune) return

  await Promise.all([
    deleteOrphans('project_tasks', projectIds, tasks.map((t) => t.id)),
    deleteOrphans('project_milestones', projectIds, milestones.map((m) => m.id)),
    deleteOrphans('project_costs', projectIds, costs.map((c) => c.id)),
    deleteOrphans('project_risks', projectIds, risks.map((r) => r.id)),
    deleteOrphans('project_deliverables', projectIds, deliverables.map((d) => d.id)),
    deleteOrphans('project_documents', projectIds, documents.map((d) => d.id)),
    deleteOrphans('project_folders', projectIds, folders.map((f) => f.id)),
    deleteOrphans('project_invites', projectIds, invites.map((i) => i.id)),
    deleteOrphans('project_members', projectIds, members.map((m) => m.id)),
    deleteOrphans('project_activities', projectIds, activities.map((a) => a.id)),
    deleteOrphans('project_time_entries', projectIds, timeEntries.map((e) => e.id)),
    deleteOrphansSafe('project_task_comments', projectIds, taskComments.map((c) => c.id)),
  ])
}

function collectProjectIdsFromState(data: ProjectsDataState): string[] {
  const ids = new Set<string>()
  for (const p of data.projects) ids.add(p.id)
  for (const item of data.tasks) ids.add(item.projectId)
  for (const item of data.milestones) ids.add(item.projectId)
  for (const item of data.costs) ids.add(item.projectId)
  for (const item of data.risks) ids.add(item.projectId)
  for (const item of data.deliverables) ids.add(item.projectId)
  for (const item of data.documents) ids.add(item.projectId)
  for (const item of data.folders) ids.add(item.projectId)
  for (const item of data.invites) ids.add(item.projectId)
  for (const item of data.members) ids.add(item.projectId)
  for (const item of data.activities) ids.add(item.projectId)
  for (const item of data.timeEntries) ids.add(item.projectId)
  for (const item of data.taskComments ?? []) ids.add(item.projectId)
  return [...ids]
}

export async function syncProjectsToMatu(
  workspaceId: string,
  data: ProjectsDataState,
): Promise<void> {
  const projectIds = collectProjectIdsFromState(data)
  await Promise.all(projectIds.map((id) => syncProjectToMatu(id, data)))

  // Do not auto-delete projects from MatuDB based on local workspace view —
  // invited users and partial loads could wipe other teams' data.
}

const PROJECT_TABLES = [
  'projects',
  'project_tasks',
  'project_milestones',
  'project_costs',
  'project_risks',
  'project_deliverables',
  'project_documents',
  'project_folders',
  'project_invites',
  'project_members',
  'project_activities',
  'project_time_entries',
  'project_task_comments',
]

export function subscribeProjectsRealtime(onChange: () => void): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const tables = ['projects', ...realtimeEntityTables()]
  const channels = tables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange()
      })
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}

const PROJECT_ENTITY_TABLES = PROJECT_TABLES.filter((t) => t !== 'projects')

function realtimeEntityTables(): string[] {
  return PROJECT_ENTITY_TABLES.filter(
    (table) => !isCollaborationTable(table) || !isTableMissing(table),
  )
}

/** Realtime scoped to one project — all team members see changes instantly. */
export function subscribeProjectDataRealtime(
  projectId: string,
  onChange: () => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const tables = ['projects', ...realtimeEntityTables()]

  const channels = tables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, (raw: unknown) => {
        const payload = normalizeRealtimePayload(raw, table)
        if (!payload || !payloadBelongsToProject(payload, projectId)) return
        onChange()
      })
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}

export function isProjectsMatuEnabled(): boolean {
  return isMatuConfigured()
}

export async function loadSingleProject(projectId: string): Promise<ProjectsDataState | null> {
  const db = getMatuClient()
  const { data: projectRow, error: pErr } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (pErr) throw new Error(pErr.message)
  if (!projectRow) return null

  const project = toProject(projectRow as Record<string, unknown>)

  const [
    taskRows,
    milestoneRows,
    costRows,
    riskRows,
    deliverableRows,
    documentRows,
    folderRows,
    inviteRows,
    memberRows,
    activityRows,
    timeRows,
    commentRows,
  ] = await Promise.all([
    queryRowsByProjectId(projectId, 'project_tasks'),
    queryRowsByProjectId(projectId, 'project_milestones'),
    queryRowsByProjectId(projectId, 'project_costs'),
    queryRowsByProjectId(projectId, 'project_risks'),
    queryRowsByProjectId(projectId, 'project_deliverables'),
    queryRowsByProjectId(projectId, 'project_documents'),
    queryRowsByProjectId(projectId, 'project_folders'),
    queryRowsByProjectId(projectId, 'project_invites'),
    queryRowsByProjectId(projectId, 'project_members'),
    queryRowsByProjectId(projectId, 'project_activities'),
    queryRowsByProjectId(projectId, 'project_time_entries'),
    queryRowsByProjectId(projectId, 'project_task_comments'),
  ])

  return {
    projects: [project],
    tasks: taskRows.map(toTask),
    milestones: milestoneRows.map(toMilestone),
    costs: costRows.map(toCost),
    risks: riskRows.map(toRisk),
    deliverables: deliverableRows.map(toDeliverable),
    documents: documentRows.map(toDocument),
    folders: folderRows.map(toFolder),
    invites: inviteRows.map(toInvite),
    members: memberRows.map(toMember),
    activities: activityRows.map(toActivity),
    timeEntries: timeRows.map(toTimeEntry),
    taskComments: commentRows.map(toTaskComment),
  }
}

/** Delete one row — use from explicit delete actions only. */
export async function deleteProjectEntity(table: string, id: string): Promise<void> {
  if (!isMatuConfigured()) return
  if (isTableMissing(table)) return

  const db = getMatuClient()
  const { error } = await db.from(table).eq('id', id).delete()
  if (error) {
    if (isCollaborationTable(table) && isMissingTableError(error.message)) {
      markTableMissing(table)
      return
    }
    throw new Error(error.message)
  }
}

export async function deleteProjectRecord(projectId: string): Promise<void> {
  if (!isMatuConfigured()) return
  const db = getMatuClient()
  const { error } = await db.from('projects').eq('id', projectId).delete()
  if (error) throw new Error(error.message)
}

export {
  toProject,
  toTask,
  toMilestone,
  toCost,
  toRisk,
  toDeliverable,
  toDocument,
  toFolder,
  toInvite,
  toMember,
  toActivity,
  toTimeEntry,
  toTaskComment,
}

function normalizeRealtimePayload(
  raw: unknown,
  table: string,
): import('@/types/collaboration').RealtimeChangePayload | null {
  const p = raw as Record<string, unknown>
  const eventRaw = (p.eventType ?? p.action ?? p.event ?? 'INSERT') as string
  const event = eventRaw.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE'
  const row = matuRealtimeRow(p, event)
  const oldRow = (p.old ?? p.previous ?? p.old_data) as Record<string, unknown> | undefined

  if (event === 'DELETE') {
    return { event, table, old: oldRow ?? row }
  }
  if (!row) return null
  return { event, table, new: row, old: oldRow }
}

/** Realtime con payloads — actualizaciones incrementales sin recargar todo. */
export function subscribeProjectIncrementalRealtime(
  projectId: string,
  onPayload: (payload: import('@/types/collaboration').RealtimeChangePayload) => void,
): () => void {
  if (!isMatuConfigured()) return () => {}

  const db = getMatuClient()
  const tables = ['projects', ...realtimeEntityTables()]

  const channels = tables.map((table) =>
    db
      .channel(matuRealtimeTableChannel(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, (raw: unknown) => {
        const payload = normalizeRealtimePayload(raw, table)
        if (!payload || !payloadBelongsToProject(payload, projectId)) return
        onPayload(payload)
      })
      .subscribe(),
  )

  return () => {
    channels.forEach((ch) => db.removeChannel(ch))
  }
}
