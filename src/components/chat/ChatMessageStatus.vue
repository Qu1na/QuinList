<script setup lang="ts">
import { Clock, Check, CheckCheck } from '@lucide/vue'
import type { ChatMessageStatus } from '@/types/chat'

withDefaults(
  defineProps<{
    status: ChatMessageStatus
    variant?: 'default' | 'wa' | 'overlay'
  }>(),
  { variant: 'default' },
)

const labels: Record<ChatMessageStatus, string> = {
  sending: 'Enviando',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leído',
}
</script>

<template>
  <span
    class="chat-status"
    :class="[`chat-status--${status}`, `chat-status--${variant}`]"
    :title="labels[status]"
  >
    <Clock v-if="status === 'sending'" :size="12" class="chat-status__icon" />
    <Check v-else-if="status === 'sent'" :size="12" class="chat-status__icon" />
    <CheckCheck
      v-else
      :size="12"
      class="chat-status__icon"
      :class="{ 'chat-status__icon--read': status === 'read' }"
    />
  </span>
</template>

<style scoped>
.chat-status {
  display: inline-flex;
  align-items: center;
}

.chat-status__icon {
  color: rgba(255, 255, 255, 0.85);
}

.chat-status--sent .chat-status__icon,
.chat-status--delivered .chat-status__icon {
  color: rgba(255, 255, 255, 0.9);
}

.chat-status__icon--read {
  color: #c5ebfa;
}

/* WhatsApp: checks grises/azules sobre burbuja verde */
.chat-status--wa .chat-status__icon {
  color: rgba(17, 27, 33, 0.45);
}

.chat-status--wa .chat-status__icon--read {
  color: #53bdeb;
}

/* Sobre imagen oscura */
.chat-status--overlay .chat-status__icon {
  color: rgba(255, 255, 255, 0.85);
}

.chat-status--overlay .chat-status__icon--read {
  color: #53bdeb;
}
</style>
