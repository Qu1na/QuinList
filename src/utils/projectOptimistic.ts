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
  target.deliverables.value = data.deliverables
  target.documents.value = data.documents
  target.folders.value = data.folders
  target.invites.value = data.invites
  target.members.value = data.members
  target.activities.value = data.activities
  target.timeEntries.value = data.timeEntries
  target.taskComments.value = data.taskComments
}
