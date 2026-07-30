<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { X } from '@lucide/vue'
import {
  createFilePreviewUrl,
  revokeFilePreviewUrl,
  fileKindIcon,
  fileKindLabel,
  formatFileSize,
  isImageType,
  isVideoType,
  isAudioType,
} from '@/utils/chatFilePreview'

const props = defineProps<{
  file: File
}>()

const emit = defineEmits<{
  remove: []
}>()

const previewUrl = computed(() => {
  if (isImageType(props.file.type) || isVideoType(props.file.type) || isAudioType(props.file.type)) {
    return createFilePreviewUrl(props.file)
  }
  return ''
})

const KindIcon = computed(() => fileKindIcon(props.file.type, props.file.name))

watch(
  () => props.file,
  (_, prev) => {
    if (prev && previewUrl.value) revokeFilePreviewUrl(previewUrl.value)
  },
)

onUnmounted(() => {
  if (previewUrl.value) revokeFilePreviewUrl(previewUrl.value)
})
</script>

<template>
  <div class="chat-file-preview">
    <div v-if="isImageType(file.type) && previewUrl" class="chat-file-preview__thumb">
      <img :src="previewUrl" :alt="file.name" />
    </div>
    <div v-else-if="isVideoType(file.type) && previewUrl" class="chat-file-preview__thumb">
      <video :src="previewUrl" muted />
    </div>
    <div v-else-if="isAudioType(file.type) && previewUrl" class="chat-file-preview__audio">
      <audio :src="previewUrl" controls />
    </div>
    <div v-else class="chat-file-preview__icon-wrap">
      <component :is="KindIcon" :size="28" />
    </div>

    <div class="chat-file-preview__meta">
      <p class="chat-file-preview__name">{{ file.name }}</p>
      <p class="chat-file-preview__sub">
        {{ fileKindLabel(file.type, file.name) }} · {{ formatFileSize(file.size) }}
      </p>
    </div>

    <button type="button" class="chat-file-preview__remove" title="Quitar" @click="emit('remove')">
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
.chat-file-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ql-chat-border, rgba(9, 30, 66, 0.12));
  background: var(--ql-chat-bg, #f4f7fb);
}

.chat-file-preview__thumb {
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #e8ecf1;
}

.chat-file-preview__thumb img,
.chat-file-preview__thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-file-preview__audio {
  flex-shrink: 0;
  max-width: 10rem;
}

.chat-file-preview__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  color: var(--ql-chat-primary, #2d7eb8);
  background: rgba(45, 126, 184, 0.12);
}

.chat-file-preview__meta {
  min-width: 0;
  flex: 1;
}

.chat-file-preview__name {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ql-chat-ink, #172b4d);
}

.chat-file-preview__sub {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: var(--ql-chat-muted, #626f86);
}

.chat-file-preview__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 999px;
  color: var(--ql-chat-muted, #626f86);
  transition: background 0.12s ease, color 0.12s ease;
}

.chat-file-preview__remove:hover {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
}
</style>
