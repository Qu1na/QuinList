<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatLastSeen } from '@/utils/chatTime'
import type { ProjectPresence } from '@/types/collaboration'
import { isProjectPresenceActive } from '@/services/projectPresence'

const props = defineProps<{
  presence: ProjectPresence[]
  memberIds: string[]
}>()

const auth = useAuthStore()

const onlineMembers = computed(() =>
  props.presence.filter(
    (p) => p.userId !== auth.currentUserId && isProjectPresenceActive(p.lastSeen),
  ),
)

const summary = computed(() => {
  const total = props.memberIds.filter((id) => id !== auth.currentUserId).length
  const online = onlineMembers.value.length
  if (online === 0) {
    const latest = [...props.presence]
      .filter((p) => p.userId !== auth.currentUserId)
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0]
    if (latest) return formatLastSeen(latest.lastSeen)
    return `${total} participante${total === 1 ? '' : 's'}`
  }
  if (online === total) return `${online} en línea`
  return `${online} de ${total} en línea`
})
</script>

<template>
  <p class="chat-presence">
    <span v-if="onlineMembers.length" class="chat-presence__dot" />
    {{ summary }}
  </p>
</template>

<style scoped>
.chat-presence {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.75rem;
  color: var(--ql-chat-muted, #626f86);
}

.chat-presence__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}
</style>
