import type { BoardIntegration, List } from '@/types'

const DEFAULT_LABELS = [
  { id: 'l-new-1', name: 'Diseño', color: '#bb8fce' },
  { id: 'l-new-2', name: 'Desarrollo', color: '#58d68d' },
  { id: 'l-new-3', name: 'Urgente', color: '#e74c3c' },
]

const DEFAULT_LISTS = ['Por hacer', 'En proceso', 'En revisión']

export function defaultBoardIntegrations(): BoardIntegration[] {
  return [
    { type: 'google_calendar', enabled: false, config: {} },
    { type: 'slack', enabled: false, config: { url: '' } },
    { type: 'github', enabled: false, config: { repo: '' } },
    { type: 'ics_export', enabled: true, config: {} },
    { type: 'webhook', enabled: false, config: { url: '' } },
  ]
}

export function getDefaultBoardLists(boardId: string, generateId: () => string) {
  return DEFAULT_LISTS.map((title, position) => ({
    id: generateId(),
    boardId,
    title,
    position,
  }))
}

export function getDefaultLabels(generateId: () => string) {
  return DEFAULT_LABELS.map((l) => ({ ...l, id: generateId() }))
}

export function findCompletedList(lists: List[]) {
  return lists.find(
    (l) =>
      l.title.toLowerCase().includes('completado') ||
      l.title.toLowerCase().includes('hecho') ||
      l.title.toLowerCase().includes('done'),
  )
}

export function findTodoList(lists: List[]) {
  return lists.find(
    (l) =>
      l.title.toLowerCase().includes('por hacer') ||
      l.title.toLowerCase().includes('to do') ||
      l.title.toLowerCase().includes('pendiente'),
  )
}
