<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectNote } from '@/types/projects'
import { paletteForNote, noteRotation } from '@/utils/projectNotes'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import RelativeTime from '@/components/ui/RelativeTime.vue'

const props = defineProps<{
  note: ProjectNote
  authorName: string
}>()

defineEmits<{
  edit: []
  delete: []
}>()

const palette = computed(() => paletteForNote(props.note))
const rotation = computed(() => noteRotation(props.note))
const curled = computed(() => palette.value.curled ?? false)
</script>

<template>
  <article
    class="sticky-note group relative flex min-h-[200px] flex-col p-5 pt-8"
    :class="[`sticky-note--${note.style}`, { 'sticky-note--curled': curled }]"
    :style="{
      backgroundColor: note.color,
      transform: `rotate(${rotation}deg)`,
    }"
  >
    <!-- Pins -->
    <span v-if="note.style === 'pin-red'" class="sticky-note__pin sticky-note__pin--left" aria-hidden="true" />
    <span v-if="note.style === 'pin-red'" class="sticky-note__pin sticky-note__pin--right" aria-hidden="true" />
    <span v-if="note.style === 'pin-single'" class="sticky-note__pin sticky-note__pin--center" aria-hidden="true" />

    <!-- Tape -->
    <span
      v-if="note.style.startsWith('tape-')"
      class="sticky-note__tape"
      :class="`sticky-note__tape--${note.style.replace('tape-', '')}`"
      aria-hidden="true"
    />

    <div class="sticky-note__actions">
      <button type="button" class="sticky-note__action" title="Editar" @click="$emit('edit')">✎</button>
      <button type="button" class="sticky-note__action sticky-note__action--danger" title="Eliminar" @click="$emit('delete')">
        ×
      </button>
    </div>

    <h3 v-if="note.title" class="sticky-note__title">{{ note.title }}</h3>
    <p v-if="note.content" class="sticky-note__content">{{ note.content }}</p>
    <p v-else class="sticky-note__content sticky-note__content--empty">Sin contenido</p>

    <footer class="sticky-note__footer">
      <UserAvatar v-if="note.createdBy" :user-id="note.createdBy" size="sm" />
      <div class="min-w-0 flex-1">
        <p class="sticky-note__author">{{ authorName }}</p>
        <RelativeTime :iso="note.updatedAt" class="sticky-note__time" />
      </div>
    </footer>
  </article>
</template>

<style scoped>
.sticky-note {
  border-radius: 2px;
  box-shadow:
    2px 3px 8px rgba(23, 43, 77, 0.12),
    0 1px 2px rgba(23, 43, 77, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.sticky-note:hover {
  box-shadow:
    4px 6px 16px rgba(23, 43, 77, 0.16),
    0 2px 4px rgba(23, 43, 77, 0.1);
  z-index: 2;
}

.sticky-note--curled::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(
    135deg,
    transparent 45%,
    rgba(23, 43, 77, 0.06) 45%,
    rgba(23, 43, 77, 0.12) 55%,
    rgba(255, 255, 255, 0.5) 55%
  );
  border-bottom-right-radius: 2px;
  pointer-events: none;
}

.sticky-note__pin {
  position: absolute;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a80, #e53935 55%, #b71c1c);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.25);
  z-index: 2;
}

.sticky-note__pin--left {
  left: 14px;
}

.sticky-note__pin--right {
  right: 14px;
  background: radial-gradient(circle at 35% 30%, #90caf9, #1e88e5 55%, #1565c0);
}

.sticky-note__pin--center {
  left: 50%;
  transform: translateX(-50%);
}

.sticky-note__tape {
  position: absolute;
  top: -6px;
  height: 22px;
  border-radius: 1px;
  opacity: 0.85;
  z-index: 2;
}

.sticky-note__tape--beige {
  left: 12%;
  right: 12%;
  background: linear-gradient(180deg, rgba(245, 230, 200, 0.95), rgba(220, 200, 160, 0.9));
  transform: rotate(-2deg);
}

.sticky-note--tape-beige::before {
  content: '';
  position: absolute;
  top: -4px;
  right: 8%;
  width: 36%;
  height: 18px;
  background: linear-gradient(180deg, rgba(245, 230, 200, 0.9), rgba(220, 200, 160, 0.85));
  transform: rotate(8deg);
  border-radius: 1px;
  opacity: 0.8;
  z-index: 2;
}

.sticky-note__tape--blue {
  left: 28%;
  right: 28%;
  height: 20px;
  background: linear-gradient(180deg, rgba(144, 202, 249, 0.95), rgba(66, 165, 245, 0.85));
}

.sticky-note__tape--green {
  left: 38%;
  right: 38%;
  height: 24px;
  background: linear-gradient(180deg, rgba(165, 214, 167, 0.95), rgba(102, 187, 106, 0.85));
  transform: rotate(1deg);
}

.sticky-note__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 3;
}

.sticky-note:hover .sticky-note__actions,
.sticky-note:focus-within .sticky-note__actions {
  opacity: 1;
}

.sticky-note__action {
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  font-weight: 600;
  color: #172b4d;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: background 0.15s ease;
}

.sticky-note__action:hover {
  background: #fff;
}

.sticky-note__action--danger:hover {
  color: #e53935;
}

.sticky-note__title {
  margin: 0 0 0.5rem;
  font-family: 'Segoe Print', 'Comic Sans MS', cursive, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
  color: #172b4d;
  word-break: break-word;
}

.sticky-note__content {
  flex: 1;
  margin: 0;
  font-family: 'Segoe Print', 'Comic Sans MS', cursive, sans-serif;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #2c3e5a;
  white-space: pre-wrap;
  word-break: break-word;
}

.sticky-note__content--empty {
  color: rgba(44, 62, 90, 0.45);
  font-style: italic;
}

.sticky-note__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(23, 43, 77, 0.12);
}

.sticky-note__author {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: #172b4d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticky-note__time {
  font-size: 0.65rem;
  color: #626f86;
}
</style>
