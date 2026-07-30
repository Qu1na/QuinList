import { instantToCalendarDate, todayCalendarDate } from '@/utils/datetime'

import type { ChatMessageStatus, ChatReadReceipt } from '@/types/chat'

export interface ChatListMessage {
  id: string
  userId: string
  text: string
  createdAt: string
  pending?: boolean
  status?: ChatMessageStatus
  readBy?: ChatReadReceipt[]
  attachment?: { name: string; url: string; type: string; size: number } | null
}

export interface ChatRenderItem {
  message: ChatListMessage
  compact: boolean
}

export interface ChatDateGroup {
  dateLabel: string
  items: ChatRenderItem[]
}

const GROUP_WINDOW_MS = 5 * 60 * 1000

export function formatChatDateLabel(iso: string): string {
  const day = instantToCalendarDate(iso)
  const today = todayCalendarDate()

  if (day === today) return 'Hoy'

  const yesterday = shiftCalendarDate(today, -1)
  if (day === yesterday) return 'Ayer'

  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  })
}

function shiftCalendarDate(iso: string, days: number): string {
  const parts = iso.split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function groupChatMessages(messages: ChatListMessage[]): ChatDateGroup[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const groups: ChatDateGroup[] = []
  let currentDay = ''
  let prevUserId = ''
  let prevTime = 0

  for (const message of sorted) {
    const day = instantToCalendarDate(message.createdAt)
    const time = new Date(message.createdAt).getTime()
    const compact =
      day === currentDay &&
      message.userId === prevUserId &&
      time - prevTime < GROUP_WINDOW_MS

    if (day !== currentDay) {
      groups.push({
        dateLabel: formatChatDateLabel(message.createdAt),
        items: [],
      })
      currentDay = day
    }

    groups[groups.length - 1]!.items.push({ message, compact })
    prevUserId = message.userId
    prevTime = time
  }

  return groups
}
