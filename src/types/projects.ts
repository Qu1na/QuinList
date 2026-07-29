import type { Attachment, Priority, UserRole } from '@/types'

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type ProjectTaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'

export type ProjectTaskView = 'list' | 'kanban' | 'schedule'

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RiskStatus = 'open' | 'mitigated' | 'closed'
export type RiskType = 'risk' | 'incident'

export type DeliverableStatus = 'pending' | 'in_progress' | 'delivered' | 'approved'

export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'transfer' | 'cash' | 'card' | 'invoice' | 'check' | 'other'

export type RiskProbability = 'low' | 'medium' | 'high'

export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string
  client: string
  responsibleId: string | null
  priority: Priority
  status: ProjectStatus
  category: string
  tags: string[]
  startDate: string | null
  dueDate: string | null
  budget: number
  currency: string
  profitabilityTarget: number | null
  boardId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  description: string
  status: ProjectTaskStatus
  priority: Priority
  assigneeIds: string[]
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  position: number
  kanbanColumn: ProjectTaskStatus
  boardCardId: string | null
  boardId: string | null
  attachments: Attachment[]
  estimateHours: number | null
  loggedMinutes: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectTimeEntry {
  id: string
  projectId: string
  taskId: string | null
  userId: string
  description: string
  minutes: number
  entryDate: string
  createdAt: string
}

export interface ProjectShareLink {
  id: string
  projectId: string
  token: string
  role: 'viewer' | 'commenter'
  expiresAt: string | null
  enabled: boolean
  createdBy: string | null
  createdAt: string
}

export interface ProjectMilestone {
  id: string
  projectId: string
  title: string
  description: string
  startDate: string | null
  dueDate: string | null
  completed: boolean
  position: number
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectCost {
  id: string
  projectId: string
  type: TransactionType
  title: string
  amount: number
  category: string
  paymentMethod: PaymentMethod
  reference: string
  notes: string
  date: string
  createdBy: string | null
  createdAt: string
}

/** Alias semántico — los movimientos financieros viven en `costs` por compatibilidad con el schema SQL */
export type ProjectTransaction = ProjectCost

export interface ProjectRisk {
  id: string
  projectId: string
  title: string
  description: string
  type: RiskType
  severity: RiskSeverity
  probability: RiskProbability
  status: RiskStatus
  mitigationPlan: string
  ownerId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface DeliverableLogEntry {
  id: string
  text: string
  uploadedBy: string | null
  createdAt: string
  attachment?: Attachment
}

export interface ProjectDeliverable {
  id: string
  projectId: string
  title: string
  description: string
  dueDate: string | null
  status: DeliverableStatus
  completed: boolean
  assigneeId: string | null
  milestoneId: string | null
  attachments: Attachment[]
  log: DeliverableLogEntry[]
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectFolder {
  id: string
  projectId: string
  parentId: string | null
  name: string
  createdBy: string | null
  createdAt: string
}

export interface ProjectInvite {
  id: string
  projectId: string
  email: string
  role: UserRole
  canViewFinance: boolean
  canManageTasks: boolean
  canManageTeam: boolean
  status: 'pending' | 'accepted' | 'declined'
  invitedBy: string | null
  createdAt: string
}

export interface ProjectTeamInvite {
  id: string
  projectId: string
  token: string
  role: UserRole
  canViewFinance: boolean
  canManageTasks: boolean
  canManageTeam: boolean
  maxUses: number | null
  useCount: number
  enabled: boolean
  createdBy: string
  createdAt: string
}

export interface ProjectDocument {
  id: string
  projectId: string
  folderId: string | null
  title: string
  content: string
  category: string
  attachments: Attachment[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: UserRole
  canViewFinance: boolean
  canManageTasks: boolean
  canManageTeam: boolean
  joinedAt: string
}

export interface ProjectTaskComment {
  id: string
  projectId: string
  taskId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ProjectActivity {
  id: string
  projectId: string
  workspaceId?: string | null
  userId: string
  action: string
  details: string
  entityType?: string | null
  entityId?: string | null
  entityTitle?: string | null
  createdAt: string
}

export interface ProjectsDataState {
  projects: Project[]
  tasks: ProjectTask[]
  milestones: ProjectMilestone[]
  costs: ProjectCost[]
  risks: ProjectRisk[]
  deliverables: ProjectDeliverable[]
  documents: ProjectDocument[]
  folders: ProjectFolder[]
  invites: ProjectInvite[]
  members: ProjectMember[]
  activities: ProjectActivity[]
  timeEntries: ProjectTimeEntry[]
  taskComments: ProjectTaskComment[]
}

export type ProjectDetailTab =
  | 'dashboard'
  | 'info'
  | 'tasks'
  | 'gantt'
  | 'finance'
  | 'milestones'
  | 'team'
  | 'deliverables'
  | 'risks'
  | 'documents'
  | 'files'
  | 'activity'
  | 'reports'
  | 'settings'
