export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface ChatReadReceipt {
  userId: string
  readAt: string
}

export interface ChatAttachmentMeta {
  name: string
  url: string
  type: string
  size: number
  storageFilename?: string
}
