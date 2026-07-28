<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell } from '@lucide/vue'
import type { Notification } from '@/types'

const toast = ref<Notification | null>(null)
let timeout: ReturnType<typeof setTimeout> | null = null

function onNotification(e: Event) {
  const detail = (e as CustomEvent<Notification>).detail
  toast.value = detail
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    toast.value = null
  }, 4000)
}

onMounted(() => {
  window.addEventListener('quinlist:notification', onNotification)
})

onUnmounted(() => {
  window.removeEventListener('quinlist:notification', onNotification)
  if (timeout) clearTimeout(timeout)
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-300 ease-in"
    enter-from-class="opacity-0 translate-y-5"
    leave-to-class="opacity-0 translate-y-5"
  >
    <div
      v-if="toast"
      class="fixed right-6 bottom-6 z-2000 flex max-w-sm items-start gap-3 rounded-xl bg-slate-800 p-4 text-white shadow-2xl"
    >
      <Bell :size="20" class="mt-0.5 shrink-0 text-blue-400" />
      <div>
        <strong class="block text-sm">{{ toast.title }}</strong>
        <p class="mt-0.5 text-sm leading-relaxed text-slate-300">{{ toast.message }}</p>
      </div>
    </div>
  </Transition>
</template>
