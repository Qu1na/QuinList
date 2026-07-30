<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import ChatMessageBody from '@/components/chat/ChatMessageBody.vue'
import ChatAttachmentBlock from '@/components/chat/ChatAttachmentBlock.vue'
import ChatMessageStatus from '@/components/chat/ChatMessageStatus.vue'
import { formatChatClockTime } from '@/utils/chatTime'
import { resolveOutgoingStatus } from '@/utils/chatMessageStatus'
import type { ChatListMessage } from '@/utils/chatMessageGroups'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  message: ChatListMessage
  otherMemberIds: string[]
  showAvatar?: boolean
  showSenderName?: boolean
}>()

const auth = useAuthStore()

const isOwn = computed(() => props.message.userId === auth.currentUserId)
const hasAttachment = computed(() => Boolean(props.message.attachment?.url))
const hasText = computed(() => Boolean(props.message.text?.trim()))

const senderName = computed(() => {
  const user = auth.getUserById(props.message.userId)
  const full = user?.name ?? 'Usuario'
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return full
  return `${parts[0]} ${parts[1]?.[0] ? `${parts[1][0]}.` : ''}`.trim()
})

const outgoingStatus = computed(() =>
  resolveOutgoingStatus(
    {
      pending: props.message.pending,
      status: props.message.status,
      readBy: props.message.readBy,
      userId: props.message.userId,
    },
    props.otherMemberIds,
  ),
)
</script>

<template>
  <article
    class="chat-bubble-row"
    :class="{
      'chat-bubble-row--own': isOwn,
      'chat-bubble-row--other': !isOwn,
      'chat-bubble-row--pending': message.pending,
    }"
  >
    <div v-if="!isOwn && showAvatar" class="chat-bubble-row__avatar">
      <UserAvatar :user-id="message.userId" size="sm" />
    </div>
    <div v-else-if="!isOwn" class="chat-bubble-row__avatar-spacer" />

    <div class="chat-bubble-row__content">
      <p v-if="!isOwn && showSenderName" class="chat-bubble-row__sender">{{ senderName }}</p>

      <div
        class="chat-bubble"
        :class="{
          'chat-bubble--own': isOwn,
          'chat-bubble--other': !isOwn,
          'chat-bubble--media': hasAttachment,
        }"
      >
        <!-- Media arriba, pegado a los bordes de la burbuja -->
        <div v-if="hasAttachment" class="chat-bubble__media">
          <ChatAttachmentBlock
            :message="message"
            in-bubble
            :has-caption="hasText"
          />

          <!-- Sin caption: hora sobre la imagen -->
          <span
            v-if="!hasText"
            class="chat-bubble__meta chat-bubble__meta--overlay"
          >
            <time class="chat-bubble__time">{{ formatChatClockTime(message.createdAt) }}</time>
            <ChatMessageStatus v-if="isOwn" :status="outgoingStatus" variant="overlay" />
          </span>
        </div>

        <!-- Caption + hora (patrón WhatsApp: meta flotada a la derecha) -->
        <div
          v-if="!hasAttachment || hasText"
          class="chat-bubble__inner"
          :class="{ 'chat-bubble__inner--caption': hasAttachment && hasText }"
        >
          <span class="chat-bubble__meta chat-bubble__meta--inline">
            <time class="chat-bubble__time">{{ formatChatClockTime(message.createdAt) }}</time>
            <ChatMessageStatus v-if="isOwn" :status="outgoingStatus" variant="default" />
          </span>
          <ChatMessageBody v-if="hasText" :text="message.text" :inverted="isOwn" class="chat-bubble__text" />
          <ChatMessageBody v-else-if="!hasAttachment" :text="message.text" :inverted="isOwn" class="chat-bubble__text" />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.chat-bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.125rem 0.75rem;
  animation: chat-bubble-in 0.18s ease-out;
}

.chat-bubble-row--own {
  flex-direction: row-reverse;
}

.chat-bubble-row--pending {
  opacity: 0.72;
}

.chat-bubble-row__avatar {
  flex-shrink: 0;
  margin-bottom: 0.125rem;
}

.chat-bubble-row__avatar-spacer {
  width: 2rem;
  flex-shrink: 0;
}

.chat-bubble-row__content {
  display: flex;
  max-width: min(78%, 20rem);
  flex-direction: column;
  gap: 0.2rem;
}

.chat-bubble-row--own .chat-bubble-row__content {
  align-items: flex-end;
}

.chat-bubble-row__sender {
  margin: 0 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ql-chat-primary, #2d7eb8);
}

/* ── Burbuja WhatsApp ── */
.chat-bubble {
  position: relative;
  max-width: 100%;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.35;
  word-break: break-word;
  box-shadow: 0 1px 1px rgba(11, 20, 26, 0.13);
}

.chat-bubble--own {
  border-top-right-radius: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--ql-chat-sky, #5bbce4) 0%, var(--ql-chat-primary, #2d7eb8) 100%);
}

.chat-bubble--other {
  border-top-left-radius: 0;
  color: #111b21;
  background: #fff;
  border: 1px solid rgba(9, 30, 66, 0.06);
}

.chat-bubble--media {
  padding: 0.1875rem;
  overflow: hidden;
}

.chat-bubble--media.chat-bubble--other {
  padding: 0.1875rem;
}

/* ── Media ── */
.chat-bubble__media {
  position: relative;
  line-height: 0;
}

.chat-bubble__meta--overlay {
  position: absolute;
  right: 0.375rem;
  bottom: 0.375rem;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.125rem 0.375rem 0.125rem 0.5rem;
  border-radius: 0.5rem;
  line-height: 1;
  color: #fff;
  background: rgba(11, 20, 26, 0.45);
}

.chat-bubble__meta--overlay .chat-bubble__time {
  color: #fff;
  opacity: 1;
}

/* ── Caption + hora inline (float WhatsApp) ── */
.chat-bubble__inner {
  padding: 0.25rem 0.5rem 0.375rem;
}

.chat-bubble__inner--caption {
  padding: 0.1875rem 0.5rem 0.375rem;
}

.chat-bubble__meta--inline {
  float: right;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  margin-left: 0.5rem;
  margin-top: 0.125rem;
  line-height: 1;
  vertical-align: bottom;
}

.chat-bubble__text {
  display: inline;
}

.chat-bubble__inner::after {
  content: '';
  display: table;
  clear: both;
}

.chat-bubble__time {
  font-size: 0.6875rem;
  opacity: 0.75;
  color: inherit;
  white-space: nowrap;
}

.chat-bubble--own .chat-bubble__time {
  opacity: 0.9;
}

@keyframes chat-bubble-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
