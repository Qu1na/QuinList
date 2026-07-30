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
  ProjectNote,
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
  toNote,
  toProject,
  toRisk,
  toTask,
  toTaskComment,
  toTimeEntry,
} from '@/services/projectMatuData'
import { isServerRowNewer } from '@/lib/realtimeMerge'

type EntityArrays = {
  projects: Ref<Project[]>
  tasks: Ref<ProjectTask[]>
  milestones: Ref<ProjectMilestone[]>
  costs: Ref<ProjectCost[]>
  risks: Ref<ProjectRisk[]>
  notes: Ref<ProjectNote[]>
  deliverables: Ref<ProjectDeliverable[]>
  documents: Ref<ProjectDocument[]>
  folders: Ref<ProjectFolder[]>
  invites: Ref<ProjectInvite[]>
  members: Ref<ProjectMember[]>
  activities: Ref<ProjectActivity[]>
  timeEntries: Ref<ProjectTimeEntry[]>
  taskComments: Ref<ProjectTaskComment[]>
}

function upsertIfNewer<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  list: Ref<T[]>,
  item: T,
  incomingRow: Record<string, unknown>,
) {
  const idx = list.value.findIndex((x) => x.id === item.id)
  if (idx >= 0) {
    const existing = list.value[idx]!
    if (!isServerRowNewer(incomingRow, existing)) return
    list.value[idx] = item
  } else {
    list.value.push(item)
  }
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
      upsertIfNewer(state.projects, toProject(payload.new!), payload.new!)
      return null
    }
    case 'project_tasks': {
      if (payload.event === 'DELETE') removeById(state.tasks, id!)
      else upsertIfNewer(state.tasks, toTask(payload.new!), payload.new!)
      return null
    }
    case 'project_milestones': {
      if (payload.event === 'DELETE') removeById(state.milestones, id!)
      else upsertIfNewer(state.milestones, toMilestone(payload.new!), payload.new!)
      return null
    }
    case 'project_costs': {
      if (payload.event === 'DELETE') removeById(state.costs, id!)
      else upsertIfNewer(state.costs, toCost(payload.new!), payload.new!)
      return null
    }
    case 'project_risks': {
      if (payload.event === 'DELETE') removeById(state.risks, id!)
      else upsertIfNewer(state.risks, toRisk(payload.new!), payload.new!)
      return null
    }
    case 'project_notes': {
      if (payload.event === 'DELETE') removeById(state.notes, id!)
      else upsertIfNewer(state.notes, toNote(payload.new!), payload.new!)
      return null
    }
    case 'project_deliverables': {
      if (payload.event === 'DELETE') removeById(state.deliverables, id!)
      else upsertIfNewer(state.deliverables, toDeliverable(payload.new!), payload.new!)
      return null
    }
    case 'project_documents': {
      if (payload.event === 'DELETE') removeById(state.documents, id!)
      else upsertIfNewer(state.documents, toDocument(payload.new!), payload.new!)
      return null
    }
    case 'project_folders': {
      if (payload.event === 'DELETE') removeById(state.folders, id!)
      else upsertIfNewer(state.folders, toFolder(payload.new!), payload.new!)
      return null
    }
    case 'project_invites': {
      if (payload.event === 'DELETE') removeById(state.invites, id!)
      else upsertIfNewer(state.invites, toInvite(payload.new!), payload.new!)
      return null
    }
    case 'project_members': {
      if (payload.event === 'DELETE') removeById(state.members, id!)
      else upsertIfNewer(state.members, toMember(payload.new!), payload.new!)
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
      else upsertIfNewer(state.activities, activity, payload.new!)
      if (payload.event !== 'INSERT') return null
      return activity
    }
    case 'project_time_entries': {
      if (payload.event === 'DELETE') removeById(state.timeEntries, id!)
      else upsertIfNewer(state.timeEntries, toTimeEntry(payload.new!), payload.new!)
      return null
    }
    case 'project_task_comments': {
      if (payload.event === 'DELETE') removeById(state.taskComments, id!)
      else upsertIfNewer(state.taskComments, toTaskComment(payload.new!), payload.new!)
      return null
    }
    default:
      return null
  }
}
