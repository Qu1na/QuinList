import type { Ref } from 'vue'
import type { RealtimeChangePayload } from '@/types/collaboration'
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
} from '@/types/projects'
import {
  toActivity,
  toCost,
  toDeliverable,
  toDocument,
  toFolder,
  toInvite,
  toMember,
  toMilestone,
  toProject,
  toRisk,
  toTask,
  toTaskComment,
  toTimeEntry,
} from '@/services/projectMatuData'

type EntityArrays = {
  projects: Ref<Project[]>
  tasks: Ref<ProjectTask[]>
  milestones: Ref<ProjectMilestone[]>
  costs: Ref<ProjectCost[]>
  risks: Ref<ProjectRisk[]>
  deliverables: Ref<ProjectDeliverable[]>
  documents: Ref<ProjectDocument[]>
  folders: Ref<ProjectFolder[]>
  invites: Ref<ProjectInvite[]>
  members: Ref<ProjectMember[]>
  activities: Ref<ProjectActivity[]>
  timeEntries: Ref<ProjectTimeEntry[]>
  taskComments: Ref<ProjectTaskComment[]>
}

function upsert<T extends { id: string }>(list: Ref<T[]>, item: T) {
  const idx = list.value.findIndex((x) => x.id === item.id)
  if (idx >= 0) list.value[idx] = item
  else list.value.push(item)
}

function removeById<T extends { id: string }>(list: Ref<T[]>, id: string) {
  list.value = list.value.filter((x) => x.id !== id)
}

export function applyRealtimePayload(
  payload: RealtimeChangePayload,
  state: EntityArrays,
): ProjectActivity | null {
  const row = payload.new ?? payload.old
  if (!row) return null

  const id = row.id as string | undefined
  if (!id && payload.table !== 'projects') return null

  switch (payload.table) {
    case 'projects': {
      if (payload.event === 'DELETE') {
        state.projects.value = state.projects.value.filter((p) => p.id !== (payload.old?.id as string))
        return null
      }
      upsert(state.projects, toProject(payload.new!))
      return null
    }
    case 'project_tasks': {
      if (payload.event === 'DELETE') removeById(state.tasks, id!)
      else upsert(state.tasks, toTask(payload.new!))
      return null
    }
    case 'project_milestones': {
      if (payload.event === 'DELETE') removeById(state.milestones, id!)
      else upsert(state.milestones, toMilestone(payload.new!))
      return null
    }
    case 'project_costs': {
      if (payload.event === 'DELETE') removeById(state.costs, id!)
      else upsert(state.costs, toCost(payload.new!))
      return null
    }
    case 'project_risks': {
      if (payload.event === 'DELETE') removeById(state.risks, id!)
      else upsert(state.risks, toRisk(payload.new!))
      return null
    }
    case 'project_deliverables': {
      if (payload.event === 'DELETE') removeById(state.deliverables, id!)
      else upsert(state.deliverables, toDeliverable(payload.new!))
      return null
    }
    case 'project_documents': {
      if (payload.event === 'DELETE') removeById(state.documents, id!)
      else upsert(state.documents, toDocument(payload.new!))
      return null
    }
    case 'project_folders': {
      if (payload.event === 'DELETE') removeById(state.folders, id!)
      else upsert(state.folders, toFolder(payload.new!))
      return null
    }
    case 'project_invites': {
      if (payload.event === 'DELETE') removeById(state.invites, id!)
      else upsert(state.invites, toInvite(payload.new!))
      return null
    }
    case 'project_members': {
      if (payload.event === 'DELETE') removeById(state.members, id!)
      else upsert(state.members, toMember(payload.new!))
      return null
    }
    case 'project_activities': {
      if (payload.event === 'DELETE') {
        removeById(state.activities, id!)
        return null
      }
      const activity = toActivity(payload.new!)
      const exists = state.activities.value.some((a) => a.id === activity.id)
      if (!exists) state.activities.value.unshift(activity)
      else upsert(state.activities, activity)
      return activity
    }
    case 'project_time_entries': {
      if (payload.event === 'DELETE') removeById(state.timeEntries, id!)
      else upsert(state.timeEntries, toTimeEntry(payload.new!))
      return null
    }
    case 'project_task_comments': {
      if (payload.event === 'DELETE') removeById(state.taskComments, id!)
      else upsert(state.taskComments, toTaskComment(payload.new!))
      return null
    }
    default:
      return null
  }
}
