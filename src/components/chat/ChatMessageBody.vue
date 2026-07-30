<script setup lang="ts">
import { computed } from 'vue'
import { parseMessageParts } from '@/utils/renderMentions'

const props = defineProps<{
  text: string
  inverted?: boolean
}>()

const parts = computed(() => parseMessageParts(props.text))
</script>

<template>
  <span class="chat-message-body" :class="{ 'chat-message-body--inverted': inverted }">
    <template v-for="(part, i) in parts" :key="i">
      <span v-if="part.type === 'user'" class="chat-message-body__mention">
        {{ part.value }}
      </span>
      <span v-else-if="part.type === 'entity'" class="chat-message-body__entity">
        {{ part.value }}
      </span>
      <span v-else class="chat-message-body__text">{{ part.value }}</span>
    </template>
  </span>
</template>

<style scoped>
.chat-message-body {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message-body__text {
  white-space: pre-wrap;
}

.chat-message-body__mention {
  display: inline;
  font-weight: 600;
  color: var(--ql-chat-mention-text, #2d7eb8);
  background: var(--ql-chat-mention-bg, rgba(45, 126, 184, 0.14));
  border-radius: 4px;
  padding: 0 0.25rem;
  margin: 0 0.05rem;
}

.chat-message-body__entity {
  display: inline;
  font-weight: 600;
  color: var(--ql-chat-entity-text, #6554c0);
  background: var(--ql-chat-entity-bg, rgba(101, 84, 192, 0.12));
  border-radius: 4px;
  padding: 0 0.25rem;
  margin: 0 0.05rem;
}

.chat-message-body--inverted .chat-message-body__mention {
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
}

.chat-message-body--inverted .chat-message-body__entity {
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
}
</style>
