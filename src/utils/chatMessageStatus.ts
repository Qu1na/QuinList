import type { ChatMessageStatus, ChatReadReceipt } from '@/types/chat'

export function resolveOutgoingStatus(
  message: {
    pending?: boolean
    status?: ChatMessageStatus
    readBy?: ChatReadReceipt[]
    userId: string
  },
  otherMemberIds: string[],
): ChatMessageStatus {
  if (message.pending) return 'sending'
  if (!otherMemberIds.length) return message.status ?? 'sent'

  const readers = new Set(
    (message.readBy ?? []).map((r) => r.userId).filter((id) => id !== message.userId),
  )
  const allRead = otherMemberIds.every((id) => readers.has(id))
  if (allRead) return 'read'

  if (message.status === 'delivered' || message.status === 'read') return 'delivered'
  return message.status ?? 'sent'
}
