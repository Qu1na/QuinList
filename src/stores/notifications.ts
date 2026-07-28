import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationType } from '@/types'
import { generateId } from '@/utils/permissions'
import { useAuthStore } from './auth'
import { isMatuConfigured } from '@/lib/matu'
import {
  loadNotifications,
  pushNotification,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeNotificationsRealtime,
} from '@/services/matuData'

type NotificationInput = {
  type: NotificationType
  title: string
  message: string
  userId: string
  metadata?: Notification['metadata']
}

const STORAGE_KEY = 'quinlist_notifications'

function loadLocal(): Notification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as Notification[]
  } catch {
    /* ignore */
  }
  return []
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>(loadLocal())
  const showPanel = ref(false)
  let unsubscribeRealtime: (() => void) | null = null

  const userNotifications = computed(() => {
    const auth = useAuthStore()
    if (!auth.currentUserId) return []
    return notifications.value
      .filter((n) => n.userId === auth.currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const unreadCount = computed(() => userNotifications.value.filter((n) => !n.read).length)

  function persistLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
  }

  async function reloadFromDb() {
    const auth = useAuthStore()
    if (!isMatuConfigured() || !auth.currentUserId) return
    notifications.value = await loadNotifications(auth.currentUserId)
    persistLocal()
  }

  async function init() {
    await reloadFromDb()
    unsubscribeRealtime?.()
    const auth = useAuthStore()
    if (auth.currentUserId && isMatuConfigured()) {
      unsubscribeRealtime = subscribeNotificationsRealtime(auth.currentUserId, () => {
        reloadFromDb().catch(console.error)
      })
    }
  }

  function destroy() {
    unsubscribeRealtime?.()
    unsubscribeRealtime = null
  }

  async function push(input: NotificationInput) {
    const notification: Notification = {
      id: generateId(),
      ...input,
      read: false,
      createdAt: new Date().toISOString(),
    }
    notifications.value.unshift(notification)
    persistLocal()
    dispatchToast(notification)

    if (isMatuConfigured()) {
      try {
        await pushNotification(notification)
      } catch (err) {
        console.error('Error guardando notificación:', err)
      }
    }
  }

  async function markAsRead(id: string) {
    const n = notifications.value.find((x) => x.id === id)
    if (!n || n.read) return
    n.read = true
    persistLocal()
    if (isMatuConfigured()) {
      await markNotificationRead(id).catch(console.error)
    }
  }

  async function markAllAsRead() {
    const auth = useAuthStore()
    const unread = notifications.value.filter(
      (n) => n.userId === auth.currentUserId && !n.read,
    )
    unread.forEach((n) => {
      n.read = true
    })
    persistLocal()
    if (isMatuConfigured() && auth.currentUserId) {
      await markAllNotificationsRead(auth.currentUserId).catch(console.error)
    }
  }

  function togglePanel() {
    showPanel.value = !showPanel.value
  }

  function dispatchToast(notification: Notification) {
    window.dispatchEvent(
      new CustomEvent('quinlist:notification', { detail: notification }),
    )
  }

  return {
    notifications,
    showPanel,
    userNotifications,
    unreadCount,
    init,
    destroy,
    reloadFromDb,
    push,
    markAsRead,
    markAllAsRead,
    togglePanel,
  }
})
