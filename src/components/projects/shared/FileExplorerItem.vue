<script setup lang="ts">
import { computed } from 'vue'
import { Download, ExternalLink, Folder } from '@lucide/vue'
import type { Attachment } from '@/types'
import { getAttachmentPublicUrl } from '@/services/storage'
import {
  getFileTypeInfo,
  getFolderTypeInfo,
  isImageType,
  isVideoType,
  formatFileSize,
} from '@/utils/fileTypes'

const props = withDefaults(
  defineProps<{
    name: string
    type?: string
    attachment?: Attachment | null
    subtitle?: string
    size?: number
    isFolder?: boolean
    showActions?: boolean
  }>(),
  { type: '', showActions: true },
)

const emit = defineEmits<{
  click: []
  open: []
  download: []
}>()

const typeInfo = computed(() =>
  props.isFolder ? getFolderTypeInfo() : getFileTypeInfo(props.type, props.name),
)

const previewUrl = computed(() => {
  if (!props.attachment) return ''
  return getAttachmentPublicUrl(props.attachment)
})

const showImagePreview = computed(
  () => !props.isFolder && isImageType(props.type, props.name) && !!previewUrl.value,
)

const showVideoPreview = computed(
  () => !props.isFolder && isVideoType(props.type, props.name) && !!previewUrl.value,
)

function onOpen(e: Event) {
  e.stopPropagation()
  emit('open')
}

function onDownload(e: Event) {
  e.stopPropagation()
  emit('download')
}
</script>

<template>
  <button
    type="button"
    class="fx-item"
    :class="{ 'fx-item--folder': isFolder }"
    :title="name"
    @click="emit('click')"
  >
    <div class="fx-item__thumb" :style="{ background: showImagePreview || showVideoPreview ? '#fff' : typeInfo.bg }">
      <img
        v-if="showImagePreview"
        :src="previewUrl"
        :alt="name"
        class="fx-item__preview"
        loading="lazy"
      />
      <video
        v-else-if="showVideoPreview"
        :src="`${previewUrl}#t=0.5`"
        class="fx-item__preview"
        muted
        preload="metadata"
        playsinline
      />
      <Folder v-else-if="isFolder" :size="48" :style="{ color: typeInfo.color }" />
      <component v-else :is="typeInfo.icon" :size="40" :style="{ color: typeInfo.color }" />

      <div v-if="showActions && !isFolder" class="fx-item__actions">
        <button type="button" class="fx-item__action" title="Abrir" @click="onOpen">
          <ExternalLink :size="16" />
        </button>
        <button type="button" class="fx-item__action" title="Descargar" @click="onDownload">
          <Download :size="16" />
        </button>
      </div>
    </div>

    <p class="fx-item__name">{{ name }}</p>
    <p v-if="subtitle" class="fx-item__meta">{{ subtitle }}</p>
    <p v-else-if="size" class="fx-item__meta">{{ formatFileSize(size) }} · {{ typeInfo.label }}</p>
    <p v-else-if="!isFolder" class="fx-item__meta">{{ typeInfo.label }}</p>
  </button>
</template>

<style scoped>
.fx-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0.65rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  background: transparent;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.fx-item:hover {
  background: rgba(91, 188, 228, 0.1);
  border-color: rgba(91, 188, 228, 0.2);
}

.fx-item:active {
  transform: scale(0.97);
}

.fx-item__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 7.25rem;
  height: 7.25rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.fx-item--folder .fx-item__thumb {
  background: transparent !important;
  box-shadow: none;
}

.fx-item__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.fx-item__actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: rgba(23, 43, 77, 0.55);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.fx-item:hover .fx-item__actions {
  opacity: 1;
}

.fx-item__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  color: #172b4d;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}

.fx-item__action:hover {
  background: #fff;
  transform: scale(1.08);
}

.fx-item__name {
  max-width: 7.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  color: #172b4d;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.fx-item__meta {
  margin-top: 0.2rem;
  max-width: 7.5rem;
  font-size: 0.75rem;
  line-height: 1.3;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
