<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Download, ExternalLink } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/permissions'
import { openAttachment, downloadAttachment } from '@/services/storage'
import AttachmentMedia from '@/components/board/AttachmentMedia.vue'

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

function userName(id: string) {
  return auth.getUserById(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="rounded-xl border border-[#091e4214] bg-white p-6">
    <h2 class="mb-4 text-lg font-semibold text-[#172b4d]">Centro de archivos</h2>
    <p class="mb-4 text-sm text-[#626f86]">
      Todos los archivos adjuntos del proyecto, con búsqueda y filtros.
    </p>

    <div class="mb-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <Search :size="16" class="absolute top-2.5 left-3 text-[#626f86]" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar archivos..."
          class="w-full rounded-lg border border-[#091e4229] py-2 pr-3 pl-9 text-sm outline-none focus:border-[#0c66e4]"
        />
      </div>
      <select
        v-model="sourceFilter"
        class="rounded-lg border border-[#091e4229] px-3 py-2 text-sm"
      >
        <option value="all">Todas las fuentes</option>
        <option value="Tarea">Tareas</option>
        <option value="Documento">Documentos</option>
      </select>
    </div>

    <div v-if="filtered.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="file in filtered"
        :key="file.id"
        class="rounded-lg border border-[#091e4214] p-3"
      >
        <AttachmentMedia
          v-if="file.type.startsWith('image/')"
          :attachment="file"
          preview-only
          image-class="mb-2 h-32 w-full rounded object-cover"
        />
        <p class="truncate text-sm font-medium text-[#172b4d]">{{ file.name }}</p>
        <p class="text-xs text-[#626f86]">{{ file.source }} · {{ userName(file.uploadedBy) }}</p>
        <p class="text-xs text-[#626f86]">{{ formatDateTime(file.uploadedAt) }}</p>
        <div class="mt-2 flex gap-2">
          <button
            class="flex items-center gap-1 text-xs text-[#0c66e4] hover:underline"
            @click="openAttachment(file)"
          >
            <ExternalLink :size="12" />
            Ver
          </button>
          <button
            class="flex items-center gap-1 text-xs text-[#626f86] hover:underline"
            @click="downloadAttachment(file)"
          >
            <Download :size="12" />
            Descargar
          </button>
        </div>
      </div>
    </div>
    <p v-else class="py-8 text-center text-sm text-[#626f86]">No hay archivos adjuntos.</p>
  </div>
</template>
