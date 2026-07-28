import type { Card, Board } from '@/types'

export interface ChartSegment {
  label: string
  value: number
  color: string
}

export interface ChartBar {
  label: string
  value: number
  color: string
}

export interface ChartPoint {
  label: string
  value: number
}

export function statusSegments(cards: Card[]): ChartSegment[] {
  const completed = cards.filter((c) => c.completed).length
  const pending = cards.length - completed
  return [
    { label: 'Completadas', value: completed, color: '#22a06b' },
    { label: 'Pendientes', value: pending, color: '#e56910' },
  ].filter((s) => s.value > 0)
}

export function priorityBars(cards: Card[]): ChartBar[] {
  const counts = { alta: 0, media: 0, baja: 0 }
  for (const c of cards) {
    if (c.priority in counts) counts[c.priority as keyof typeof counts]++
  }
  return [
    { label: 'Alta', value: counts.alta, color: '#c9372c' },
    { label: 'Media', value: counts.media, color: '#e56910' },
    { label: 'Baja', value: counts.baja, color: '#22a06b' },
  ]
}

export function boardBars(boards: Board[], cards: Card[]): ChartBar[] {
  return boards.map((board) => {
    const boardCards = cards.filter((c) => c.boardId === board.id)
    const completed = boardCards.filter((c) => c.completed).length
    return {
      label: board.title,
      value: boardCards.length,
      color: boardCards.length ? `hsl(${(completed / boardCards.length) * 120}, 55%, 48%)` : '#94a3b8',
    }
  })
}

export function boardCompletionBars(boards: Board[], cards: Card[]): ChartBar[] {
  return boards
    .map((board) => {
      const boardCards = cards.filter((c) => c.boardId === board.id)
      if (!boardCards.length) return null
      const pct = Math.round(
        (boardCards.filter((c) => c.completed).length / boardCards.length) * 100,
      )
      return {
        label: board.title,
        value: pct,
        color: '#0c66e4',
      }
    })
    .filter((b): b is ChartBar => b != null)
}

export function completionsByDay(cards: Card[], days = 7): ChartPoint[] {
  const result: ChartPoint[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
    const value = cards.filter(
      (c) => c.completed && c.completedAt?.slice(0, 10) === key,
    ).length
    result.push({ label, value })
  }
  return result
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`
  return `${(seconds / 86400).toFixed(1)} d`
}

export function avgDurationSeconds(cards: Card[]): number {
  const withDuration = cards.filter((c) => c.completed && c.durationSeconds != null)
  if (!withDuration.length) return 0
  return Math.round(
    withDuration.reduce((s, c) => s + (c.durationSeconds ?? 0), 0) / withDuration.length,
  )
}
