<script setup lang="ts">
import { FileText } from '@lucide/vue'
import {
  fileKindIcon,
  fileKindLabel,
  formatFileSize,
  isImageType,
  isVideoType,
  isAudioType,
} from '@/utils/chatFilePreview'
import type { ChatListMessage } from '@/utils/chatMessageGroups'
import { useChatFilePreview } from '@/composables/useChatFilePreview'

const props = defineProps<{
  message: ChatListMessage
  inBubble?: boolean
  hasCaption?: boolean
}>()

const preview = useChatFilePreview()

function openPreview() {
  const att = props.message.attachment
  if (!att?.url) return
  preview.show(att.url, att.name, att.type, att.size)
}

function openImage() {
  openPreview()
}
</script>

<template>
  <div
    v-if="message.attachment?.url"
    class="chat-attachment"
    :class="{
      'chat-attachment--in-bubble': inBubble,
      'chat-attachment--has-caption': inBubble && hasCaption,
    }"
  >
    <img
      v-if="isImageType(message.attachment.type)"
      :src="message.attachment.url"
      :alt="message.attachment.name"
      class="chat-attachment__image"
      loading="lazy"
      @click="openImage"
    />

    <video
      v-else-if="isVideoType(message.attachment.type)"
      :src="message.attachment.url"
      class="chat-attachment__video"
      controls
      preload="metadata"
      @click="openPreview"
    />

    <audio
      v-else-if="isAudioType(message.attachment.type)"
      :src="message.attachment.url"
      class="chat-attachment__audio"
      controls
      preload="metadata"
    />

    <!-- PDF y demás documentos: tarjeta compacta, sin iframe en el mensaje -->
    <div
      v-else
      class="chat-attachment__card"
      role="button"
      tabindex="0"
      @click="openPreview"
      @keydown.enter="openPreview"
    >
      <span class="chat-attachment__card-icon">
        <component
          :is="fileKindIcon(message.attachment.type, message.attachment.name)"
          :size="22"
        />
      </span>
      <div class="chat-attachment__card-meta">
        <p class="chat-attachment__card-name">{{ message.attachment.name }}</p>
        <p class="chat-attachment__card-sub">
          {{ fileKindLabel(message.attachment.type, message.attachment.name) }}
          · {{ formatFileSize(message.attachment.size) }}
        </p>
      </div>
      <FileText :size="16" class="chat-attachment__card-open" />
    </div>
  </div>
</template>

<style scoped>
.chat-attachment--in-bubble {
  line-height: 0;
}

.chat-attachment--in-bubble .chat-attachment__image {
  display: block;
  width: 100%;
  max-width: 18rem;
  max-height: 18rem;
  object-fit: cover;
  cursor: pointer;
  border-radius: 0.375rem;
}

.chat-attachment--in-bubble.chat-attachment--has-caption .chat-attachment__image {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.chat-attachment--in-bubble .chat-attachment__video {
  display: block;
  width: 100%;
  max-width: 18rem;
  max-height: 14rem;
  border-radius: 0.375rem;
  background: #000;
  cursor: pointer;
}

.chat-attachment--in-bubble.chat-attachment--has-caption .chat-attachment__video {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.chat-attachment--in-bubble .chat-attachment__audio {
  display: block;
  width: min(100%, 16rem);
  height: 2.25rem;
  padding: 0.25rem;
  line-height: normal;
}

.chat-attachment--in-bubble .chat-attachment__card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 12rem;
  max-width: 18rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  line-height: normal;
  transition: background 0.12s ease;
}

.chat-attachment--in-bubble .chat-attachment__card:hover {
  background: #fff;
}

.chat-attachment__image {
  display: block;
  max-width: min(100%, 16rem);
  max-height: 14rem;
  border-radius: 0.5rem;
  object-fit: cover;
  cursor: pointer;
}

.chat-attachment__video {
  display: block;
  max-width: min(100%, 18rem);
  max-height: 12rem;
  border-radius: 0.5rem;
  background: #000;
  cursor: pointer;
}

.chat-attachment__audio {
  display: block;
  width: min(100%, 16rem);
  height: 2.25rem;
}

.chat-attachment__card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.625rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(9, 30, 66, 0.06);
  line-height: normal;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}

.chat-attachment__card:hover {
  background: #fff;
  box-shadow: 0 1px 4px rgba(9, 30, 66, 0.08);
}

.chat-attachment__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  color: var(--ql-chat-primary, #2d7eb8);
  background: rgba(45, 126, 184, 0.1);
}

.chat-attachment__card-meta {
  min-width: 0;
  flex: 1;
}

.chat-attachment__card-name {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111b21;
}

.chat-attachment__card-sub {
  margin: 0.125rem 0 0;
  font-size: 0.6875rem;
  color: #667781;
}

.chat-attachment__card-open {
  flex-shrink: 0;
  color: #667781;
  opacity: 0.7;
}
</style>
