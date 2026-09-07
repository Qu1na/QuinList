import { toRaw } from 'vue'
import type { ProjectsDataState } from '@/types/projects'

/** Deep snapshot for optimistic rollback (Vue/Pinia proxies break structuredClone). */
export function cloneProjectsState(state: ProjectsDataState): ProjectsDataState {
  return JSON.parse(
    JSON.stringify({
      projects: toRaw(state.projects),
      tasks: toRaw(state.tasks),
      milestones: toRaw(state.milestones),
      costs: toRaw(state.costs),
      risks: toRaw(state.risks),
      notes: toRaw(state.notes),
      deliverables: toRaw(state.deliverables),
      documents: toRaw(state.documents),
      folders: toRaw(state.folders),
      invites: toRaw(state.invites),
      members: toRaw(state.members),
      activities: toRaw(state.activities),
      timeEntries: toRaw(state.timeEntries),
      taskComments: toRaw(state.taskComments),
    }),
  ) as ProjectsDataState
}

export function readProjectsState(source: {
  projects: ProjectsDataState['projects']
  tasks: ProjectsDataState['tasks']
  milestones: ProjectsDataState['milestones']
  costs: ProjectsDataState['costs']
  risks: ProjectsDataState['risks']
  notes: ProjectsDataState['notes']
  deliverables: ProjectsDataState['deliverables']
  documents: ProjectsDataState['documents']
  folders: ProjectsDataState['folders']
  invites: ProjectsDataState['invites']
  members: ProjectsDataState['members']
  activities: ProjectsDataState['activities']
  timeEntries: ProjectsDataState['timeEntries']
  taskComments: ProjectsDataState['taskComments']
}): ProjectsDataState {
  return {
    projects: source.projects,
    tasks: source.tasks,
    milestones: source.milestones,
    costs: source.costs,
    risks: source.risks,
    notes: source.notes,
    deliverables: source.deliverables,
    documents: source.documents,
    folders: source.folders,
    invites: source.invites,
    members: source.members,
    activities: source.activities,
    timeEntries: source.timeEntries,
    taskComments: source.taskComments,
  }
}

export function writeProjectsState(
  target: {
    projects: { value: ProjectsDataState['projects'] }
    tasks: { value: ProjectsDataState['tasks'] }
    milestones: { value: ProjectsDataState['milestones'] }
    costs: { value: ProjectsDataState['costs'] }
    risks: { value: ProjectsDataState['risks'] }
    notes: { value: ProjectsDataState['notes'] }
    deliverables: { value: ProjectsDataState['deliverables'] }
    documents: { value: ProjectsDataState['documents'] }
    folders: { value: ProjectsDataState['folders'] }
    invites: { value: ProjectsDataState['invites'] }
    members: { value: ProjectsDataState['members'] }
    activities: { value: ProjectsDataState['activities'] }
    timeEntries: { value: ProjectsDataState['timeEntries'] }
    taskComments: { value: ProjectsDataState['taskComments'] }
  },
  data: ProjectsDataState,
): void {
  target.projects.value = data.projects
  target.tasks.value = data.tasks
  target.milestones.value = data.milestones
  target.costs.value = data.costs
  target.risks.value = data.risks
  target.notes.value = data.notes
  target.deliverables.value = data.deliverables
  target.documents.value = data.documents
  target.folders.value = data.folders
  target.invites.value = data.invites
  target.members.value = data.members
  target.activities.value = data.activities
  target.timeEntries.value = data.timeEntries
  target.taskComments.value = data.taskComments
}

export type ProjectsCollectionKey = Exclude<keyof ProjectsDataState, never>

/** Collections that map 1:1 to MatuDB tables (id-keyed upserts). */
export const PROJECTS_SYNC_COLLECTIONS = [
  'projects',
  'tasks',
  'milestones',
  'costs',
  'risks',
  'notes',
  'deliverables',
  'documents',
  'folders',
  'invites',
  'members',
  'activities',
  'timeEntries',
  'taskComments',
] as const satisfies readonly ProjectsCollectionKey[]

export type ProjectsSyncCollection = (typeof PROJECTS_SYNC_COLLECTIONS)[number]

function itemFingerprint(item: { id: string }): string {
  return JSON.stringify(item)
}

/** Items present in `after` that are new or changed vs `before`. */
export function diffProjectsCollection<T extends { id: string }>(
  before: T[],
  after: T[],
): T[] {
  const prev = new Map(before.map((item) => [item.id, itemFingerprint(item)]))
  return after.filter((item) => prev.get(item.id) !== itemFingerprint(item))
}

export function diffProjectsState(
  before: ProjectsDataState,
  after: ProjectsDataState,
): Partial<Record<ProjectsSyncCollection, Array<{ id: string }>>> {
  const dirty: Partial<Record<ProjectsSyncCollection, Array<{ id: string }>>> = {}
  for (const key of PROJECTS_SYNC_COLLECTIONS) {
    const changed = diffProjectsCollection(
      (before[key] ?? []) as Array<{ id: string }>,
      (after[key] ?? []) as Array<{ id: string }>,
    )
    if (changed.length) dirty[key] = changed
  }
  return dirty
}

export function countDirtyRecords(
  dirty: Partial<Record<ProjectsSyncCollection, Array<{ id: string }>>>,
): number {
  let total = 0
  for (const key of PROJECTS_SYNC_COLLECTIONS) {
    total += dirty[key]?.length ?? 0
  }
  return total
}
