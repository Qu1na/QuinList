import type { Component } from 'vue'
import type { NotificationType } from '@/types'
import {
  Pin,
  MessageSquare,
  ArrowLeftRight,
  Clock,
  UserPlus,
  AtSign,
  Bell,
} from '@lucide/vue'

export const notificationIconMap: Record<NotificationType, Component> = {
  card_assigned: Pin,
  card_commented: MessageSquare,
  card_moved: ArrowLeftRight,
  card_due_soon: Clock,
  member_added: UserPlus,
  mention: AtSign,
  task_assigned: Pin,
  task_commented: MessageSquare,
  project_chat: MessageSquare,
}

export function getNotificationIcon(type: NotificationType): Component {
  return notificationIconMap[type] ?? Bell
}
