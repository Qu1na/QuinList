import type { ProjectsDataState } from '@/types/projects'
import type { Card, Board } from '@/types'

export type GlobalSearchGroup = 'card' | 'project' | 'task' | 'deliverable' | 'note'

export interface GlobalSearchResult {
  id: string
  group: GlobalSearchGroup
  title: string
  subtitle: string
  boardId?: string
  cardId?: string
  projectId?: string
  tab?: string
}

const GROUP_LABELS: Record<GlobalSearchGroup, string> = {
  card: 'Tarjeta',
  project: 'Proyecto',
  task: 'Tarea',
  deliverable: 'Entregable',
  note: 'Nota',
}

export function groupLabel(group: GlobalSearchGroup): string {
  return GROUP_LABELS[group]
}

export function searchGlobally(
  query: string,
  options: {
    boards: Board[]
    cards: Card[]
    projectsState: ProjectsDataState
    workspaceId: string | null
  },
): GlobalSearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return []

  const { boards, cards, projectsState, workspaceId } = options
  const results: GlobalSearchResult[] = []
  const limit = 12

  const wsProjects = workspaceId
    ? projectsState.projects.filter((p) => p.workspaceId === workspaceId)
    : projectsState.projects
  const projectIds = new Set(wsProjects.map((p) => p.id))

  for (const card of cards) {
    if (results.length >= limit) break
    const board = boards.find((b) => b.id === card.boardId)
    if (!board || (workspaceId && board.workspaceId !== workspaceId)) continue
    if (
      card.title.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: `card-${card.id}`,
        group: 'card',
        title: card.title,
        subtitle: board.title,
        boardId: card.boardId,
        cardId: card.id,
      })
    }
  }

  for (const project of wsProjects) {
    if (results.length >= limit) break
    if (
      project.name.toLowerCase().includes(q) ||
      project.client.toLowerCase().includes(q) ||
      project.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: `project-${project.id}`,
        group: 'project',
        title: project.name,
        subtitle: project.client || 'Proyecto',
        projectId: project.id,
        tab: 'dashboard',
      })
    }
  }

  for (const task of projectsState.tasks) {
    if (results.length >= limit) break
    if (!projectIds.has(task.projectId)) continue
    if (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q)
    ) {
      const project = wsProjects.find((p) => p.id === task.projectId)
      results.push({
        id: `task-${task.id}`,
        group: 'task',
        title: task.title,
        subtitle: project?.name ?? 'Tarea',
        projectId: task.projectId,
        tab: 'tasks',
      })
    }
  }

  for (const d of projectsState.deliverables) {
    if (results.length >= limit) break
    if (!projectIds.has(d.projectId)) continue
    if (
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    ) {
      const project = wsProjects.find((p) => p.id === d.projectId)
      results.push({
        id: `deliverable-${d.id}`,
        group: 'deliverable',
        title: d.title,
        subtitle: project?.name ?? 'Entregable',
        projectId: d.projectId,
        tab: 'deliverables',
      })
    }
  }

  for (const note of projectsState.notes ?? []) {
    if (results.length >= limit) break
    if (!projectIds.has(note.projectId)) continue
    if (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    ) {
      const project = wsProjects.find((p) => p.id === note.projectId)
      results.push({
        id: `note-${note.id}`,
        group: 'note',
        title: note.title || 'Nota sin título',
        subtitle: project?.name ?? 'Bitácora',
        projectId: note.projectId,
        tab: 'notes',
      })
    }
  }

  return results
}
