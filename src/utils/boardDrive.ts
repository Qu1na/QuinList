import type { Attachment, Card } from '@/types'

export interface BoardDriveItem extends Attachment {
  cardId: string
  cardTitle: string
  listTitle: string
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageAttachment(type: string): boolean {
  return type.startsWith('image/')
}

export function fileTypeLabel(type: string): string {
  if (type.startsWith('image/')) return 'Imagen'
  if (type === 'application/pdf') return 'PDF'
  if (type.includes('spreadsheet') || type.includes('excel')) return 'Hoja de cálculo'
  if (type.includes('word') || type.includes('document')) return 'Documento'
  if (type.startsWith('text/')) return 'Texto'
  if (type.startsWith('video/')) return 'Video'
  if (type.startsWith('audio/')) return 'Audio'
  return 'Archivo'
}

export function collectBoardAttachments(
  boardId: string,
  cards: Card[],
  listTitleById: Map<string, string>,
): BoardDriveItem[] {
  const items: BoardDriveItem[] = []

  for (const card of cards) {
    if (card.boardId !== boardId || !card.attachments?.length) continue

    for (const att of card.attachments) {
      items.push({
        ...att,
        cardId: card.id,
        cardTitle: card.title,
        listTitle: listTitleById.get(card.listId) ?? 'Sin lista',
      })
    }
  }

  return items.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
}

export function totalDriveSize(items: BoardDriveItem[]): number {
  return items.reduce((sum, item) => sum + (item.size || 0), 0)
}
