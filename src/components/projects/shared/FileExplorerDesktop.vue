<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from '@lucide/vue'

const props = defineProps<{
  empty?: boolean
  emptyTitle?: string
  emptyHint?: string
  enableDrop?: boolean
  dropLabel?: string
}>()

const emit = defineEmits<{
  'drop-files': [files: File[]]
}>()

const isDragging = ref(false)
let dragDepth = 0

function hasFilePayload(e: DragEvent): boolean {
  const types = e.dataTransfer?.types
  if (!types) return false
  return [...types].includes('Files')
}

function onDragEnter(e: DragEvent) {
  if (!props.enableDrop || !hasFilePayload(e)) return
  e.preventDefault()
  dragDepth++
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  if (!props.enableDrop) return
  e.preventDefault()
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragging.value = false
}

function onDragOver(e: DragEvent) {
  if (!props.enableDrop || !hasFilePayload(e)) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e: DragEvent) {
  if (!props.enableDrop) return
  e.preventDefault()
  dragDepth = 0
  isDragging.value = false
  const files = [...(e.dataTransfer?.files ?? [])]
  if (files.length) emit('drop-files', files)
}
</script>

<template>
  <div
    class="fx-desktop"
    :class="{ 'fx-desktop--dropping': isDragging }"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <div v-if="isDragging && enableDrop" class="fx-desktop__drop-overlay" aria-hidden="true">
      <Upload :size="36" class="text-[#2d7eb8]" />
      <p class="fx-desktop__drop-title">{{ dropLabel ?? 'Suelta los archivos aquí' }}</p>
      <p class="fx-desktop__drop-hint">Se subirán a la carpeta actual</p>
    </div>

    <slot v-if="!empty" />
    <div v-else class="fx-desktop__empty">
      <slot name="empty-icon" />
      <p class="fx-desktop__empty-title">{{ emptyTitle ?? 'Sin archivos' }}</p>
      <p v-if="emptyHint" class="fx-desktop__empty-hint">{{ emptyHint }}</p>
      <p v-if="enableDrop" class="fx-desktop__empty-drop">O arrastra archivos aquí para subirlos</p>
    </div>
  </div>
</template>

<style scoped>
.fx-desktop {
  position: relative;
  min-height: 20rem;
  border-radius: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.07);
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91, 188, 228, 0.06) 0%, transparent 60%),
    #f8f9fb;
  padding: 1.75rem 1.5rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.fx-desktop--dropping {
  border-color: #5bbce4;
  box-shadow:
    inset 0 0 0 2px rgba(91, 188, 228, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.fx-desktop__drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: inherit;
  background: rgba(232, 244, 252, 0.92);
  pointer-events: none;
}

.fx-desktop__drop-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: #172b4d;
}

.fx-desktop__drop-hint {
  font-size: 0.875rem;
  color: #626f86;
}

.fx-desktop__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  padding: 2rem 1rem;
  text-align: center;
}

.fx-desktop__empty-title {
  margin-top: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #172b4d;
}

.fx-desktop__empty-hint {
  margin-top: 0.35rem;
  max-width: 20rem;
  font-size: 0.9375rem;
  color: #626f86;
}

.fx-desktop__empty-drop {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d7eb8;
}
</style>

<style>
.fx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.5rem 0.75rem;
}

@media (min-width: 640px) {
  .fx-grid {
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: 0.65rem 1rem;
  }
}
</style>
