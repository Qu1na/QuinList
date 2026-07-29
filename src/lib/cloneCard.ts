import type { Card } from '@/types'

export function cloneCard(card: Card): Card {
  return {
    ...card,
    labelIds: [...card.labelIds],
    assigneeIds: [...card.assigneeIds],
    checklist: card.checklist.map((i) => ({ ...i })),
    comments: card.comments.map((c) => ({ ...c })),
    attachments: card.attachments?.map((a) => ({ ...a })) ?? [],
  }
}
