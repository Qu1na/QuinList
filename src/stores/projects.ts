import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectCost,
  ProjectRisk,
  ProjectDeliverable,
  ProjectDocument,
  ProjectFolder,
  ProjectInvite,
  ProjectMember,
  ProjectActivity,
  ProjectDetailTab,
  ProjectsDataState,
  TransactionType,
  PaymentMethod,
  DeliverableLogEntry,
} from '@/types/projects'
import type { Attachment, Priority, UserRole } from '@/types'
import { loadProjectsData, persistProjectsData } from '@/services/projectData'
import { useQuinListStore } from './quinlist'
import { useAuthStore } from './auth'
import { generateId } from '@/utils/permissions'
import {
  calcFinanceSummary,
  calcProjectProgress,
  collectProjectFiles,
  getCompletedTasks,
  getPendingTasks,
  getUpcomingTasks,
} from '@/utils/projectStats'
import { findTodoList, getDefaultBoardLists } from '@/utils/boardDefaults'
import { formatMoney, DEFAULT_CURRENCY } from '@/utils/currency'
import { uploadProjectFile } from '@/services/storage'

export const DASHBOARD_ACTIVITY_LIMIT = 7

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const tasks = ref<ProjectTask[]>([])
  const milestones = ref<ProjectMilestone[]>([])
  const costs = ref<ProjectCost[]>([])
  const risks = ref<ProjectRisk[]>([])
  const deliverables = ref<ProjectDeliverable[]>([])
  const documents = ref<ProjectDocument[]>([])
  const folders = ref<ProjectFolder[]>([])
  const invites = ref<ProjectInvite[]>([])
  const members = ref<ProjectMember[]>([])
  const activities = ref<ProjectActivity[]>([])
  const isReady = ref(false)
  const currentProjectId = ref<string | null>(null)
  const activeTab = ref<ProjectDetailTab>('dashboard')

  const currentProject = computed(() =>
    projects.value.find((p) => p.id === currentProjectId.value) ?? null,
  )

  function workspaceProjects(workspaceId: string) {
    return projects.value.filter((p) => p.workspaceId === workspaceId)
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
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  function getProjectCosts(projectId: string) {
    return getProjectTransactions(projectId)
  }

  function getProjectRisks(projectId: string) {
    return risks.value.filter((r) => r.projectId === projectId)
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

  function getProjectActivities(projectId: string) {
    return activities.value
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
      deliverables: deliverables.value,
      documents: documents.value,
      folders: folders.value,
      invites: invites.value,
      members: members.value,
      activities: activities.value,
    }
    return collectProjectFiles(state, projectId)
  }

  async function save() {
    await persistProjectsData({
      projects: projects.value,
      tasks: tasks.value,
      milestones: milestones.value,
      costs: costs.value,
      risks: risks.value,
      deliverables: deliverables.value,
      documents: documents.value,
      folders: folders.value,
      invites: invites.value,
      members: members.value,
      activities: activities.value,
    })
  }

  function logActivity(projectId: string, action: string, details: string) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return
    activities.value.unshift({
      id: generateId(),
      projectId,
      userId: auth.currentUserId,
      action,
      details,
      createdAt: new Date().toISOString(),
    })
  }

  async function init() {
    const quinlist = useQuinListStore()
    const wsId = quinlist.currentWorkspaceId
    if (!wsId) {
      isReady.value = true
      return
    }
    const data = await loadProjectsData(wsId)
    projects.value = data.projects
    tasks.value = data.tasks
    milestones.value = data.milestones
    costs.value = data.costs
    risks.value = data.risks
    deliverables.value = data.deliverables
    documents.value = data.documents
    folders.value = data.folders ?? []
    invites.value = data.invites ?? []
    members.value = data.members
    activities.value = data.activities
    isReady.value = true
  }

  async function reloadForWorkspace(workspaceId: string) {
    const data = await loadProjectsData(workspaceId)
    projects.value = data.projects.filter((p) => p.workspaceId === workspaceId)
    const projectIds = new Set(projects.value.map((p) => p.id))
    tasks.value = data.tasks.filter((t) => projectIds.has(t.projectId))
    milestones.value = data.milestones.filter((m) => projectIds.has(m.projectId))
    costs.value = data.costs.filter((c) => projectIds.has(c.projectId))
    risks.value = data.risks.filter((r) => projectIds.has(r.projectId))
    deliverables.value = data.deliverables.filter((d) => projectIds.has(d.projectId))
    documents.value = data.documents.filter((d) => projectIds.has(d.projectId))
    folders.value = (data.folders ?? []).filter((f) => projectIds.has(f.projectId))
    invites.value = (data.invites ?? []).filter((i) => projectIds.has(i.projectId))
    members.value = data.members.filter((m) => projectIds.has(m.projectId))
    activities.value = data.activities.filter((a) => projectIds.has(a.projectId))
  }

  function destroy() {
    projects.value = []
    tasks.value = []
    milestones.value = []
    costs.value = []
    risks.value = []
    deliverables.value = []
    documents.value = []
    folders.value = []
    invites.value = []
    members.value = []
    activities.value = []
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
    const now = new Date().toISOString()
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
        joinedAt: now.split('T')[0]!,
      })
    }

    logActivity(
      project.id,
      'Proyecto creado',
      `«${project.name}» con presupuesto de ${formatMoney(project.budget, project.currency)}`,
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
      updatedAt: new Date().toISOString(),
    }
    logActivity(id, 'Proyecto actualizado', 'Se modificó la información del proyecto')
    await save()
  }

  async function deleteProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id)
    tasks.value = tasks.value.filter((t) => t.projectId !== id)
    milestones.value = milestones.value.filter((m) => m.projectId !== id)
    costs.value = costs.value.filter((c) => c.projectId !== id)
    risks.value = risks.value.filter((r) => r.projectId !== id)
    deliverables.value = deliverables.value.filter((d) => d.projectId !== id)
    documents.value = documents.value.filter((d) => d.projectId !== id)
    folders.value = folders.value.filter((f) => f.projectId !== id)
    invites.value = invites.value.filter((i) => i.projectId !== id)
    members.value = members.value.filter((m) => m.projectId !== id)
    activities.value = activities.value.filter((a) => a.projectId !== id)
    if (currentProjectId.value === id) currentProjectId.value = null
    await save()
  }

  async function createTask(projectId: string, title: string) {
    const auth = useAuthStore()
    const projectTasks = getProjectTasks(projectId)
    const now = new Date().toISOString()
    const task: ProjectTask = {
      id: generateId(),
      projectId,
      title: title.trim(),
      description: '',
      status: 'todo',
      priority: 'media',
      assigneeIds: auth.currentUserId ? [auth.currentUserId] : [],
      startDate: null,
      dueDate: null,
      completedAt: null,
      position: projectTasks.length,
      kanbanColumn: 'todo',
      boardCardId: null,
      boardId: null,
      attachments: [],
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    tasks.value.push(task)
    logActivity(projectId, 'Tarea creada', `«${task.title}»`)
    await save()
    return task
  }

  async function updateTask(taskId: string, updates: Partial<ProjectTask>) {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return
    const prev = tasks.value[idx]!
    const next = { ...prev, ...updates, updatedAt: new Date().toISOString() }
    if (updates.status === 'done' && !next.completedAt) {
      next.completedAt = new Date().toISOString()
    }
    if (updates.status && updates.status !== 'done') {
      next.completedAt = null
    }
    if (updates.status) next.kanbanColumn = updates.status
    tasks.value[idx] = next

    if (updates.status && updates.status !== prev.status) {
      logActivity(prev.projectId, 'Tarea actualizada', `«${next.title}» → ${updates.status}`)
    }

    await save()
    return next
  }

  async function moveTaskToColumn(taskId: string, status: ProjectTask['status']) {
    return updateTask(taskId, { status, kanbanColumn: status })
  }

  async function deleteTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId)
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
    if (task) logActivity(task.projectId, 'Tarea eliminada', `«${task.title}»`)
    await save()
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
      createdAt: new Date().toISOString(),
    }
    costs.value.push(tx)
    const project = getProject(projectId)
    const label = input.type === 'income' ? 'Ingreso' : 'Egreso'
    logActivity(
      projectId,
      `${label} registrado`,
      `${tx.title} — ${formatMoney(tx.amount, project?.currency)}`,
    )
    await save()
    return tx
  }

  async function deleteTransaction(id: string) {
    const tx = costs.value.find((c) => c.id === id)
    costs.value = costs.value.filter((c) => c.id !== id)
    if (tx) logActivity(tx.projectId, 'Movimiento eliminado', tx.title)
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
    if (ms) logActivity(ms.projectId, 'Hito eliminado', ms.title)
    await save()
  }

  async function updateRisk(id: string, updates: Partial<ProjectRisk>) {
    const risk = risks.value.find((r) => r.id === id)
    if (!risk) return
    Object.assign(risk, updates, { updatedAt: new Date().toISOString() })
    await save()
  }

  async function updateDeliverable(id: string, updates: Partial<ProjectDeliverable>) {
    const d = deliverables.value.find((x) => x.id === id)
    if (!d) return
    Object.assign(d, updates)
    if (updates.status === 'delivered' || updates.status === 'approved') d.completed = true
    await save()
  }

  async function deleteDeliverable(id: string) {
    const d = deliverables.value.find((x) => x.id === id)
    deliverables.value = deliverables.value.filter((x) => x.id !== id)
    if (d) logActivity(d.projectId, 'Entregable eliminado', d.title)
    await save()
  }

  async function updateDocument(id: string, updates: Partial<ProjectDocument>) {
    const doc = documents.value.find((d) => d.id === id)
    if (!doc) return
    Object.assign(doc, updates, { updatedAt: new Date().toISOString() })
    await save()
  }

  async function deleteDocument(id: string) {
    const doc = documents.value.find((d) => d.id === id)
    documents.value = documents.value.filter((d) => d.id !== id)
    if (doc) logActivity(doc.projectId, 'Documento eliminado', doc.title)
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
      joinedAt: new Date().toISOString().split('T')[0]!,
    }
    members.value.push(member)
    logActivity(projectId, 'Miembro añadido', userId)
    await save()
    return member
  }

  async function updateProjectMember(id: string, updates: Partial<ProjectMember>) {
    const m = members.value.find((x) => x.id === id)
    if (!m) return
    Object.assign(m, updates)
    await save()
  }

  async function removeProjectMember(id: string) {
    members.value = members.value.filter((m) => m.id !== id)
    await save()
  }

  async function addMilestone(
    projectId: string,
    input: { title: string; description?: string; startDate: string; dueDate: string },
  ) {
    if (!input.dueDate) throw new Error('La fecha de vencimiento es obligatoria')
    const ms: ProjectMilestone = {
      id: generateId(),
      projectId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      startDate: input.startDate || input.dueDate,
      dueDate: input.dueDate,
      completed: false,
      position: getProjectMilestones(projectId).length,
      createdAt: new Date().toISOString(),
    }
    milestones.value.push(ms)
    logActivity(projectId, 'Hito añadido', input.title)
    await save()
    return ms
  }

  async function toggleMilestone(id: string) {
    const ms = milestones.value.find((m) => m.id === id)
    if (!ms) return
    ms.completed = !ms.completed
    logActivity(ms.projectId, ms.completed ? 'Hito completado' : 'Hito reabierto', ms.title)
    await save()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    risks.value.push(risk)
    logActivity(projectId, 'Riesgo registrado', risk.title)
    await save()
    return risk
  }

  async function addDeliverable(projectId: string, title: string, dueDate?: string | null) {
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
      createdAt: new Date().toISOString(),
    }
    deliverables.value.push(d)
    logActivity(projectId, 'Entregable añadido', title)
    await save()
    return d
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
      createdAt: new Date().toISOString(),
      attachment,
    }
    if (!d.log) d.log = []
    d.log.unshift(entry)
    if (attachment) {
      if (!d.attachments) d.attachments = []
      d.attachments.push(attachment)
    }
    logActivity(d.projectId, 'Bitácora de entregable', d.title)
    await save()
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
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.currentUserId ?? '',
    }
    await addDeliverableLog(deliverableId, `Archivo adjunto: ${file.name}`, attachment)
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
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.currentUserId ?? '',
    }
    if (!task.attachments) task.attachments = []
    task.attachments.push(attachment)
    logActivity(task.projectId, 'Archivo en tarea', `${task.title}: ${file.name}`)
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
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.currentUserId ?? '',
    }
    doc.attachments.push(attachment)
    doc.updatedAt = new Date().toISOString()
    logActivity(projectId, 'Archivo subido', `${doc.title}: ${file.name}`)
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
      createdAt: new Date().toISOString(),
    }
    folders.value.push(folder)
    logActivity(projectId, 'Carpeta creada', folder.name)
    await save()
    return folder
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
      createdAt: new Date().toISOString(),
    }
    invites.value.push(invite)
    logActivity(projectId, 'Invitación enviada', normalized)
    await save()
    return { type: 'invited' as const, invite }
  }

  async function deleteRisk(id: string) {
    const risk = risks.value.find((r) => r.id === id)
    risks.value = risks.value.filter((r) => r.id !== id)
    if (risk) logActivity(risk.projectId, 'Riesgo eliminado', risk.title)
    await save()
  }

  async function addDocument(
    projectId: string,
    title: string,
    content: string,
    folderId: string | null = null,
  ) {
    const auth = useAuthStore()
    const now = new Date().toISOString()
    const doc: ProjectDocument = {
      id: generateId(),
      projectId,
      folderId,
      title: title.trim(),
      content: content.trim(),
      category: 'General',
      attachments: [],
      createdBy: auth.currentUserId,
      createdAt: now,
      updatedAt: now,
    }
    documents.value.push(doc)
    logActivity(projectId, 'Documento añadido', title)
    await save()
    return doc
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
    deliverables,
    documents,
    members,
    folders,
    invites,
    activities,
    isReady,
    currentProjectId,
    currentProject,
    activeTab,
    workspaceProjects,
    getProject,
    getProjectTasks,
    getProjectMilestones,
    getProjectCosts,
    getProjectTransactions,
    getProjectRisks,
    getProjectDeliverables,
    getProjectDocuments,
    getProjectFolders,
    getProjectInvites,
    getProjectMembers,
    getProjectActivities,
    getProjectDashboard,
    getProjectFiles,
    init,
    reloadForWorkspace,
    destroy,
    createProject,
    updateProject,
    deleteProject,
    createTask,
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
    updateRisk,
    addDeliverable,
    addDeliverableLog,
    addDeliverableAttachment,
    addTaskAttachment,
    addDocumentFile,
    createFolder,
    deleteFolder,
    inviteProjectMember,
    deleteRisk,
    updateDeliverable,
    deleteDeliverable,
    addDocument,
    updateDocument,
    deleteDocument,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    setCurrentProject,
    setActiveTab,
    save,
  }
})
