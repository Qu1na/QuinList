<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, FolderOpen } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDateTime } from '@/utils/permissions'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { openAttachment, downloadAttachment } from '@/services/storage'
import FileExplorerItem from '@/components/projects/shared/FileExplorerItem.vue'
import FileExplorerDesktop from '@/components/projects/shared/FileExplorerDesktop.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const search = ref('')
const sourceFilter = ref<'all' | 'Tarea' | 'Documento' | 'Chat'>('all')

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
  chat: allFiles.value.filter((f) => f.source === 'Chat').length,
  images: allFiles.value.filter((f) => f.type.startsWith('image/')).length,
}))

function userName(id: string) {
  return resolveUser(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h2 class="project-page-title">Archivos del proyecto</h2>
      <p class="project-page-sub">Centro de archivos · explorador tipo escritorio</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div class="drive-stat">
        <p class="drive-stat__value">{{ stats.total }}</p>
        <p class="drive-stat__label">Total</p>
      </div>
      <div class="drive-stat">
        <p class="drive-stat__value">{{ stats.tasks }}</p>
        <p class="drive-stat__label">Desde tareas</p>
      </div>
      <div class="drive-stat">
        <p class="drive-stat__value">{{ stats.docs }}</p>
        <p class="drive-stat__label">Documentación</p>
      </div>
      <div class="drive-stat">
        <p class="drive-stat__value">{{ stats.chat }}</p>
        <p class="drive-stat__label">Desde chat</p>
      </div>
      <div class="drive-stat">
        <p class="drive-stat__value">{{ stats.images }}</p>
        <p class="drive-stat__label">Imágenes</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-[200px] flex-1">
        <Search :size="16" class="absolute top-1/2 left-3 -translate-y-1/2 text-[#8e8e93]" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar archivos..."
          class="project-create-modal__input py-2 pl-9"
        />
      </div>
      <select v-model="sourceFilter" class="project-create-modal__input w-auto min-w-[160px]">
        <option value="all">Todas las fuentes</option>
        <option value="Tarea">Tareas</option>
        <option value="Documento">Documentos</option>
        <option value="Chat">Chat</option>
      </select>
    </div>

    <FileExplorerDesktop
      :empty="!filtered.length"
      empty-title="No hay archivos"
      empty-hint="Los archivos adjuntos en tareas, documentos y chat aparecerán aquí automáticamente."
    >
      <div class="fx-grid">
        <FileExplorerItem
          v-for="file in filtered"
          :key="file.id"
          :name="file.name"
          :type="file.type"
          :attachment="file"
          :size="file.size"
          :subtitle="`${file.source} · ${userName(file.uploadedBy)}`"
          @click="openAttachment(file)"
          @open="openAttachment(file)"
          @download="downloadAttachment(file)"
        />
      </div>
      <template #empty-icon>
        <FolderOpen :size="52" class="text-[#c7c7cc]" />
      </template>
    </FileExplorerDesktop>

    <p v-if="filtered.length" class="text-center text-xs text-[#8e8e93]">
      {{ filtered.length }} archivo{{ filtered.length === 1 ? '' : 's' }}
      · Clic para abrir · Pasa el cursor para descargar
    </p>
  </div>
</template>

<style scoped>
.drive-stat {
  border-radius: 0.875rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  padding: 1.1rem 1.25rem;
  text-align: center;
}

.drive-stat__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d7eb8;
  line-height: 1.1;
}

.drive-stat__label {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #626f86;
}
</style>
