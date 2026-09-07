export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'
export type Priority = 'alta' | 'media' | 'baja'
export type NotificationType =
  | 'card_assigned'
  | 'card_commented'
  | 'card_moved'
  | 'card_due_soon'
  | 'member_added'
  | 'mention'
  | 'task_assigned'
  | 'task_commented'
  | 'project_chat'
  | 'event_rsvp'
  | 'sync_failed'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  initials: string
  /** Platform suspension start (ISO). Null = not suspended. */
  suspendedAt?: string | null
  /** When suspension ends. Null with suspendedAt = indefinite. */
  suspendedUntil?: string | null
  suspendedReason?: string | null
  suspendedBy?: string | null
  lastLoginAt?: string | null
}

export interface WorkspaceMember {
  userId: string
  role: UserRole
  joinedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  members: WorkspaceMember[]
  createdAt: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Comment {
  id: string
  userId: string
  text: string
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  /** UUID filename on MatuDB disk (e.g. a1b2c3d4-e5f6.png) */
  storageFilename?: string
  /** @deprecated Use storageFilename — legacy logical paths */
  storagePath?: string
  uploadedAt: string
  uploadedBy: string
}

export interface Card {
  id: string
  listId: string
  boardId: string
  title: string
  description: string
  completed: boolean
  labelIds: string[]
  priority: Priority
  dueDate: string | null
  assigneeIds: string[]
  checklist: ChecklistItem[]
  comments: Comment[]
  attachments: Attachment[]
  position: number
  createdAt: string
  updatedAt: string
  createdBy: string | null
  completedAt: string | null
  durationSeconds: number | null
  estimateHours: number | null
  blocked: boolean
  blockedReason: string | null
}

export interface ChatAttachment {
  name: string
  url: string
  type: string
  size: number
}

export interface BoardMessage {
  id: string
  boardId: string
  userId: string
  text: string
  createdAt: string
  attachment?: ChatAttachment | null
  pending?: boolean
}

export interface BoardParticipant {
  user: User
  roleLabel: string
}

export type BoardPresenceStatus = 'online' | 'editing'

export interface BoardPresence {
  boardId: string
  userId: string
  status: BoardPresenceStatus
  activity: string
  lastSeen: string
  updatedAt: string
}

export interface List {
  id: string
  boardId: string
  title: string
  position: number
}

export interface Board {
  id: string
  workspaceId: string
  title: string
  slug: string
  description: string
  background: string
  starred: boolean
  integrations: BoardIntegration[]
  lists: List[]
  labels: Label[]
  createdAt: string
}

export interface BoardIntegration {
  type: 'google_calendar' | 'slack' | 'github' | 'ics_export' | 'webhook'
  enabled: boolean
  config: Record<string, string>
}

export type BoardShareRole = 'viewer' | 'member'
export type BoardInviteType = 'link' | 'email'

export interface BoardInvite {
  id: string
  boardId: string
  token: string
  boardSlug: string
  inviteType: BoardInviteType
  email: string | null
  role: BoardShareRole
  maxUses: number | null
  useCount: number
  enabled: boolean
  createdBy: string
  createdAt: string
}

/** @deprecated use BoardInvite */
export interface BoardShare {
  boardId: string
  token: string
  linkRole: BoardShareRole
  enabled: boolean
  createdBy: string
  updatedAt: string
}

export interface BoardMember {
  id: string
  boardId: string
  userId: string | null
  email: string | null
  role: BoardShareRole
  invitedBy: string
  status: 'pending' | 'accepted'
  createdAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  userId: string
  read: boolean
  createdAt: string
  metadata?: {
    boardId?: string
    cardId?: string
    workspaceId?: string
    projectId?: string
    taskId?: string
    tab?: string
  }
}

export interface AppState {
  users: User[]
  workspaces: Workspace[]
  boards: Board[]
  cards: Card[]
  notifications: Notification[]
}
