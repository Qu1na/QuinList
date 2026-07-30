import { defineStore } from 'pinia'
import { ref, computed, watch, type Ref } from 'vue'
import type {
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectCost,
  ProjectRisk,
  ProjectNote,
  ProjectDeliverable,
  ProjectDocument,
  ProjectFolder,
  ProjectInvite,
  ProjectMember,
  ProjectActivity,
  ProjectTimeEntry,
  ProjectTaskComment,
  ProjectDetailTab,
  ProjectsDataState,
  TransactionType,
  PaymentMethod,
  DeliverableLogEntry,
} from '@/types/projects'
import type { Attachment, Priority, UserRole } from '@/types'
import { loadProjectsData, persistProjectsData } from '@/services/projectData'
import { restoreProjectsFromBackup } from '@/utils/projectRecovery'
import {
  deleteProjectEntity,
  deleteProjectRecord,
  isProjectsMatuEnabled,
  loadProjectById,
  loadSingleProject,
  subscribeWorkspaceProjectsRealtime,
  syncProjectChatUpload,
} from '@/services/projectMatuData'
import { applyRealtimePayload } from '@/services/projectRealtime'
import { ensureProjectUserProfiles } from '@/services/projectUsers'
import type { ActivityActionType } from '@/types/collaboration'
import type { RealtimeChangePayload } from '@/types/collaboration'
import { useCollaborationStore } from './collaboration'
import { useQuinListStore } from './quinlist'
import { useAuthStore } from './auth'
import { isWorkspaceMember } from '@/utils/projectAccess'
import { generateId } from '@/utils/permissions'
import {
  compareCalendarDates,
  compareInstants,
  nowInstantISO,
  todayCalendarDate,
} from '@/utils/datetime'
import {
  calcFinanceSummary,
  calcProjectProgress,
  collectProjectFiles,
  getCompletedTasks,
  getPendingTasks,
  getUpcomingTasks,
} from '@/utils/projectStats'
import {
  detectAutoRisks,
  getAutoSource,
  withAutoMarker,
  stripAutoMarker,
} from '@/utils/projectRiskDetection'
import { notifyTaskComment, notifyTaskAssigned } from '@/services/projectNotifications'
import { randomPalette } from '@/utils/projectNotes'
import { findTodoList, getDefaultBoardLists } from '@/utils/boardDefaults'
import { formatMoney, DEFAULT_CURRENCY } from '@/utils/currency'
import { uploadProjectFile } from '@/services/storage'
import { isMatuConfigured } from '@/lib/matu'
import { cloneProjectsState, readProjectsState, writeProjectsState } from '@/utils/projectOptimistic'

