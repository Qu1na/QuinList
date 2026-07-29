export type ActivityActionType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'task_moved'
  | 'milestone_created'
  | 'milestone_completed'
  | 'milestone_deleted'
  | 'deliverable_created'
  | 'deliverable_completed'
  | 'deliverable_deleted'
  | 'document_created'
  | 'file_uploaded'
  | 'risk_created'
  | 'member_joined'
  | 'member_removed'
  | 'comment_added'
  | 'comment_deleted'
  | 'milestone_deleted'
  | 'project_updated'
  | 'finance_added'
  | 'custom'

export type ProjectPresenceStatus = 'online' | 'editing'

export interface ProjectPresence {
  projectId: string
  userId: string
  status: ProjectPresenceStatus
  activity: string
  lastSeen: string
  updatedAt: string
}

export interface CollabToast {
  id: string
  message: string
  userId: string
  userName: string
  emoji: string
  accent: string
  duration: number
}

export interface RealtimeChangePayload {
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  new?: Record<string, unknown>
  old?: Record<string, unknown>
}
