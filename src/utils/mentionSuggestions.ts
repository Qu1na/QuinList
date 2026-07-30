import type { MentionUser } from '@/utils/mentions'
import { useProjectsStore } from '@/stores/projects'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'

export type MentionKind =
  | 'user'
  | 'team'
  | 'task'
  | 'deliverable'
  | 'document'
  | 'note'
  | 'milestone'
  | 'project'
  | 'board'
  | 'card'

export interface MentionCandidate {
  id: string
  kind: MentionKind
  label: string
  subtitle?: string
  insertText: string
}

export function userMentionToken(userId: string, name: string): string {
  return `@[user:${userId}:${name}]`
}

export function entityMentionToken(kind: MentionKind, id: string, label: string): string {
  return `#[${kind}:${id}:${label}]`
}

export function buildProjectMentionCandidates(projectId: string): MentionCandidate[] {
  const projectsStore = useProjectsStore()
  const auth = useAuthStore()
  const project = projectsStore.getProject(projectId)
  const out: MentionCandidate[] = []

  out.push({
    id: 'team',
    kind: 'team',
    label: 'equipo',
    subtitle: 'Mencionar a todo el equipo',
    insertText: '@equipo ',
  })

  for (const member of projectsStore.getProjectMembers(projectId)) {
    const user = auth.getUserById(member.userId)
    const name = user?.name ?? 'Usuario'
    out.push({
      id: member.userId,
      kind: 'user',
      label: name,
      subtitle: user?.email,
      insertText: `${userMentionToken(member.userId, name)} `,
    })
  }

  if (project) {
    out.push({
      id: project.id,
      kind: 'project',
      label: project.name,
      subtitle: 'Proyecto',
      insertText: `${entityMentionToken('project', project.id, project.name)} `,
    })
  }

  for (const task of projectsStore.getProjectTasks(projectId)) {
    out.push({
      id: task.id,
      kind: 'task',
      label: task.title,
      subtitle: 'Tarea',
      insertText: `${entityMentionToken('task', task.id, task.title)} `,
    })
  }

  for (const d of projectsStore.getProjectDeliverables(projectId)) {
    out.push({
      id: d.id,
      kind: 'deliverable',
      label: d.title,
      subtitle: 'Entregable',
      insertText: `${entityMentionToken('deliverable', d.id, d.title)} `,
    })
  }

  for (const doc of projectsStore.getProjectDocuments(projectId)) {
    out.push({
      id: doc.id,
      kind: 'document',
      label: doc.title,
      subtitle: 'Documento',
      insertText: `${entityMentionToken('document', doc.id, doc.title)} `,
    })
  }

  for (const note of projectsStore.getProjectNotes(projectId)) {
    out.push({
      id: note.id,
      kind: 'note',
      label: note.title || 'Nota sin título',
      subtitle: 'Bitácora',
      insertText: `${entityMentionToken('note', note.id, note.title || 'Nota')} `,
    })
  }

  for (const m of projectsStore.getProjectMilestones(projectId)) {
    out.push({
      id: m.id,
      kind: 'milestone',
      label: m.title,
      subtitle: 'Hito',
      insertText: `${entityMentionToken('milestone', m.id, m.title)} `,
    })
  }

  return out
}

export function buildBoardMentionCandidates(boardId: string): MentionCandidate[] {
  const store = useQuinListStore()
  const auth = useAuthStore()
  const board = store.boards.find((b) => b.id === boardId)
  const out: MentionCandidate[] = []

  out.push({
    id: 'team',
    kind: 'team',
    label: 'equipo',
    subtitle: 'Mencionar a todo el equipo',
    insertText: '@equipo ',
  })

  const ws = store.currentWorkspace
  for (const member of ws?.members ?? []) {
    const user = auth.getUserById(member.userId)
    const name = user?.name ?? 'Usuario'
    out.push({
      id: member.userId,
      kind: 'user',
      label: name,
      subtitle: user?.email,
      insertText: `${userMentionToken(member.userId, name)} `,
    })
  }

  if (board) {
    out.push({
      id: board.id,
      kind: 'board',
      label: board.title,
      subtitle: 'Tablero',
      insertText: `${entityMentionToken('board', board.id, board.title)} `,
    })
  }

  for (const card of store.getBoardCards(boardId)) {
    out.push({
      id: card.id,
      kind: 'card',
      label: card.title,
      subtitle: 'Tarjeta',
      insertText: `${entityMentionToken('card', card.id, card.title)} `,
    })
  }

  return out
}

export function filterMentionCandidates(
  candidates: MentionCandidate[],
  trigger: '@' | '#',
  query: string,
): MentionCandidate[] {
  const q = query.trim().toLowerCase()
  const pool =
    trigger === '@'
      ? candidates.filter((c) => c.kind === 'user' || c.kind === 'team')
      : candidates.filter((c) => c.kind !== 'user' && c.kind !== 'team')

  if (!q) return pool.slice(0, 8)
  return pool
    .filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q),
    )
    .slice(0, 8)
}