export const DASHBOARD_ACTIVITY_LIMIT = 7

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const tasks = ref<ProjectTask[]>([])
  const milestones = ref<ProjectMilestone[]>([])
  const costs = ref<ProjectCost[]>([])
  const risks = ref<ProjectRisk[]>([])
  const notes = ref<ProjectNote[]>([])
  const deliverables = ref<ProjectDeliverable[]>([])
  const documents = ref<ProjectDocument[]>([])
  const folders = ref<ProjectFolder[]>([])
  const invites = ref<ProjectInvite[]>([])
  const members = ref<ProjectMember[]>([])
  const activities = ref<ProjectActivity[]>([])
  const timeEntries = ref<ProjectTimeEntry[]>([])
  const taskComments = ref<ProjectTaskComment[]>([])
  const isReady = ref(false)
  const currentProjectId = ref<string | null>(null)
  const activeTab = ref<ProjectDetailTab>('dashboard')
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let saveChain: Promise<void> = Promise.resolve()
  let saveWaiters: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []
  const suppressedRealtimeKeys = new Map<string, number>()
  const REALTIME_SUPPRESS_MS = 4000
  let loadedWorkspaceId: string | null = null
  let workspaceWatchStop: (() => void) | null = null
  let workspaceRealtimeUnsub: (() => void) | null = null

  const currentProject = computed(() =>
    projects.value.find((p) => p.id === currentProjectId.value) ?? null,
  )

  function workspaceProjects(workspaceId: string) {
    return accessibleProjects(workspaceId)
  }

  function accessibleProjects(workspaceId: string) {
    const auth = useAuthStore()
    const userId = auth.currentUserId
    if (!userId) return []

    const wsMember = isWorkspaceMember(workspaceId, userId)
    if (wsMember) {
      return projects.value.filter((p) => p.workspaceId === workspaceId)
    }

    return projects.value.filter((p) =>
      members.value.some((m) => m.projectId === p.id && m.userId === userId),
    )
  }

  function getMyProjectMembership(projectId: string) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return null
    return (
      members.value.find(
        (m) => m.projectId === projectId && m.userId === auth.currentUserId,
      ) ?? null
    )
  }

  function getSharedOnlyProjects() {
    const auth = useAuthStore()
    if (!auth.currentUserId) return []
    return projects.value.filter((p) => {
      const mine = members.value.some(
        (m) => m.projectId === p.id && m.userId === auth.currentUserId,
      )
      if (!mine) return false
      return !isWorkspaceMember(p.workspaceId, auth.currentUserId)
    })
  }

  function canAccessProject(projectId: string) {
    const auth = useAuthStore()
    const project = getProject(projectId)
    if (!project || !auth.currentUserId) return false
    if (isWorkspaceMember(project.workspaceId, auth.currentUserId)) return true
    return members.value.some(
      (m) => m.projectId === projectId && m.userId === auth.currentUserId,
    )
  }

  function getProject(id: string) {
    return projects.value.find((p) => p.id === id) ?? null
  }

  function getProjectTasks(projectId: string) {
    return tasks.value
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => a.position - b.position)
  }

  function getProjectMilestones(projectId: string) {
    return milestones.value
      .filter((m) => m.projectId === projectId)
      .sort((a, b) => a.position - b.position)
  }

  function getProjectTransactions(projectId: string) {
    return costs.value
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => compareCalendarDates(b.date, a.date))
  }

  function getProjectCosts(projectId: string) {
    return getProjectTransactions(projectId)
  }

  function getProjectRisks(projectId: string) {
    return risks.value.filter((r) => r.projectId === projectId)
  }

  function getProjectNotes(projectId: string) {
    return notes.value
      .filter((n) => n.projectId === projectId)
      .sort((a, b) => a.position - b.position || compareInstants(b.createdAt, a.createdAt))
  }

  function getProjectDeliverables(projectId: string) {
    return deliverables.value.filter((d) => d.projectId === projectId)
  }

  function getProjectDocuments(projectId: string) {
    return documents.value.filter((d) => d.projectId === projectId)
  }

  function getProjectMembers(projectId: string) {
    return members.value.filter((m) => m.projectId === projectId)
  }

  function getTaskComments(taskId: string) {
    return taskComments.value
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => compareInstants(a.createdAt, b.createdAt))
  }

  async function addTaskComment(taskId: string, content: string) {
    const auth = useAuthStore()
    if (!auth.currentUserId) throw new Error('Debes iniciar sesión')
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) throw new Error('Tarea no encontrada')

    const trimmed = content.trim()
    if (!trimmed) return null

    const now = nowInstantISO()
    const comment: ProjectTaskComment = {
      id: generateId(),
      projectId: task.projectId,
      taskId,
      userId: auth.currentUserId,
      content: trimmed,
      createdAt: now,
      updatedAt: now,
    }

    commitMutation(() => {
      taskComments.value.push(comment)
      logActivity(task.projectId, 'comment_added', task.title, {
        entityType: 'task',
        entityId: task.id,
        entityTitle: task.title,
      })
      const auth = useAuthStore()
      const authorName = auth.currentUser?.name ?? 'Alguien'
      const project = getProject(task.projectId)
      const recipients = [
        ...task.assigneeIds,
        task.createdBy,
      ].filter((id): id is string => Boolean(id && id !== auth.currentUserId))
      notifyTaskComment([...new Set(recipients)], task.title, task.projectId, task.id, authorName)
    })

    return comment
  }

  function deleteTaskComment(commentId: string) {
    const comment = taskComments.value.find((c) => c.id === commentId)
    if (!comment) return
    const task = tasks.value.find((t) => t.id === comment.taskId)
    commitMutation(() => {
      taskComments.value = taskComments.value.filter((c) => c.id !== commentId)
      if (task) {
        logActivity(task.projectId, 'comment_deleted', task.title, {
          entityType: 'task',
          entityId: task.id,
          entityTitle: task.title,
        })
      }
    })
    void purgeMatuEntity('project_task_comments', commentId)
  }

  function getProjectTimeEntries(projectId: string) {
    return timeEntries.value
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => compareCalendarDates(b.entryDate, a.entryDate))
  }

  function getTaskTimeEntries(taskId: string) {
    return timeEntries.value.filter((e) => e.taskId === taskId)
  }

  function getProjectLoggedMinutes(projectId: string) {
    return getProjectTimeEntries(projectId).reduce((sum, e) => sum + e.minutes, 0)
  }

  function getProjectActivities(projectId: string) {
    return activities.value
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => compareInstants(b.createdAt, a.createdAt))
  }

  function getProjectDashboard(projectId: string) {
    const project = getProject(projectId)
    const projectTasks = getProjectTasks(projectId)
    const projectCosts = getProjectCosts(projectId)
    return {
      progress: calcProjectProgress(projectTasks),
      pending: getPendingTasks(projectTasks).length,
      completed: getCompletedTasks(projectTasks).length,
      upcoming: getUpcomingTasks(projectTasks),
      finance: project ? calcFinanceSummary(project, projectCosts) : null,
      recentActivity: getProjectActivities(projectId).slice(0, DASHBOARD_ACTIVITY_LIMIT),
    }
  }

  function getProjectFolders(projectId: string) {
    return folders.value.filter((f) => f.projectId === projectId)
  }

  function getProjectInvites(projectId: string) {
    return invites.value.filter((i) => i.projectId === projectId)
  }

  function getProjectFiles(projectId: string) {
    const state: ProjectsDataState = {
      projects: projects.value,
      tasks: tasks.value,
      milestones: milestones.value,
      costs: costs.value,
      risks: risks.value,
      notes: notes.value,
      deliverables: deliverables.value,
      documents: documents.value,
      folders: folders.value,
      invites: invites.value,
      members: members.value,
      activities: activities.value,
      timeEntries: timeEntries.value,
      taskComments: taskComments.value,
    }
    return collectProjectFiles(state, projectId)
  }

  async function flushSave() {
    const quinlist = useQuinListStore()
    const wsId = quinlist.currentWorkspaceId
    if (!wsId) return

    await persistProjectsData(wsId, {
      projects: projects.value,
      tasks: tasks.value,
      milestones: milestones.value,
      costs: costs.value,
      risks: risks.value,
      notes: notes.value,
      deliverables: deliverables.value,
      documents: documents.value,
      folders: folders.value,
      invites: invites.value,
      members: members.value,
      activities: activities.value,
      timeEntries: timeEntries.value,
      taskComments: taskComments.value,
    })
  }

  function captureSnapshot(): ProjectsDataState {
    return cloneProjectsState(
      readProjectsState({
        projects: projects.value,
        tasks: tasks.value,
        milestones: milestones.value,
        costs: costs.value,
        risks: risks.value,
        notes: notes.value,
        deliverables: deliverables.value,
        documents: documents.value,
        folders: folders.value,
        invites: invites.value,
        members: members.value,
        activities: activities.value,
        timeEntries: timeEntries.value,
        taskComments: taskComments.value,
      }),
    )
  }

  function restoreSnapshot(snapshot: ProjectsDataState) {
    writeProjectsState(
      {
        projects,
        tasks,
        milestones,
        costs,
        risks,
        notes,
        deliverables,
        documents,
        folders,
        invites,
        members,
        activities,
        timeEntries,
        taskComments,
      },
      snapshot,
    )
  }

  /** Aplica cambio al instante y persiste en segundo plano; revierte si falla el guardado. */
  function commitMutation(mutate: () => void) {
    const snapshot = captureSnapshot()
    mutate()
    void save().catch((err) => {
      console.error('[projects] Error guardando, revirtiendo cambios:', err)
      restoreSnapshot(snapshot)
    })
  }

  async function commitMutationAsync(mutate: () => void | Promise<void>, options?: { immediate?: boolean }) {
    const snapshot = captureSnapshot()
    try {
      await mutate()
      await (options?.immediate ? saveNow() : save())
    } catch (err) {
      restoreSnapshot(snapshot)
      throw err
    }
  }

  function suppressRealtime(table: string, id: string) {
    suppressedRealtimeKeys.set(`${table}:${id}`, Date.now() + REALTIME_SUPPRESS_MS)
  }

  function isRealtimeSuppressed(table: string, id: string | undefined): boolean {
    if (!id) return false
    const key = `${table}:${id}`
    const until = suppressedRealtimeKeys.get(key)
    if (!until) return false
    if (Date.now() > until) {
      suppressedRealtimeKeys.delete(key)
      return false
    }
    return true
  }

  function flushSaveWaiters(waiters: Array<{ resolve: () => void; reject: (err: unknown) => void }>, err?: unknown) {
    if (err) waiters.forEach((w) => w.reject(err))
    else waiters.forEach((w) => w.resolve())
  }

  function runSaveChain(waiters: Array<{ resolve: () => void; reject: (err: unknown) => void }>) {
    saveChain = saveChain
      .then(() => flushSave())
      .then(() => {
        flushSaveWaiters(waiters)
      })
      .catch((err) => {
        flushSaveWaiters(waiters, err)
      })
  }

  /** Guardado inmediato — tareas y otros cambios críticos (sin debounce). */
  function saveNow(): Promise<void> {
    return new Promise((resolve, reject) => {
      saveWaiters.push({ resolve, reject })
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      const waiters = saveWaiters
      saveWaiters = []
      runSaveChain(waiters)
    })
  }

  function save(): Promise<void> {
    return new Promise((resolve, reject) => {
      saveWaiters.push({ resolve, reject })
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        saveTimer = null
        const waiters = saveWaiters
        saveWaiters = []
        runSaveChain(waiters)
      }, 350)
    })
  }

  async function purgeMatuEntity(table: string, id: string) {
    if (!isMatuConfigured()) return
    try {
      await deleteProjectEntity(table, id)
    } catch (err) {
      console.error(`[projects] No se pudo eliminar ${table}/${id}:`, err)
      throw err
    }
  }

  function mergeProjectState(data: ProjectsDataState) {
    const affectedIds = new Set(data.projects.map((p) => p.id))
    if (!affectedIds.size) return

    for (const project of data.projects) {
      const idx = projects.value.findIndex((p) => p.id === project.id)
      if (idx >= 0) projects.value[idx] = project
      else projects.value.push(project)
    }

    const mergeList = <T extends { id: string; projectId: string }>(
      target: Ref<T[]>,
      incoming: T[],
    ) => {
      for (const pid of affectedIds) {
        const next = incoming.filter((item) => item.projectId === pid)
        target.value = target.value.filter((item) => item.projectId !== pid).concat(next)
      }
    }

    mergeList(tasks, data.tasks)
    mergeList(milestones, data.milestones)
    mergeList(costs, data.costs)
    mergeList(risks, data.risks)
    mergeList(notes, data.notes ?? [])
    mergeList(deliverables, data.deliverables)
    mergeList(documents, data.documents)
    mergeList(folders, data.folders ?? [])
    mergeList(invites, data.invites ?? [])
    mergeList(members, data.members)
    mergeList(activities, data.activities)
    mergeList(timeEntries, data.timeEntries ?? [])
    mergeList(taskComments, data.taskComments ?? [])
  }

  async function reloadProject(projectId: string) {
    if (!projectId) return

    if (isMatuConfigured()) {
      const data = await loadSingleProject(projectId)
      if (data) mergeProjectState(data)
      return
    }

    const quinlist = useQuinListStore()
    const auth = useAuthStore()
    const wsId = quinlist.currentWorkspaceId
    if (!wsId) return
    const wsMember = isWorkspaceMember(wsId, auth.currentUserId)
    const all = await loadProjectsData(wsId, auth.currentUserId, wsMember)
    const filtered: ProjectsDataState = {
      projects: all.projects.filter((p) => p.id === projectId),
      tasks: all.tasks.filter((t) => t.projectId === projectId),
      milestones: all.milestones.filter((m) => m.projectId === projectId),
      costs: all.costs.filter((c) => c.projectId === projectId),
      risks: all.risks.filter((r) => r.projectId === projectId),
      notes: (all.notes ?? []).filter((n) => n.projectId === projectId),
      deliverables: all.deliverables.filter((d) => d.projectId === projectId),
      documents: all.documents.filter((d) => d.projectId === projectId),
      folders: (all.folders ?? []).filter((f) => f.projectId === projectId),
      invites: (all.invites ?? []).filter((i) => i.projectId === projectId),
      members: all.members.filter((m) => m.projectId === projectId),
      activities: all.activities.filter((a) => a.projectId === projectId),
      timeEntries: (all.timeEntries ?? []).filter((e) => e.projectId === projectId),
      taskComments: (all.taskComments ?? []).filter((c) => c.projectId === projectId),
    }
    if (filtered.projects.length) mergeProjectState(filtered)
  }

  function applyWorkspaceData(workspaceId: string, data: ProjectsDataState) {
    const incomingIds = new Set(data.projects.map((p) => p.id))
    const keptProjects = projects.value.filter((p) => !incomingIds.has(p.id))
    projects.value = [...keptProjects, ...data.projects]

    const replaceForIncoming = <T extends { id: string; projectId: string }>(
      target: Ref<T[]>,
      incoming: T[],
    ) => {
      target.value = target.value
        .filter((item) => !incomingIds.has(item.projectId))
        .concat(incoming.filter((item) => incomingIds.has(item.projectId)))
    }

    replaceForIncoming(tasks, data.tasks)
    replaceForIncoming(milestones, data.milestones)
    replaceForIncoming(costs, data.costs)
    replaceForIncoming(risks, data.risks)
    replaceForIncoming(notes, data.notes ?? [])
    replaceForIncoming(deliverables, data.deliverables)
    replaceForIncoming(documents, data.documents)
    replaceForIncoming(folders, data.folders ?? [])
    replaceForIncoming(invites, data.invites ?? [])
    replaceForIncoming(members, data.members)
    replaceForIncoming(activities, data.activities)
    replaceForIncoming(timeEntries, data.timeEntries ?? [])
    replaceForIncoming(taskComments, data.taskComments ?? [])
    loadedWorkspaceId = workspaceId
  }

  async function waitForQuinListReady() {
    if (!isMatuConfigured()) return
    const quinlist = useQuinListStore()
    if (quinlist.isReady) return
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => quinlist.isReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        },
        { immediate: true },
      )
    })
  }

  function ensureWorkspaceWatcher() {
    if (workspaceWatchStop) return
    const quinlist = useQuinListStore()
    workspaceWatchStop = watch(
      () => quinlist.currentWorkspaceId,
      (wsId) => {
        if (!wsId || wsId === loadedWorkspaceId) return
        void reloadForWorkspace(wsId)
      },
    )
  }

  function logActivity(
    projectId: string,
    action: ActivityActionType | string,
    details: string,
    meta?: { entityType?: string; entityId?: string; entityTitle?: string },
  ) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return
    const project = getProject(projectId)
    activities.value.unshift({
      id: generateId(),
      projectId,
      workspaceId: project?.workspaceId ?? null,
      userId: auth.currentUserId,
      action,
      details,
      entityType: meta?.entityType ?? null,
      entityId: meta?.entityId ?? null,
      entityTitle: meta?.entityTitle ?? details,
      createdAt: nowInstantISO(),
    })
  }

  function handleRealtimePayload(payload: RealtimeChangePayload) {
    const row = payload.new ?? payload.old
    const rowId = row?.id as string | undefined
    if (isRealtimeSuppressed(payload.table, rowId)) return

    const activity = applyRealtimePayload(payload, {
      projects,
      tasks,
      milestones,
      costs,
      risks,
      notes,
      deliverables,
      documents,
      folders,
      invites,
      members,
      activities,
      timeEntries,
      taskComments,
    })

    if (activity) {
      useCollaborationStore().handleRemoteActivity(activity)
      void ensureProjectUserProfiles(activity.projectId)
    }
  }

  function startWorkspaceRealtime(workspaceId: string) {
    workspaceRealtimeUnsub?.()
    if (!isMatuConfigured()) return

    workspaceRealtimeUnsub = subscribeWorkspaceProjectsRealtime(
      () =>
        projects.value
          .filter((p) => p.workspaceId === workspaceId)
          .map((p) => p.id),
      handleRealtimePayload,
    )
  }

  function stopWorkspaceRealtime() {
    workspaceRealtimeUnsub?.()
    workspaceRealtimeUnsub = null
  }

  async function init() {
    await waitForQuinListReady()
    const quinlist = useQuinListStore()
    const wsId = quinlist.currentWorkspaceId
    if (!wsId) {
      isReady.value = true
      ensureWorkspaceWatcher()
      return
    }
    if (isReady.value && loadedWorkspaceId === wsId) {
      ensureWorkspaceWatcher()
      return
    }
    await reloadForWorkspace(wsId)
    isReady.value = true
    ensureWorkspaceWatcher()
  }

  async function reloadForWorkspace(workspaceId: string) {
    if (!workspaceId) return
    const auth = useAuthStore()
    const userId = auth.currentUserId
    const wsMember = isWorkspaceMember(workspaceId, userId)
    const data = await loadProjectsData(workspaceId, userId, wsMember)
    applyWorkspaceData(workspaceId, data)
    startWorkspaceRealtime(workspaceId)
  }

  /** Restauración manual desde copia local — no se ejecuta automáticamente. */
  async function restoreFromLocalBackup(workspaceId: string) {
    const restored = await restoreProjectsFromBackup(workspaceId)
    if (restored) await reloadForWorkspace(workspaceId)
    return restored
  }

  function upsertProjectMember(member: ProjectMember) {
    const idx = members.value.findIndex(
      (m) => m.projectId === member.projectId && m.userId === member.userId,
    )
    if (idx >= 0) {
      members.value[idx] = { ...members.value[idx]!, ...member }
    } else {
      members.value.push(member)
    }
  }

  async function persistProjectMember(member: ProjectMember) {
    upsertProjectMember(member)
    await save()
  }

  async function ensureProjectLoaded(projectId: string) {
    if (getProject(projectId)) return getProject(projectId)

    if (!isMatuConfigured()) return null

    const data = await loadSingleProject(projectId)
    if (data) {
      mergeProjectState(data)
      return getProject(projectId)
    }

    const remote = await loadProjectById(projectId)
    if (!remote) return null

    const single = await loadSingleProject(projectId)
    if (single) mergeProjectState(single)
    return getProject(projectId)
  }

  function destroy() {
    workspaceWatchStop?.()
    workspaceWatchStop = null
    loadedWorkspaceId = null
    stopWorkspaceRealtime()
    if (saveTimer) clearTimeout(saveTimer)
    saveWaiters = []
    projects.value = []
    tasks.value = []
    milestones.value = []
    costs.value = []
    risks.value = []
    notes.value = []
    deliverables.value = []
    documents.value = []
    folders.value = []
    invites.value = []
    members.value = []
    activities.value = []
    timeEntries.value = []
    currentProjectId.value = null
    isReady.value = false
  }

  async function createProject(input: {
    workspaceId: string
    name: string
    client?: string
    description?: string
    responsibleId?: string | null
    priority?: Priority
    budget: number
    currency?: string
    profitabilityTarget?: number | null
    startDate?: string | null
    dueDate?: string | null
    category?: string
  }) {
    const auth = useAuthStore()
    const now = nowInstantISO()
    const project: Project = {
      id: generateId(),
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      client: input.client?.trim() ?? '',
      responsibleId: input.responsibleId ?? auth.currentUserId,
      priority: input.priority ?? 'media',
      status: 'planning',
      category: input.category?.trim() ?? '',
      tags: [],
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      budget: input.budget,
      currency: input.currency ?? DEFAULT_CURRENCY,
      profitabilityTarget: input.profitabilityTarget ?? null,
      boardId: null,
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    projects.value.push(project)

    if (auth.currentUserId) {
      members.value.push({
        id: generateId(),
        projectId: project.id,
        userId: auth.currentUserId,
        role: 'owner',
        canViewFinance: true,
        canManageTasks: true,
        canManageTeam: true,
        joinedAt: todayCalendarDate(),
      })
    }

    logActivity(
      project.id,
      'project_updated',
      project.name,
      { entityType: 'project', entityId: project.id, entityTitle: project.name },
    )
    await save()
    return project
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    projects.value[idx] = {
      ...projects.value[idx]!,
      ...updates,
      updatedAt: nowInstantISO(),
    }
    logActivity(id, 'project_updated', 'Se modificó la información del proyecto', {
      entityType: 'project',
      entityId: id,
      entityTitle: getProject(id)?.name ?? '',
    })
    await save()
  }

  async function deleteProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id)
    tasks.value = tasks.value.filter((t) => t.projectId !== id)
    milestones.value = milestones.value.filter((m) => m.projectId !== id)
    costs.value = costs.value.filter((c) => c.projectId !== id)
    risks.value = risks.value.filter((r) => r.projectId !== id)
    notes.value = notes.value.filter((n) => n.projectId !== id)
    deliverables.value = deliverables.value.filter((d) => d.projectId !== id)
    documents.value = documents.value.filter((d) => d.projectId !== id)
    folders.value = folders.value.filter((f) => f.projectId !== id)
    invites.value = invites.value.filter((i) => i.projectId !== id)
    members.value = members.value.filter((m) => m.projectId !== id)
    activities.value = activities.value.filter((a) => a.projectId !== id)
    timeEntries.value = timeEntries.value.filter((e) => e.projectId !== id)
    taskComments.value = taskComments.value.filter((c) => c.projectId !== id)
    if (currentProjectId.value === id) currentProjectId.value = null
    if (isMatuConfigured()) {
      try {
        await deleteProjectRecord(id)
      } catch (err) {
        console.error('[projects] Error eliminando proyecto en MatuDB:', err)
      }
    }
    await save()
  }

  async function createTask(
    projectId: string,
    title: string,
    options?: { startDate?: string | null; dueDate?: string | null; status?: ProjectTask['status'] },
  ) {
    const auth = useAuthStore()
    const projectTasks = getProjectTasks(projectId)
    const now = nowInstantISO()
    const status = options?.status ?? 'todo'
    const task: ProjectTask = {
      id: generateId(),
      projectId,
      title: title.trim(),
      description: '',
      status,
      priority: 'media',
      assigneeIds: auth.currentUserId ? [auth.currentUserId] : [],
      startDate: options?.startDate ?? null,
      dueDate: options?.dueDate ?? null,
      completedAt: null,
      position: projectTasks.length,
      kanbanColumn: status,
      boardCardId: null,
      boardId: null,
      attachments: [],
      estimateHours: null,
      loggedMinutes: 0,
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }

    suppressRealtime('project_tasks', task.id)
    tasks.value.push(task)
    logActivity(projectId, 'task_created', `«${task.title}»`, {
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
    })
    try {
      await saveNow()
    } catch (err) {
      tasks.value = tasks.value.filter((t) => t.id !== task.id)
      activities.value = activities.value.filter(
        (a) => !(a.entityType === 'task' && a.entityId === task.id && a.action === 'task_created'),
      )
      throw err
    }
    return task
  }

  async function updateTask(
    taskId: string,
    updates: Partial<ProjectTask>,
    options?: { optimistic?: boolean },
  ) {
    const apply = () => {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx === -1) return null
      const prev = tasks.value[idx]!
      const next = { ...prev, ...updates, updatedAt: nowInstantISO() }
      if (updates.status === 'done' && !next.completedAt) {
        next.completedAt = nowInstantISO()
      }
      if (updates.status && updates.status !== 'done') {
        next.completedAt = null
      }
      if (updates.status) next.kanbanColumn = updates.status
      tasks.value[idx] = next

      if (updates.assigneeIds) {
        const added = updates.assigneeIds.filter((id) => !prev.assigneeIds.includes(id))
        if (added.length) {
          const project = getProject(prev.projectId)
          notifyTaskAssigned(added, next.title, prev.projectId, taskId, project?.name ?? 'Proyecto')
        }
      }

      if (updates.status && updates.status !== prev.status) {
        const action = updates.status === 'done' ? 'task_completed' : 'task_moved'
        logActivity(prev.projectId, action, next.title, {
          entityType: 'task',
          entityId: taskId,
          entityTitle: next.title,
        })
      }
      return next
    }

    if (options?.optimistic) {
      const snapshot = captureSnapshot()
      const next = apply()
      if (!next) return null
      suppressRealtime('project_tasks', taskId)
      try {
        await saveNow()
        return next
      } catch (err) {
        console.error('[projects] Error moviendo tarea, revirtiendo:', err)
        restoreSnapshot(snapshot)
        throw err
      }
    }

    const next = apply()
    if (!next) return null
    suppressRealtime('project_tasks', taskId)
    await saveNow()
    return next
  }

  async function moveTaskToColumn(taskId: string, status: ProjectTask['status']) {
    await updateTask(taskId, { status, kanbanColumn: status }, { optimistic: true })
  }

  async function deleteTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return
    const commentIds = taskComments.value
      .filter((c) => c.taskId === taskId)
      .map((c) => c.id)

    suppressRealtime('project_tasks', taskId)
    for (const cid of commentIds) suppressRealtime('project_task_comments', cid)

    await commitMutationAsync(
      () => {
        tasks.value = tasks.value.filter((t) => t.id !== taskId)
        taskComments.value = taskComments.value.filter((c) => c.taskId !== taskId)
        logActivity(task.projectId, 'task_deleted', task.title, {
          entityType: 'task',
          entityId: task.id,
          entityTitle: task.title,
        })
      },
      { immediate: true },
    )

    await Promise.all(commentIds.map((cid) => purgeMatuEntity('project_task_comments', cid)))
    await purgeMatuEntity('project_tasks', taskId)
  }

  async function openTaskInBoard(taskId: string) {
    const quinlist = useQuinListStore()
    const auth = useAuthStore()
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task || !auth.currentUserId) return null

    const project = getProject(task.projectId)
    let boardId = project?.boardId ?? task.boardId

    if (!boardId) {
      const board = await quinlist.createBoard(
        project!.workspaceId,
        `${project!.name} — Tablero`,
      )
      boardId = board?.id ?? null
      if (boardId) {
        for (const list of getDefaultBoardLists(boardId, generateId)) {
          await quinlist.createList(boardId, list.title)
        }
        if (project) await updateProject(project.id, { boardId })
      }
    }

    if (!boardId) return null

    const lists = quinlist.getListsByBoard(boardId)
    const targetList = findTodoList(lists) ?? lists[0]
    if (!targetList) return null

    const card = await quinlist.createCard(targetList.id, task.title)
    if (!card) return null

    await updateTask(taskId, {
      boardCardId: card.id,
      boardId,
    })

    logActivity(task.projectId, 'Sincronizado con tablero', `«${task.title}» abierta en Kanban`)
    return { boardId, cardId: card.id }
  }

  async function addTransaction(
    projectId: string,
    input: {
      type: TransactionType
      title: string
      amount: number
      category: string
      paymentMethod: PaymentMethod
      reference?: string
      notes?: string
      date: string
    },
  ) {
    const auth = useAuthStore()
    const tx: ProjectCost = {
      id: generateId(),
      projectId,
      type: input.type,
      title: input.title.trim(),
      amount: input.amount,
      category: input.category.trim(),
      paymentMethod: input.paymentMethod,
      reference: input.reference?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      date: input.date,
      createdBy: auth.currentUserId,
      createdAt: nowInstantISO(),
    }
    costs.value.push(tx)
    logActivity(projectId, 'finance_added', tx.title, {
      entityType: 'transaction',
      entityId: tx.id,
      entityTitle: tx.title,
    })
    await save()
    return tx
  }

  async function deleteTransaction(id: string) {
    const tx = costs.value.find((c) => c.id === id)
    costs.value = costs.value.filter((c) => c.id !== id)
    if (tx) {
      logActivity(tx.projectId, 'custom', tx.title, {
        entityType: 'transaction',
        entityId: tx.id,
        entityTitle: tx.title,
      })
    }
    await purgeMatuEntity('project_costs', id)
    await save()
  }

  async function addCost(
    projectId: string,
    input: { title: string; amount: number; category: string; date: string },
  ) {
    return addTransaction(projectId, {
      ...input,
      type: 'expense',
      paymentMethod: 'transfer',
    })
  }

  async function updateMilestone(id: string, updates: Partial<ProjectMilestone>) {
    const ms = milestones.value.find((m) => m.id === id)
    if (!ms) return
    Object.assign(ms, updates)
    await save()
  }

  async function deleteMilestone(id: string) {
    const ms = milestones.value.find((m) => m.id === id)
    milestones.value = milestones.value.filter((m) => m.id !== id)
    if (ms) {
      logActivity(ms.projectId, 'milestone_deleted', ms.title, {
        entityType: 'milestone',
        entityId: ms.id,
        entityTitle: ms.title,
      })
    }
    await purgeMatuEntity('project_milestones', id)
    await save()
  }

  async function updateRisk(id: string, updates: Partial<ProjectRisk>) {
    const risk = risks.value.find((r) => r.id === id)
    if (!risk) return
    Object.assign(risk, updates, { updatedAt: nowInstantISO() })
    await save()
  }

  async function updateDeliverable(
    id: string,
    updates: Partial<ProjectDeliverable>,
    options?: { optimistic?: boolean },
  ) {
    const apply = () => {
      const d = deliverables.value.find((x) => x.id === id)
      if (!d) return
      const prevStatus = d.status
      Object.assign(d, updates, { updatedAt: nowInstantISO() })
      if (updates.status === 'delivered' || updates.status === 'approved') d.completed = true
      if (updates.status && updates.status !== prevStatus) {
        const action =
          updates.status === 'approved' || updates.status === 'delivered'
            ? 'deliverable_completed'
            : 'custom'
        logActivity(d.projectId, action, d.title, {
          entityType: 'deliverable',
          entityId: d.id,
          entityTitle: d.title,
        })
      }
    }

    if (options?.optimistic) {
      const snapshot = captureSnapshot()
      apply()
      void save().catch((err) => {
        console.error('[projects] Error actualizando entregable:', err)
        restoreSnapshot(snapshot)
      })
      return
    }

    await commitMutationAsync(apply)
  }

  async function deleteDeliverable(id: string) {
    const d = deliverables.value.find((x) => x.id === id)
    deliverables.value = deliverables.value.filter((x) => x.id !== id)
    if (d) {
      logActivity(d.projectId, 'deliverable_deleted', d.title, {
        entityType: 'deliverable',
        entityId: d.id,
        entityTitle: d.title,
      })
    }
    await purgeMatuEntity('project_deliverables', id)
    await save()
  }

  async function updateDocument(id: string, updates: Partial<ProjectDocument>) {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return
    Object.assign(doc, updates, { updatedAt: nowInstantISO() })
    await save()
  }

  async function deleteDocument(id: string) {
    const doc = documents.value.find((d) => d.id === id)
    documents.value = documents.value.filter((d) => d.id !== id)
    if (doc) {
      logActivity(doc.projectId, 'custom', doc.title, {
        entityType: 'document',
        entityId: doc.id,
        entityTitle: doc.title,
      })
    }
    await purgeMatuEntity('project_documents', id)
    await save()
  }

  async function addProjectMember(
    projectId: string,
    userId: string,
    role: UserRole = 'member',
    perms?: Partial<Pick<ProjectMember, 'canViewFinance' | 'canManageTasks' | 'canManageTeam'>>,
  ) {
    if (members.value.some((m) => m.projectId === projectId && m.userId === userId)) return
    const member: ProjectMember = {
      id: generateId(),
      projectId,
      userId,
      role,
      canViewFinance: perms?.canViewFinance ?? false,
      canManageTasks: perms?.canManageTasks ?? true,
      canManageTeam: perms?.canManageTeam ?? false,
      joinedAt: todayCalendarDate(),
    }
    members.value.push(member)
    logActivity(projectId, 'member_joined', userId, {
      entityType: 'member',
      entityId: userId,
    })
    await save()
    return member
  }

  async function updateProjectMember(id: string, updates: Partial<ProjectMember>) {
    const m = members.value.find((x) => x.id === id)
    if (!m) return
    if (m.role === 'owner') {
      if (updates.role !== undefined && updates.role !== 'owner') return
      if (
        updates.canManageTasks !== undefined ||
        updates.canViewFinance !== undefined ||
        updates.canManageTeam !== undefined
      ) {
        return
      }
    }
    Object.assign(m, updates)
    await save()
  }

  async function removeProjectMember(id: string) {
    const m = members.value.find((x) => x.id === id)
    if (!m || m.role === 'owner') return
    members.value = members.value.filter((member) => member.id !== id)
    await purgeMatuEntity('project_members', id)
    await save()
  }

  async function addMilestone(
    projectId: string,
    input: { title: string; description?: string; startDate: string; dueDate: string },
  ) {
    if (!input.dueDate) throw new Error('La fecha de vencimiento es obligatoria')
    const auth = useAuthStore()
    const now = nowInstantISO()
    const ms: ProjectMilestone = {
      id: generateId(),
      projectId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      startDate: input.startDate || input.dueDate,
      dueDate: input.dueDate,
      completed: false,
      position: getProjectMilestones(projectId).length,
      createdBy: auth.currentUserId,
      updatedBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    milestones.value.push(ms)
    logActivity(projectId, 'milestone_created', input.title, {
      entityType: 'milestone',
      entityId: ms.id,
      entityTitle: ms.title,
    })
    await save()
    return ms
  }

  async function toggleMilestone(id: string) {
    const ms = milestones.value.find((m) => m.id === id)
    if (!ms) return
    commitMutation(() => {
      ms.completed = !ms.completed
      ms.updatedAt = nowInstantISO()
      logActivity(
        ms.projectId,
        ms.completed ? 'milestone_completed' : 'custom',
        ms.title,
        { entityType: 'milestone', entityId: ms.id, entityTitle: ms.title },
      )
    })
  }

  async function addRisk(
    projectId: string,
    input: {
      title: string
      description: string
      type: ProjectRisk['type']
      severity: ProjectRisk['severity']
      probability?: ProjectRisk['probability']
      mitigationPlan?: string
      ownerId?: string | null
    },
  ) {
    const auth = useAuthStore()
    const risk: ProjectRisk = {
      id: generateId(),
      projectId,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      severity: input.severity,
      probability: input.probability ?? 'medium',
      status: 'open',
      mitigationPlan: input.mitigationPlan?.trim() ?? '',
      ownerId: input.ownerId ?? auth.currentUserId,
      createdBy: auth.currentUserId,
      createdAt: nowInstantISO(),
      updatedAt: nowInstantISO(),
    }
    risks.value.push(risk)
    logActivity(projectId, 'risk_created', risk.title, {
      entityType: 'risk',
      entityId: risk.id,
      entityTitle: risk.title,
    })
    await save()
    return risk
  }

  async function syncAutoRisks(projectId: string) {
    const project = getProject(projectId)
    if (!project) return

    const suggestions = detectAutoRisks(
      project,
      getProjectTasks(projectId),
      getProjectMilestones(projectId),
    )
    const existing = getProjectRisks(projectId)

    for (const suggestion of suggestions) {
      const found = existing.find((r) => {
        const source = getAutoSource(r)
        return source?.type === suggestion.sourceType && source.id === suggestion.sourceId
      })

      const description = withAutoMarker(
        suggestion.description,
        suggestion.sourceType,
        suggestion.sourceId,
      )

      if (found) {
        if (found.status !== 'open') continue
        const updates: Partial<ProjectRisk> = {}
        if (found.title !== suggestion.title) updates.title = suggestion.title
        if (found.severity !== suggestion.severity) updates.severity = suggestion.severity
        if (found.probability !== suggestion.probability) updates.probability = suggestion.probability
        if (found.type !== suggestion.type) updates.type = suggestion.type
        if (stripAutoMarker(found.description) !== suggestion.description) {
          updates.description = description
        }
        if (Object.keys(updates).length) await updateRisk(found.id, updates)
      } else {
        await addRisk(projectId, {
          title: suggestion.title,
          description,
          type: suggestion.type,
          severity: suggestion.severity,
          probability: suggestion.probability,
        })
      }
    }

    for (const risk of existing) {
      const source = getAutoSource(risk)
      if (!source || risk.status !== 'open') continue
      const stillValid = suggestions.some(
        (s) => s.sourceType === source.type && s.sourceId === source.id,
      )
      if (!stillValid) {
        await updateRisk(risk.id, { status: 'closed' })
      }
    }
  }

  async function addDeliverable(projectId: string, title: string, dueDate?: string | null) {
    const auth = useAuthStore()
    const now = nowInstantISO()
    const d: ProjectDeliverable = {
      id: generateId(),
      projectId,
      title: title.trim(),
      description: '',
      dueDate: dueDate ?? null,
      status: 'pending',
      completed: false,
      assigneeId: null,
      milestoneId: null,
      attachments: [],
      log: [],
      createdBy: auth.currentUserId,
      updatedBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    deliverables.value.push(d)
    logActivity(projectId, 'deliverable_created', title, {
      entityType: 'deliverable',
      entityId: d.id,
      entityTitle: d.title,
    })
    await save()
    return d
  }

  function addDeliverableComment(deliverableId: string, text: string) {
    const auth = useAuthStore()
    const d = deliverables.value.find((x) => x.id === deliverableId)
    if (!d || !auth.currentUserId) return null
    const trimmed = text.trim()
    if (!trimmed) return null

    const entry: DeliverableLogEntry = {
      id: generateId(),
      text: trimmed,
      uploadedBy: auth.currentUserId,
      createdAt: nowInstantISO(),
    }

    commitMutation(() => {
      if (!d.log) d.log = []
      d.log.unshift(entry)
      logActivity(d.projectId, 'comment_added', d.title, {
        entityType: 'deliverable',
        entityId: d.id,
        entityTitle: d.title,
      })
    })

    return entry
  }

  function deleteDeliverableComment(deliverableId: string, entryId: string) {
    const d = deliverables.value.find((x) => x.id === deliverableId)
    if (!d?.log) return
    commitMutation(() => {
      d.log = d.log.filter((e) => e.id !== entryId)
      logActivity(d.projectId, 'comment_deleted', d.title, {
        entityType: 'deliverable',
        entityId: d.id,
        entityTitle: d.title,
      })
    })
  }

  async function addDeliverableLog(
    deliverableId: string,
    text: string,
    attachment?: Attachment,
  ) {
    const auth = useAuthStore()
    const d = deliverables.value.find((x) => x.id === deliverableId)
    if (!d) return
    const entry: DeliverableLogEntry = {
      id: generateId(),
      text,
      uploadedBy: auth.currentUserId,
      createdAt: nowInstantISO(),
      attachment,
    }

    await commitMutationAsync(() => {
      if (!d.log) d.log = []
      d.log.unshift(entry)
      if (attachment) {
        if (!d.attachments) d.attachments = []
        d.attachments.push(attachment)
      }
      const action = attachment ? 'file_uploaded' : 'comment_added'
      logActivity(d.projectId, action, attachment?.name ?? d.title, {
        entityType: 'deliverable',
        entityId: d.id,
        entityTitle: d.title,
      })
    })

    return entry
  }

  async function addDeliverableAttachment(deliverableId: string, file: File) {
    const auth = useAuthStore()
    const d = deliverables.value.find((x) => x.id === deliverableId)
    if (!d) return null
    const uploaded = await uploadProjectFile(d.projectId, 'deliverables', deliverableId, file)
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      url: uploaded.url,
      type: file.type,
      size: file.size,
      storageFilename: uploaded.storageFilename,
      uploadedAt: nowInstantISO(),
      uploadedBy: auth.currentUserId ?? '',
    }
    await addDeliverableLog(deliverableId, '', attachment)
    return attachment
  }

  async function addTaskAttachment(taskId: string, file: File) {
    const auth = useAuthStore()
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return null
    const uploaded = await uploadProjectFile(task.projectId, 'tasks', taskId, file)
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      url: uploaded.url,
      type: file.type,
      size: file.size,
      storageFilename: uploaded.storageFilename,
      uploadedAt: nowInstantISO(),
      uploadedBy: auth.currentUserId ?? '',
    }
    if (!task.attachments) task.attachments = []
    task.attachments.push(attachment)
    logActivity(task.projectId, 'file_uploaded', file.name, {
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
    })
    await save()
    return attachment
  }

  async function addDocumentFile(
    projectId: string,
    documentId: string,
    file: File,
  ) {
    const auth = useAuthStore()
    const doc = documents.value.find((d) => d.id === documentId)
    if (!doc) return null
    const uploaded = await uploadProjectFile(projectId, 'documents', documentId, file)
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      url: uploaded.url,
      type: file.type,
      size: file.size,
      storageFilename: uploaded.storageFilename,
      uploadedAt: nowInstantISO(),
      uploadedBy: auth.currentUserId ?? '',
    }
    doc.attachments.push(attachment)
    doc.updatedAt = nowInstantISO()
    logActivity(projectId, 'file_uploaded', file.name, {
      entityType: 'document',
      entityId: doc.id,
      entityTitle: doc.title,
    })
    await save()
    return attachment
  }

  async function createFolder(projectId: string, name: string, parentId: string | null = null) {
    const auth = useAuthStore()
    const folder: ProjectFolder = {
      id: generateId(),
      projectId,
      parentId,
      name: name.trim(),
      createdBy: auth.currentUserId,
      createdAt: nowInstantISO(),
    }
    folders.value.push(folder)
    logActivity(projectId, 'Carpeta creada', folder.name)
    await save()
    return folder
  }

  async function ensureProjectFolder(
    projectId: string,
    name: string,
    parentId: string | null = null,
  ): Promise<string> {
    const { folderId, created } = findOrCreateFolderLocal(projectId, name, parentId)
    if (created) await save()
    return folderId
  }

  function findOrCreateFolderLocal(
    projectId: string,
    name: string,
    parentId: string | null = null,
  ): { folderId: string; folder: ProjectFolder | null; created: boolean } {
    const key = name.trim().toLowerCase()
    const existing = folders.value.find(
      (f) =>
        f.projectId === projectId &&
        (f.parentId ?? null) === parentId &&
        f.name.trim().toLowerCase() === key,
    )
    if (existing) return { folderId: existing.id, folder: null, created: false }

    const auth = useAuthStore()
    const folder: ProjectFolder = {
      id: generateId(),
      projectId,
      parentId,
      name: name.trim(),
      createdBy: auth.currentUserId,
      createdAt: nowInstantISO(),
    }
    folders.value.push(folder)
    return { folderId: folder.id, folder, created: true }
  }

  async function registerChatDocumentFile(
    projectId: string,
    file: File,
    options: {
      folderName: string
      channelLabel: string
      category?: string
    },
  ): Promise<Attachment> {
    const auth = useAuthStore()
    if (!auth.currentUserId) throw new Error('Debes iniciar sesión para adjuntar archivos')

    const { folderId, folder, created: folderCreated } = findOrCreateFolderLocal(
      projectId,
      options.folderName,
      null,
    )

    const now = nowInstantISO()
    const doc: ProjectDocument = {
      id: generateId(),
      projectId,
      folderId,
      title: file.name.trim(),
      content: `Compartido en el canal ${options.channelLabel}.`,
      category: options.category ?? 'Chat',
      attachments: [],
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    documents.value.push(doc)

    const uploaded = await uploadProjectFile(projectId, 'documents', doc.id, file, { strict: true })
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      url: uploaded.url,
      type: file.type,
      size: file.size,
      storageFilename: uploaded.storageFilename,
      uploadedAt: now,
      uploadedBy: auth.currentUserId,
    }
    doc.attachments.push(attachment)
    doc.updatedAt = nowInstantISO()

    const syncedActivities: ProjectActivity[] = []
    const recordActivity = (
      action: string,
      details: string,
      meta?: { entityType?: string; entityId?: string; entityTitle?: string },
    ) => {
      const project = getProject(projectId)
      const entry: ProjectActivity = {
        id: generateId(),
        projectId,
        workspaceId: project?.workspaceId ?? null,
        userId: auth.currentUserId!,
        action,
        details,
        entityType: meta?.entityType ?? 'document',
        entityId: meta?.entityId ?? doc.id,
        entityTitle: meta?.entityTitle ?? details,
        createdAt: nowInstantISO(),
      }
      activities.value.unshift(entry)
      syncedActivities.push(entry)
    }

    if (folderCreated && folder) {
      recordActivity('Carpeta creada', folder.name, {
        entityType: 'folder',
        entityId: folder.id,
        entityTitle: folder.name,
      })
    }
    recordActivity('document_created', doc.title, {
      entityType: 'document',
      entityId: doc.id,
      entityTitle: doc.title,
    })
    recordActivity('file_uploaded', file.name, {
      entityType: 'document',
      entityId: doc.id,
      entityTitle: doc.title,
    })

    if (isProjectsMatuEnabled()) {
      await syncProjectChatUpload({
        folder: folderCreated ? folder ?? undefined : undefined,
        document: doc,
        activities: syncedActivities,
      })
    } else {
      await save()
    }

    return attachment
  }

  async function deleteFolder(id: string) {
    const folder = folders.value.find((f) => f.id === id)
    if (!folder) return
    const childIds = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      for (const f of folders.value) {
        if (f.parentId && childIds.has(f.parentId) && !childIds.has(f.id)) {
          childIds.add(f.id)
          changed = true
        }
      }
    }
    folders.value = folders.value.filter((f) => !childIds.has(f.id))
    documents.value = documents.value.map((d) =>
      d.folderId && childIds.has(d.folderId) ? { ...d, folderId: null } : d,
    )
    logActivity(folder.projectId, 'Carpeta eliminada', folder.name)
    await Promise.all([...childIds].map((fid) => purgeMatuEntity('project_folders', fid)))
    await save()
  }

  async function inviteProjectMember(
    projectId: string,
    email: string,
    role: UserRole = 'member',
    perms?: Partial<Pick<ProjectMember, 'canViewFinance' | 'canManageTasks' | 'canManageTeam'>>,
  ) {
    const auth = useAuthStore()
    const quinlist = useQuinListStore()
    const normalized = email.trim().toLowerCase()
    const ws = quinlist.currentWorkspace
    if (!ws) throw new Error('No hay workspace activo')

    const existingUser = auth.users.find((u) => u.email.toLowerCase() === normalized)
    if (existingUser) {
      const wsMember = ws.members.find((m) => m.userId === existingUser.id)
      if (wsMember) {
        await addProjectMember(projectId, existingUser.id, role, perms)
        return { type: 'added' as const, userId: existingUser.id }
      }
    }

    if (invites.value.some((i) => i.projectId === projectId && i.email === normalized && i.status === 'pending')) {
      throw new Error('Ya existe una invitación pendiente para este correo')
    }

    const invite: ProjectInvite = {
      id: generateId(),
      projectId,
      email: normalized,
      role,
      canViewFinance: perms?.canViewFinance ?? false,
      canManageTasks: perms?.canManageTasks ?? true,
      canManageTeam: perms?.canManageTeam ?? false,
      status: 'pending',
      invitedBy: auth.currentUserId,
      createdAt: nowInstantISO(),
    }
    invites.value.push(invite)
    logActivity(projectId, 'Invitación enviada', normalized)
    await save()
    return { type: 'invited' as const, invite }
  }

  async function deleteRisk(id: string) {
    const risk = risks.value.find((r) => r.id === id)
    risks.value = risks.value.filter((r) => r.id !== id)
    if (risk) {
      logActivity(risk.projectId, 'custom', risk.title, {
        entityType: 'risk',
        entityId: risk.id,
        entityTitle: risk.title,
      })
    }
    await purgeMatuEntity('project_risks', id)
    await save()
  }

  async function addNote(
    projectId: string,
    input: {
      title: string
      content: string
      color?: string
      style?: ProjectNote['style']
    },
  ) {
    const auth = useAuthStore()
    const now = nowInstantISO()
    const existing = getProjectNotes(projectId)
    const palette = randomPalette()
    const note: ProjectNote = {
      id: generateId(),
      projectId,
      title: input.title.trim(),
      content: input.content.trim(),
      color: input.color ?? palette.color,
      style: input.style ?? palette.style,
      rotation: 0,
      position: existing.length,
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    notes.value.push(note)
    logActivity(projectId, 'note_created', note.title, {
      entityType: 'note',
      entityId: note.id,
      entityTitle: note.title,
    })
    await save()
    return note
  }

  async function updateNote(id: string, updates: Partial<ProjectNote>) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    Object.assign(note, updates, { updatedAt: nowInstantISO() })
    logActivity(note.projectId, 'note_updated', note.title, {
      entityType: 'note',
      entityId: note.id,
      entityTitle: note.title,
    })
    await save()
  }

  async function deleteNote(id: string) {
    const note = notes.value.find((n) => n.id === id)
    notes.value = notes.value.filter((n) => n.id !== id)
    if (note) {
      logActivity(note.projectId, 'note_deleted', note.title, {
        entityType: 'note',
        entityId: note.id,
        entityTitle: note.title,
      })
    }
    await purgeMatuEntity('project_notes', id)
    await save()
  }

  async function addDocument(
    projectId: string,
    title: string,
    content: string,
    folderId: string | null = null,
    category = 'General',
  ) {
    const auth = useAuthStore()
    const now = nowInstantISO()
    const doc: ProjectDocument = {
      id: generateId(),
      projectId,
      folderId,
      title: title.trim(),
      content: content.trim(),
      category,
      attachments: [],
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    documents.value.push(doc)
    logActivity(projectId, 'document_created', title, {
      entityType: 'document',
      entityId: doc.id,
      entityTitle: title,
    })
    await save()
    return doc
  }

  async function logTimeEntry(
    projectId: string,
    minutes: number,
    description: string,
    taskId: string | null = null,
  ) {
    const auth = useAuthStore()
    if (!auth.currentUserId || minutes <= 0) return null

    const entry: ProjectTimeEntry = {
      id: generateId(),
      projectId,
      taskId,
      userId: auth.currentUserId,
      description: description.trim(),
      minutes,
      entryDate: todayCalendarDate(),
      createdAt: nowInstantISO(),
    }
    timeEntries.value.unshift(entry)

    if (taskId) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = {
          ...tasks.value[idx]!,
          loggedMinutes: (tasks.value[idx]!.loggedMinutes ?? 0) + minutes,
          updatedAt: nowInstantISO(),
        }
      }
    }

    logActivity(projectId, 'Tiempo registrado', `${minutes} min — ${description.trim() || 'Sin descripción'}`)
    await save()
    return entry
  }

  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
    activeTab.value = 'dashboard'
  }

  function setActiveTab(tab: ProjectDetailTab) {
    activeTab.value = tab
  }

  return {
    projects,
    tasks,
    milestones,
    costs,
    risks,
    notes,
    deliverables,
    documents,
    members,
    folders,
    invites,
    activities,
    timeEntries,
    taskComments,
    isReady,
    currentProjectId,
    currentProject,
    activeTab,
    workspaceProjects,
    accessibleProjects,
    getMyProjectMembership,
    getSharedOnlyProjects,
    canAccessProject,
    getProject,
    getProjectTasks,
    getProjectMilestones,
    getProjectCosts,
    getProjectTransactions,
    getProjectRisks,
    getProjectNotes,
    getProjectDeliverables,
    getProjectDocuments,
    getProjectFolders,
    getProjectInvites,
    getProjectMembers,
    getProjectActivities,
    getProjectTimeEntries,
    getTaskComments,
    getTaskTimeEntries,
    getProjectLoggedMinutes,
    getProjectDashboard,
    getProjectFiles,
    init,
    reloadForWorkspace,
    restoreFromLocalBackup,
    reloadProject,
    mergeProjectState,
    handleRealtimePayload,
    upsertProjectMember,
    persistProjectMember,
    ensureProjectLoaded,
    destroy,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    addTaskComment,
    deleteTaskComment,
    updateTask,
    moveTaskToColumn,
    deleteTask,
    openTaskInBoard,
    addTransaction,
    deleteTransaction,
    addCost,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    addRisk,
    syncAutoRisks,
    updateRisk,
    addDeliverable,
    addDeliverableComment,
    deleteDeliverableComment,
    addDeliverableLog,
    addDeliverableAttachment,
    addTaskAttachment,
    addDocumentFile,
    registerChatDocumentFile,
    ensureProjectFolder,
    createFolder,
    deleteFolder,
    inviteProjectMember,
    deleteRisk,
    addNote,
    updateNote,
    deleteNote,
    updateDeliverable,
    deleteDeliverable,
    addDocument,
    updateDocument,
    deleteDocument,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    logTimeEntry,
    setCurrentProject,
    setActiveTab,
    save,
  }
})
