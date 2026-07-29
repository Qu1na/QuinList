<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'
import RelativeTime from '@/components/ui/RelativeTime.vue'
import { getNotificationIcon } from '@/utils/notificationIcons'

import { useRouter } from 'vue-router'

const notif = useNotificationStore()
const ui = useUiStore()
const router = useRouter()

function handleClick(notification: (typeof notif.userNotifications)[0]) {
  notif.markAsRead(notification.id)
  if (notification.metadata?.cardId) {
    if (notification.metadata.boardId) {
      router.push({ name: 'board', params: { boardId: notification.metadata.boardId } })
    }
    ui.openCard(notification.metadata.cardId)
    notif.showPanel = false
  }
}
</script>

<template>
  <div
    class="absolute top-full right-6 z-50 mt-2 w-90 overflow-hidden rounded-xl bg-white shadow-2xl"
  >
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-800">Notificaciones</h3>
      <button
        v-if="notif.unreadCount > 0"
        class="text-xs text-blue-600 hover:text-blue-700"
        @click="notif.markAllAsRead()"
      >
        Marcar todas
      </button>
    </div>
    <div class="scroll-thin max-h-100 overflow-y-auto">
      <button
        v-for="n in notif.userNotifications.slice(0, 10)"
        :key="n.id"
        class="flex w-full gap-3 border-b border-slate-50 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
        :class="{ 'bg-blue-50': !n.read }"
        @click="handleClick(n)"
      >
        <component
          :is="getNotificationIcon(n.type)"
          :size="18"
          class="mt-0.5 shrink-0 text-slate-500"
        />
        <div>
          <strong class="block text-xs font-semibold text-slate-800">{{ n.title }}</strong>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-500">{{ n.message }}</p>
          <RelativeTime :iso="n.createdAt" class="mt-1 block text-[0.7rem] text-slate-400" />
        </div>
      </button>
      <p
        v-if="notif.userNotifications.length === 0"
        class="px-5 py-8 text-center text-sm text-slate-400"
      >
        Sin notificaciones
      </p>
    </div>
  </div>
</template>
