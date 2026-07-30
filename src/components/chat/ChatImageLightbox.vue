<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { X, Download } from '@lucide/vue'
import { useChatFilePreview } from '@/composables/useChatFilePreview'
import { fileKindIcon, fileKindLabel, formatFileSize } from '@/utils/chatFilePreview'

const { open, file, close, downloadCurrent } = useChatFilePreview()

const KindIcon = computed(() => {
  if (!file.value) return null
  return fileKindIcon(file.value.type, file.value.name)
})

const kindLabel = computed(() => {
  if (!file.value) return ''
  return fileKindLabel(file.value.type, file.value.name)
})

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (isOpen) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && file"
        class="chat-file-preview"
        role="dialog"
        aria-modal="true"
        :aria-label="file.name"
      >
        <div class="chat-file-preview__backdrop" @click="close" />

        <header class="chat-file-preview__toolbar">
          <div class="chat-file-preview__title">
            <p class="chat-file-preview__name">{{ file.name }}</p>
            <p v-if="file.size" class="chat-file-preview__sub">
              {{ kindLabel }} · {{ formatFileSize(file.size) }}
            </p>
          </div>
          <div class="chat-file-preview__actions">
            <button
              type="button"
              class="chat-file-preview__btn"
              title="Descargar"
              @click="downloadCurrent"
            >
              <Download :size="18" />
            </button>
            <button
              type="button"
              class="chat-file-preview__btn"
              title="Cerrar"
              @click="close"
            >
              <X :size="18" />
            </button>
          </div>
        </header>

        <div
          class="chat-file-preview__stage"
          :class="`chat-file-preview__stage--${file.kind}`"
          @click="file.kind === 'image' ? close() : undefined"
        >
          <img
            v-if="file.kind === 'image'"
            :src="file.url"
            :alt="file.name"
            class="chat-file-preview__img"
            @click.stop
          />

          <iframe
            v-else-if="file.kind === 'pdf'"
            :src="file.url"
            class="chat-file-preview__pdf"
            :title="file.name"
          />

          <video
            v-else-if="file.kind === 'video'"
            :src="file.url"
            class="chat-file-preview__video"
            controls
            autoplay
          />

          <div v-else class="chat-file-preview__doc" @click.stop>
            <span class="chat-file-preview__doc-icon">
              <component :is="KindIcon" :size="40" />
            </span>
            <p class="chat-file-preview__doc-name">{{ file.name }}</p>
            <p class="chat-file-preview__doc-meta">
              {{ kindLabel }}
              <template v-if="file.size"> · {{ formatFileSize(file.size) }}</template>
            </p>
            <p class="chat-file-preview__doc-hint">
              Vista previa no disponible para este tipo de archivo.
            </p>
            <button type="button" class="chat-file-preview__download-btn" @click="downloadCurrent">
              <Download :size="16" />
              Descargar archivo
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-file-preview {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.chat-file-preview__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(11, 20, 26, 0.92);
  backdrop-filter: blur(4px);
}

.chat-file-preview__toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(26, 43, 74, 0.95) 0%, rgba(26, 43, 74, 0.7) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-file-preview__title {
  min-width: 0;
}

.chat-file-preview__name {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
}

.chat-file-preview__sub {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  opacity: 0.7;
}

.chat-file-preview__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.chat-file-preview__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.12s ease;
}

.chat-file-preview__btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.chat-file-preview__stage {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 1rem;
}

.chat-file-preview__stage--image {
  cursor: zoom-out;
}

.chat-file-preview__stage--pdf {
  padding: 0;
  align-items: stretch;
}

.chat-file-preview__img {
  max-width: min(96vw, 56rem);
  max-height: calc(100vh - 5rem);
  object-fit: contain;
  border-radius: 0.375rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  user-select: none;
}

.chat-file-preview__pdf {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.chat-file-preview__video {
  max-width: min(96vw, 56rem);
  max-height: calc(100vh - 5rem);
  border-radius: 0.375rem;
  background: #000;
}

.chat-file-preview__doc {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 22rem;
  padding: 2rem 1.5rem;
  text-align: center;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-file-preview__doc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  margin-bottom: 1rem;
  border-radius: 1rem;
  color: var(--ql-chat-primary, #5bbce4);
  background: rgba(91, 188, 228, 0.15);
}

.chat-file-preview__doc-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  word-break: break-word;
}

.chat-file-preview__doc-meta {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  opacity: 0.7;
}

.chat-file-preview__doc-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  opacity: 0.55;
  line-height: 1.45;
}

.chat-file-preview__download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #5bbce4 0%, #2d7eb8 100%);
  transition: opacity 0.12s ease;
}

.chat-file-preview__download-btn:hover {
  opacity: 0.92;
}
</style>
