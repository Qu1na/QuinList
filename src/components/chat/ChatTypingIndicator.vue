<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  typingUserIds: string[]
}>()

const auth = useAuthStore()

const label = computed(() => {
  const names = props.typingUserIds
    .filter((id) => id !== auth.currentUserId)
    .map((id) => auth.getUserById(id)?.name?.split(' ')[0] ?? 'Alguien')
  if (!names.length) return ''
  if (names.length === 1) return `${names[0]} está escribiendo…`
  if (names.length === 2) return `${names[0]} y ${names[1]} están escribiendo…`
  return `${names[0]} y ${names.length - 1} más están escribiendo…`
})
</script>

<template>
  <p v-if="label" class="chat-typing">{{ label }}</p>
</template>

<style scoped>
.chat-typing {
  margin: 0;
  padding: 0.25rem 1rem 0.5rem;
  font-size: 0.8125rem;
  font-style: italic;
  color: var(--ql-chat-muted, #626f86);
  animation: chat-typing-pulse 1.2s ease-in-out infinite;
}

@keyframes chat-typing-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
</style>
