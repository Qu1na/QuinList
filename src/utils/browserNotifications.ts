import type { Notification } from '@/types'

const PERMISSION_KEY = 'quinlist_notif_permission_asked'

export function canUseBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function browserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!canUseBrowserNotifications()) return 'unsupported'
  return Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canUseBrowserNotifications()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  const asked = localStorage.getItem(PERMISSION_KEY)
  if (asked === 'denied') return 'denied'

  try {
    const result = await Notification.requestPermission()
    localStorage.setItem(PERMISSION_KEY, result)
    return result
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(notification: Notification): void {
  if (!canUseBrowserNotifications()) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return

  try {
    const n = new Notification(notification.title, {
      body: notification.message,
      tag: notification.id,
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* ignore */
  }
}
