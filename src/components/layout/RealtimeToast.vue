<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'
import type { Notification } from '@/types'
import { getNotificationIcon } from '@/utils/notificationIcons'

const toasts = ref<Notification[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const MAX_TOASTS = 3

function dismiss(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

function onNotification(e: Event) {
  const detail = (e as CustomEvent<Notification>).detail
  toasts.value = [detail, ...toasts.value.filter((t) => t.id !== detail.id)].slice(0, MAX_TOASTS)

  if (timers.has(detail.id)) clearTimeout(timers.get(detail.id)!)
  timers.set(
    detail.id,
    setTimeout(() => dismiss(detail.id), 5000),
  )
}

onMounted(() => {
  window.addEventListener('quinlist:notification', onNotification)
})

onUnmounted(() => {
  window.removeEventListener('quinlist:notification', onNotification)
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})
</script>

<template>
  <div
    v-if="toasts.length"
    class="notif-toasts"
    aria-live="polite"
    aria-label="Notificaciones"
  >
    <TransitionGroup name="notif-toast" tag="div" class="notif-toasts__stack">
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="notif-toast"
      >
        <span class="notif-toast__icon">
          <component :is="getNotificationIcon(toast.type)" :size="18" />
        </span>
        <div class="notif-toast__body">
          <strong class="notif-toast__title">{{ toast.title }}</strong>
          <p class="notif-toast__message">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="notif-toast__close"
          aria-label="Cerrar"
          @click="dismiss(toast.id)"
        >
          <X :size="14" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notif-toasts {
  position: fixed;
  top: 4.5rem;
  right: 1rem;
  z-index: 2000;
  pointer-events: none;
  width: min(22rem, calc(100vw - 2rem));
}

.notif-toasts__stack {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.notif-toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
  padding: 0.875rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 12px 40px rgba(23, 43, 77, 0.14),
    0 0 0 0.5px rgba(255, 255, 255, 0.6) inset;
  backdrop-filter: blur(20px) saturate(1.4);
}

.notif-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: linear-gradient(180deg, #f0f4ff 0%, #e8eef8 100%);
  color: #2d7eb8;
}

.notif-toast__title {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #172b4d;
  line-height: 1.3;
}

.notif-toast__message {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #626f86;
}

.notif-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  color: #97a0af;
}

.notif-toast__close:hover {
  background: #f1f2f4;
  color: #44546f;
}

.notif-toast-enter-active,
.notif-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.notif-toast-enter-from,
.notif-toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.notif-toast-move {
  transition: transform 0.25s ease;
}
</style>
