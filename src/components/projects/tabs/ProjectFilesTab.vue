<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Download, ExternalLink, FolderOpen, FileText, Image, File } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/permissions'
import { openAttachment, downloadAttachment } from '@/services/storage'
import AttachmentMedia from '@/components/board/AttachmentMedia.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()

const search = ref('')
const sourceFilter = ref<'all' | 'Tarea' | 'Documento'>('all')

const allFiles = computed(() => projectsStore.getProjectFiles(props.projectId))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allFiles.value.filter((f) => {
    if (sourceFilter.value !== 'all' && f.source !== sourceFilter.value) return false
    if (!q) return true
    return f.name.toLowerCase().includes(q) || f.source.toLowerCase().includes(q)
  })
})

const stats = computed(() => ({
  total: allFiles.value.length,
  tasks: allFiles.value.filter((f) => f.source === 'Tarea').length,
  docs: allFiles.value.filter((f) => f.source === 'Documento').length,
}))

function userName(id: string) {
  return auth.getUserById(id)?.name ?? 'Usuario'
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type.includes('pdf') || type.includes('document')) return FileText
  return File
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="project-page-title">Archivos del proyecto</h2>
      <p class="project-page-sub">
        Centro de archivos tipo Drive · {{ stats.total }} archivos en total
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Total</p>
        <p class="project-kpi__value">{{ stats.total }}</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Desde tareas</p>
        <p class="project-kpi__value">{{ stats.tasks }}</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__label">Documentación</p>
        <p class="project-kpi__value">{{ stats.docs }}</p>
      </div>
    </div>

    <div class="drive-toolbar">
      <div class="relative min-w-[240px] flex-1">
        <Search :size="18" class="absolute top-3 left-3 text-[#8e8e93]" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar archivos..."
          class="ql-input py-2.5 pr-3 pl-10"
        />
      </div>
      <select v-model="sourceFilter" class="ql-input w-auto min-w-[180px]">
        <option value="all">Todas las fuentes</option>
        <option value="Tarea">Tareas</option>
        <option value="Documento">Documentos</option>
      </select>
    </div>

    <div v-if="filtered.length" class="drive-grid">
      <div v-for="file in filtered" :key="file.id" class="drive-file-card">
        <AttachmentMedia
          v-if="file.type.startsWith('image/')"
          :attachment="file"
          preview-only
          image-class="mb-3 h-36 w-full rounded-xl object-cover"
        />
        <div
          v-else
          class="mb-3 flex h-36 items-center justify-center rounded-xl bg-[#f5f5f7]"
        >
          <component :is="fileIcon(file.type)" :size="40" class="text-[#5bbce4]" />
        </div>

        <p class="drive-file-card__name" :title="file.name">{{ file.name }}</p>
        <p class="drive-file-card__meta">{{ file.source }}</p>
        <div class="mt-2 flex items-center gap-2">
          <UserAvatar :user-id="file.uploadedBy" size="sm" />
          <span class="text-xs text-[#626f86]">{{ userName(file.uploadedBy) }}</span>
        </div>
        <p class="mt-1 text-xs text-[#8e8e93]">{{ formatDateTime(file.uploadedAt) }}</p>

        <div class="mt-3 flex gap-2">
          <button type="button" class="ql-btn ql-btn--ghost flex-1 text-sm" @click="openAttachment(file)">
            <ExternalLink :size="15" />
            Abrir
          </button>
          <button type="button" class="ql-btn ql-btn--primary flex-1 text-sm" @click="downloadAttachment(file)">
            <Download :size="15" />
            Descargar
          </button>
        </div>
      </div>
    </div>

    <div v-else class="project-card flex flex-col items-center justify-center py-16 text-center">
      <FolderOpen :size="48" class="mb-4 text-[#c7c7cc]" />
      <p class="text-base font-medium text-[#172b4d]">No hay archivos</p>
      <p class="mt-1 max-w-sm text-sm text-[#626f86]">
        Los archivos adjuntos a tareas y documentos aparecerán aquí automáticamente.
      </p>
    </div>
  </div>
</template>
