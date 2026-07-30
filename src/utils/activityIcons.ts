import type { Component } from 'vue'
import type { ActivityActionType } from '@/types/collaboration'
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Flag,
  MessageSquare,
  Package,
  Paperclip,
  Pencil,
  StickyNote,
  Trash2,
  UserMinus,
  UserPlus,
  CirclePlus,
} from '@lucide/vue'

export const activityIconMap: Record<ActivityActionType, Component> = {
  task_created: CirclePlus,
  task_updated: Pencil,
  task_deleted: Trash2,
  task_completed: CheckCircle2,
  task_moved: ArrowLeftRight,
  milestone_created: Flag,
  milestone_completed: CheckCircle2,
  milestone_deleted: Trash2,
  deliverable_created: Package,
  deliverable_completed: CheckCircle2,
  deliverable_deleted: Trash2,
  note_created: StickyNote,
  note_updated: Pencil,
  note_deleted: Trash2,
  document_created: FileText,
  file_uploaded: Paperclip,
  risk_created: AlertTriangle,
  member_joined: UserPlus,
  member_removed: UserMinus,
  comment_added: MessageSquare,
  comment_deleted: Trash2,
  project_updated: Pencil,
  finance_added: CircleDollarSign,
  custom: Bell,
}

export function getActivityIcon(type: ActivityActionType): Component {
  return activityIconMap[type] ?? Bell
}
