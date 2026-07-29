<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MessageSquare,
  Send,
  Trash2,
  Paperclip,
  Download,
  ExternalLink,
  FileImage,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { formatDateTime } from '@/utils/permissions'
import { openAttachment, downloadAttachment, getAttachmentPublicUrl } from '@/services/storage'
import {
  formatFileSize,
  getFileTypeInfo,
  isImageType,
} from '@/utils/fileTypes'
import type { DeliverableLogEntry } from '@/types/projects'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const props = defineProps<{
  deliverableId: string
}>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const { resolveUser, setPresenceActivity } = useProjectUsers()

const draft = ref('')
const uploading = ref(false)

const deliverable = computed(() =>
  projectsStore.deliverables.find((d) => d.id === props.deliverableId) ?? null,
)

const fileEntries = computed(() => {
  const seen = new Set<string>()
  const items: DeliverableLogEntry[] = []

  for (const entry of deliverable.value?.log ?? []) {
    if (entry.attachment && !seen.has(entry.attachment.id)) {
      seen.add(entry.attachment.id)
      items.push(entry)
    }
  }

  for (const att of deliverable.value?.attachments ?? []) {
    if (!seen.has(att.id)) {
      seen.add(att.id)
      items.push({
        id: att.id,
        text: '',
        uploadedBy: att.uploadedBy,
        createdAt: att.uploadedAt,
        attachment: att,
      })
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
})

const timeline = computed(() =>
  [...(deliverable.value?.log ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  ),
)

function commentText(entry: DeliverableLogEntry) {
  const text = entry.text.trim()
  if (!text) return ''
  if (entry.attachment && /^Archivo adjunto:/i.test(text)) return ''
  return text
}

function isImageAttachment(entry: DeliverableLogEntry) {
  const att = entry.attachment
  if (!att) return false
  return isImageType(att.type, att.name)
}

function previewUrl(entry: DeliverableLogEntry) {
  if (!entry.attachment) return ''
  return getAttachmentPublicUrl(entry.attachment)
}

function fileInfo(entry: DeliverableLogEntry) {
  const att = entry.attachment!
  return getFileTypeInfo(att.type, att.name)
}

function submit() {
  const text = draft.value.trim()
  if (!text) return
  projectsStore.addDeliverableComment(props.deliverableId, text)
  draft.value = ''
  void setPresenceActivity('online')
}

function remove(entryId: string) {
  projectsStore.deleteDeliverableComment(props.deliverableId, entryId)
}

async function onFileUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? [...input.files] : []
  if (!files.length) return

  uploading.value = true
  try {
    for (const file of files) {
      await projectsStore.addDeliverableAttachment(props.deliverableId, file)
    }
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function onFocus() {
  void setPresenceActivity('editing', 'Comentando entregable')
}

function onBlur() {
  void setPresenceActivity('online')
}
</script>

<template>
  <div class="deliverable-panel">
    <!-- Archivos adjuntos -->
    <section v-if="fileEntries.length" class="deliverable-files">
      <div class="deliverable-files__header">
        <FileImage :size="16" class="text-[#5bbce4]" />
        <span class="text-sm font-semibold text-[#172b4d]">
          Archivos adjuntos
        </span>
        <span class="deliverable-files__count">{{ fileEntries.length }}</span>
      </div>

      <div class="deliverable-files__grid">
        <article
          v-for="entry in fileEntries"
          :key="entry.id"
          class="file-card"
          :class="{ 'file-card--image': isImageAttachment(entry) }"
        >
          <button
            type="button"
            class="file-card__preview"
            :title="entry.attachment?.name"
            @click="entry.attachment && openAttachment(entry.attachment)"
          >
            <img
              v-if="isImageAttachment(entry)"
              :src="previewUrl(entry)"
              :alt="entry.attachment?.name"
              class="file-card__image"
              loading="lazy"
            />
            <div
              v-else
              class="file-card__icon"
              :style="{ background: fileInfo(entry).bg, color: fileInfo(entry).color }"
            >
              <component :is="fileInfo(entry).icon" :size="28" />
            </div>
          </button>

          <div class="file-card__body">
            <p class="file-card__name" :title="entry.attachment?.name">
              {{ entry.attachment?.name }}
            </p>
            <p class="file-card__meta">
              {{ fileInfo(entry).label }}
              <span v-if="entry.attachment?.size"> · {{ formatFileSize(entry.attachment.size) }}</span>
            </p>
            <p class="file-card__who">
              {{ resolveUser(entry.uploadedBy)?.name ?? 'Usuario' }}
              · {{ formatDateTime(entry.createdAt) }}
            </p>
            <div class="file-card__actions">
              <button
                type="button"
                class="file-card__btn"
                @click="entry.attachment && openAttachment(entry.attachment)"
              >
                <ExternalLink :size="13" />
                Abrir
              </button>
              <button
                type="button"
                class="file-card__btn"
                @click="entry.attachment && downloadAttachment(entry.attachment)"
              >
                <Download :size="13" />
                Descargar
              </button>
              <button
                v-if="entry.uploadedBy === auth.currentUserId"
                type="button"
                class="file-card__btn file-card__btn--danger"
                title="Eliminar"
                @click="remove(entry.id)"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Comentarios -->
    <section class="task-comments">
      <div class="task-comments__header">
        <MessageSquare :size="16" class="text-[#5bbce4]" />
        <span class="text-sm font-semibold text-[#172b4d]">Comentarios del equipo</span>
        <span v-if="timeline.length" class="task-comments__count">{{ timeline.length }}</span>
        <label class="task-comments__upload ml-auto cursor-pointer" title="Adjuntar archivos">
          <Paperclip :size="16" />
          <input
            type="file"
            class="hidden"
            multiple
            :disabled="uploading"
            @change="onFileUpload"
          />
        </label>
      </div>

      <ul v-if="timeline.length" class="task-comments__list scroll-thin">
        <li v-for="entry in timeline" :key="entry.id" class="task-comments__item">
          <UserAvatar :user-id="entry.uploadedBy ?? ''" size="sm" />
          <div class="task-comments__body">
            <div class="task-comments__meta">
              <span class="font-medium text-[#172b4d]">
                {{ resolveUser(entry.uploadedBy)?.name ?? 'Usuario' }}
              </span>
              <time class="text-xs text-[#626f86]">{{ formatDateTime(entry.createdAt) }}</time>
              <button
                v-if="entry.uploadedBy === auth.currentUserId && !entry.attachment"
                type="button"
                class="task-comments__delete"
                title="Eliminar"
                @click="remove(entry.id)"
              >
                <Trash2 :size="12" />
              </button>
            </div>

            <p v-if="commentText(entry)" class="task-comments__text">{{ commentText(entry) }}</p>

            <div v-if="entry.attachment" class="timeline-attachment">
              <button
                type="button"
                class="timeline-attachment__thumb"
                @click="openAttachment(entry.attachment)"
              >
                <img
                  v-if="isImageAttachment(entry)"
                  :src="previewUrl(entry)"
                  :alt="entry.attachment.name"
                  loading="lazy"
                />
                <span
                  v-else
                  class="timeline-attachment__icon"
                  :style="{ background: fileInfo(entry).bg, color: fileInfo(entry).color }"
                >
                  <component :is="fileInfo(entry).icon" :size="18" />
                </span>
              </button>
              <div class="timeline-attachment__info">
                <p class="timeline-attachment__name">{{ entry.attachment.name }}</p>
                <p class="timeline-attachment__meta">
                  {{ fileInfo(entry).label }}
                  <span v-if="entry.attachment.size"> · {{ formatFileSize(entry.attachment.size) }}</span>
                </p>
                <div class="timeline-attachment__actions">
                  <button type="button" class="project-link-btn text-xs" @click="openAttachment(entry.attachment)">
                    Abrir
                  </button>
                  <button type="button" class="project-link-btn text-xs" @click="downloadAttachment(entry.attachment)">
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <p v-else class="task-comments__empty">Sin comentarios ni archivos aún.</p>

      <form class="task-comments__form" @submit.prevent="submit">
        <textarea
          v-model="draft"
          rows="2"
          class="project-create-modal__input resize-none"
          placeholder="Comentario para el equipo..."
          @focus="onFocus"
          @blur="onBlur"
        />
        <button
          type="submit"
          class="btn-brand inline-flex items-center gap-1.5 self-end"
          :disabled="!draft.trim()"
        >
          <Send :size="14" />
          Enviar
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.deliverable-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deliverable-files {
  border-radius: 0.875rem;
  border: 1px solid #ebebed;
  background: #fff;
  padding: 1rem;
}

.deliverable-files__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.deliverable-files__count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #626f86;
  background: #ebebed;
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
}

.deliverable-files__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
}

.file-card {
  display: flex;
  gap: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #ebebed;
  background: #fafafb;
  padding: 0.625rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.file-card:hover {
  border-color: #d1d9e6;
  box-shadow: 0 2px 8px rgb(15 23 42 / 6%);
}

.file-card--image .file-card__preview {
  width: 4.5rem;
  height: 4.5rem;
}

.file-card__preview {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid rgb(0 0 0 / 6%);
  background: #fff;
  cursor: pointer;
  padding: 0;
}

.file-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-card__icon {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.file-card__body {
  min-width: 0;
  flex: 1;
}

.file-card__name {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #172b4d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card__meta,
.file-card__who {
  margin: 0.2rem 0 0;
  font-size: 0.6875rem;
  color: #626f86;
}

.file-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.file-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #2d7eb8;
  transition: background 0.15s ease;
}

.file-card__btn:hover {
  background: #eef6fc;
}

.file-card__btn--danger {
  color: #dc2626;
  border-color: #fecaca;
}

.file-card__btn--danger:hover {
  background: #fef2f2;
}

.timeline-attachment {
  display: flex;
  gap: 0.625rem;
  margin-top: 0.5rem;
  max-width: 20rem;
  border-radius: 0.625rem;
  border: 1px solid #ebebed;
  background: #fff;
  padding: 0.5rem;
}

.timeline-attachment__thumb {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border-radius: 0.375rem;
  border: none;
  padding: 0;
  cursor: pointer;
  background: #f5f5f7;
}

.timeline-attachment__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.timeline-attachment__icon {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.timeline-attachment__info {
  min-width: 0;
  flex: 1;
}

.timeline-attachment__name {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #172b4d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-attachment__meta {
  margin: 0.15rem 0 0;
  font-size: 0.6875rem;
  color: #626f86;
}

.timeline-attachment__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.task-comments {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 0.875rem;
  border: 1px solid #ebebed;
  background: #fafafb;
  padding: 1rem;
}

.task-comments__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-comments__count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #626f86;
  background: #ebebed;
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
}

.task-comments__upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #2d7eb8;
  transition: background 0.15s ease;
}

.task-comments__upload:hover {
  background: #e8f4fc;
}

.task-comments__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 16rem;
  overflow-y: auto;
}

.task-comments__item {
  display: flex;
  gap: 0.625rem;
}

.task-comments__body {
  min-width: 0;
  flex: 1;
}

.task-comments__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  margin-bottom: 0.25rem;
}

.task-comments__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #44546f;
  white-space: pre-wrap;
}

.task-comments__delete {
  margin-left: auto;
  color: #626f86;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.task-comments__item:hover .task-comments__delete {
  opacity: 1;
}

.task-comments__delete:hover {
  color: #ef4444;
}

.task-comments__empty {
  margin: 0;
  font-size: 0.8125rem;
  color: #626f86;
}

.task-comments__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
