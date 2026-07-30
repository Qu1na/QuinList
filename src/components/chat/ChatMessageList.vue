<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'
import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import { groupChatMessages, type ChatListMessage } from '@/utils/chatMessageGroups'

const props = defineProps<{
  messages: ChatListMessage[]
  loading?: boolean
  currentUserId: string | null
  otherMemberIds: string[]
}>()

const groups = computed(() => groupChatMessages(props.messages))
</script>

<template>
  <div class="wa-message-list">
    <div v-if="loading" class="wa-message-list__loading">
      <Loader2 :size="22" class="animate-spin text-[#616061]" />
    </div>

    <template v-else-if="groups.length">
      <section v-for="group in groups" :key="group.dateLabel" class="wa-message-list__day">
        <div class="wa-message-list__divider">
          <span>{{ group.dateLabel }}</span>
        </div>

        <ChatMessageBubble
          v-for="{ message, compact } in group.items"
          :key="message.id"
          :message="message"
          :other-member-ids="otherMemberIds"
          :show-avatar="!compact"
          :show-sender-name="!compact && message.userId !== currentUserId"
        />
      </section>
    </template>

    <slot v-else name="empty" />
  </div>
</template>

<style scoped>
.wa-message-list {
  padding: 0.5rem 0 1rem;
}

.wa-message-list__loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.wa-message-list__divider {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.wa-message-list__divider span {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ql-chat-muted, #626f86);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(9, 30, 66, 0.08);
}
</style>
