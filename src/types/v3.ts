// Tipos para los módulos añadidos en v3 (eventos, recurrencia, dependencias,
// custom fields, reacciones, automatizaciones, vistas guardadas, OKRs).

export type EventCategory = 'meeting' | 'workshop' | 'review' | 'social' | 'deadline' | 'other'
export type AttendeeResponse = 'pending' | 'accepted' | 'declined' | 'tentative'

export interface WorkspaceEvent {
  id: string
  workspaceId: string
  projectId: string | null
  boardId: string | null
  title: string
  description: string
  location: string
  meetingUrl: string
  startsAt: string
  endsAt: string | null
  allDay: boolean
  color: string
  category: EventCategory
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
  recurrenceEnd: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface EventAttendee {
  id: string
  eventId: string
  userId: string
  response: AttendeeResponse
  notified: boolean
  createdAt: string
}

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface RecurringRule {
  id: string
  scope: 'project_task' | 'card'
  parentId: string
  workspaceId: string | null
  frequency: RecurringFrequency
  intervalValue: number
  weekdays: number[]
  monthDay: number | null
  startsOn: string
  endsOn: string | null
  nextRun: string | null
  lastRun: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type DependencyType = 'blocks' | 'relates_to' | 'duplicates'

export interface TaskDependency {
  id: string
  sourceType: 'project_task' | 'card'
  sourceId: string
  targetType: 'project_task' | 'card'
  targetId: string
  dependencyType: DependencyType
  createdBy: string | null
  createdAt: string
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multi' | 'checkbox' | 'url' | 'email'

export interface CustomFieldDefinition {
  id: string
  scope: 'board' | 'project'
  scopeId: string
  name: string
  fieldType: CustomFieldType
  options: string[]
  required: boolean
  position: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomFieldValue {
  id: string
  definitionId: string
  entityType: 'card' | 'project_task'
  entityId: string
  valueText: string
  valueNumber: number | null
  valueDate: string | null
  valueJson: unknown
  updatedAt: string
}

export interface Reaction {
  id: string
  entityType: 'project_chat_message' | 'board_message' | 'project_task_comment' | 'card_comment'
  entityId: string
  userId: string
  emoji: string
  createdAt: string
}

export type AutomationTrigger =
  | 'task_created'
  | 'task_completed'
  | 'task_moved'
  | 'task_assigned'
  | 'due_date_approaching'
  | 'comment_added'
  | 'card_created'
  | 'card_moved'

export type AutomationAction =
  | { type: 'assign'; userId: string }
  | { type: 'move_to'; columnId: string }
  | { type: 'add_label'; labelId: string }
  | { type: 'set_priority'; priority: string }
  | { type: 'notify'; userId: string; message: string }
  | { type: 'set_due_date'; offsetDays: number }
  | { type: 'add_comment'; text: string }

export interface AutomationRule {
  id: string
  workspaceId: string | null
  boardId: string | null
  projectId: string | null
  name: string
  description: string
  triggerEvent: AutomationTrigger
  triggerConditions: Record<string, unknown>
  actions: AutomationAction[]
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AutomationLog {
  id: string
  ruleId: string
  triggeredAt: string
  success: boolean
  message: string
}

export interface SavedView {
  id: string
  userId: string
  workspaceId: string | null
  name: string
  entityType: 'card' | 'project_task'
  filters: Record<string, unknown>
  sort: Record<string, unknown>
  isShared: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export type OKRPeriod = 'quarter' | 'half' | 'year' | 'custom'
export type OKRStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed'
export type KeyResultMetric = 'percentage' | 'number' | 'currency' | 'boolean'

export interface OKR {
  id: string
  workspaceId: string
  projectId: string | null
  parentId: string | null
  title: string
  description: string
  ownerId: string | null
  period: OKRPeriod
  startsAt: string
  endsAt: string
  status: OKRStatus
  progress: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface KeyResult {
  id: string
  okrId: string
  title: string
  metricType: KeyResultMetric
  targetValue: number
  currentValue: number
  unit: string
  ownerId: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface KeyResultUpdate {
  id: string
  keyResultId: string
  value: number
  note: string
  updatedBy: string | null
  createdAt: string
}