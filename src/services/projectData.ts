import type { ProjectsDataState, ProjectCost } from '@/types/projects'
import { DEFAULT_CURRENCY } from '@/utils/currency'
import { PROJECT_SEED } from '@/utils/projectSeed'
import {
  isProjectsMatuEnabled,
  loadProjectsForUser,
  syncProjectsToMatu,
} from '@/services/projectMatuData'
import { shouldSaveProjectsBackup } from '@/utils/projectRecovery'

const STORAGE_KEY = 'quinlist_projects_data_v2'
export const PROJECTS_LOCAL_STORAGE_KEY = STORAGE_KEY
export const PROJECTS_LOCAL_SYNC_EVENT = 'quinlist:projects-local-changed'

function normalizeTransaction(raw: Partial<ProjectCost> & { projectId: string }): ProjectCost {
  return {
    id: raw.id!,
    projectId: raw.projectId,
    type: raw.type ?? 'expense',
    title: raw.title ?? '',
    amount: raw.amount ?? 0,
    category: raw.category ?? '',
    paymentMethod: raw.paymentMethod ?? 'transfer',
    reference: raw.reference ?? '',
    notes: raw.notes ?? '',
    date: raw.date ?? new Date().toISOString().split('T')[0]!,
    createdBy: raw.createdBy ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

export function normalizeProjectsState(raw: Partial<ProjectsDataState>): ProjectsDataState {
  const costs = (raw.costs ?? []).map((c) => normalizeTransaction(c))
  return {
    projects: (raw.projects ?? []).map((p) => ({
      ...p,
      currency: p.currency ?? DEFAULT_CURRENCY,
    })),
    tasks: (raw.tasks ?? []).map((t) => ({
      ...t,
      estimateHours: t.estimateHours ?? null,
      loggedMinutes: t.loggedMinutes ?? 0,
    })),
    milestones: (raw.milestones ?? []).map((m) => ({
      ...m,
      startDate: m.startDate ?? null,
      createdBy: m.createdBy ?? null,
      updatedBy: m.updatedBy ?? null,
      updatedAt: m.updatedAt ?? m.createdAt ?? new Date().toISOString(),
    })),
    costs,
    risks: (raw.risks ?? []).map((r) => ({
      ...r,
      probability: r.probability ?? 'medium',
      mitigationPlan: r.mitigationPlan ?? '',
      ownerId: r.ownerId ?? null,
    })),
    deliverables: (raw.deliverables ?? []).map((d) => ({
      ...d,
      assigneeId: d.assigneeId ?? null,
      milestoneId: d.milestoneId ?? null,
      attachments: d.attachments ?? [],
      log: d.log ?? [],
      createdBy: d.createdBy ?? null,
      updatedBy: d.updatedBy ?? null,
      updatedAt: d.updatedAt ?? d.createdAt ?? new Date().toISOString(),
    })),
    documents: (raw.documents ?? []).map((d) => ({
      ...d,
      category: d.category ?? 'General',
      folderId: d.folderId ?? null,
    })),
    folders: raw.folders ?? [],
    invites: raw.invites ?? [],
    members: raw.members ?? [],
    activities: raw.activities ?? [],
    timeEntries: raw.timeEntries ?? [],
    taskComments: raw.taskComments ?? [],
  }
}

export function loadProjectsLocal(): ProjectsDataState {
  const v2 = localStorage.getItem(STORAGE_KEY)
  if (v2) {
    try {
      return normalizeProjectsState(JSON.parse(v2) as ProjectsDataState)
    } catch {
      /* fall through */
    }
  }

  const legacy = localStorage.getItem('quinlist_projects_data')
  if (legacy) {
    try {
      const normalized = normalizeProjectsState(JSON.parse(legacy) as ProjectsDataState)
      saveProjectsLocal(normalized)
      return normalized
    } catch {
      /* fall through */
    }
  }

  return normalizeProjectsState(structuredClone(PROJECT_SEED))
}

export function saveProjectsLocal(data: ProjectsDataState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(PROJECTS_LOCAL_SYNC_EVENT))
}

export async function loadProjectsData(
  workspaceId: string,
  userId: string | null,
  isWorkspaceMember: boolean,
): Promise<ProjectsDataState> {
  if (isProjectsMatuEnabled()) {
    if (!userId) {
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
    return loadProjectsForUser(workspaceId, userId, isWorkspaceMember)
  }
  return loadProjectsLocal()
}

export async function persistProjectsData(
  workspaceId: string,
  data: ProjectsDataState,
  options?: { forceBackup?: boolean },
): Promise<void> {
  if (isProjectsMatuEnabled()) {
    // Copia local antes de sincronizar — permite recuperar si MatuDB falla o devuelve vacío.
    if (options?.forceBackup || shouldSaveProjectsBackup(workspaceId, data)) {
      saveProjectsLocal(data)
    }
    await syncProjectsToMatu(workspaceId, data)
    return
  }
  saveProjectsLocal(data)
}

/** Restaura desde la copia local (DevTools → localStorage → quinlist_projects_data_v2). */
export function loadProjectsMatuBackup(): ProjectsDataState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeProjectsState(JSON.parse(raw) as ProjectsDataState)
  } catch {
    return null
  }
}
