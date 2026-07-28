<script setup lang="ts">
import { computed, ref } from 'vue'
import { FolderPlus, Folder, FileText, Upload, ChevronRight, Home, Download, Eye } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/permissions'
import { openAttachment, downloadAttachment } from '@/services/storage'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()

const currentFolderId = ref<string | null>(null)
const showNewFolder = ref(false)
const showNewDoc = ref(false)
const newFolderName = ref('')
const docForm = ref({ title: '', content: '' })
const uploading = ref(false)

const folders = computed(() => projectsStore.getProjectFolders(props.projectId))
const documents = computed(() => projectsStore.getProjectDocuments(props.projectId))

const childFolders = computed(() =>
  folders.value.filter((f) => f.parentId === currentFolderId.value),
)

const folderDocs = computed(() =>
  documents.value.filter((d) => (d.folderId ?? null) === currentFolderId.value),
)

const breadcrumbs = computed(() => {
  const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Documentación' }]
  if (!currentFolderId.value) return crumbs
  let id: string | null = currentFolderId.value
  const chain: { id: string; name: string }[] = []
  while (id) {
    const f = folders.value.find((x) => x.id === id)
    if (!f) break
    chain.unshift({ id: f.id, name: f.name })
    id = f.parentId
  }
  return [...crumbs, ...chain]
})

const inputClass = 'w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]'

async function createFolder() {
  if (!newFolderName.value.trim()) return
  await projectsStore.createFolder(props.projectId, newFolderName.value, currentFolderId.value)
  newFolderName.value = ''
  showNewFolder.value = false
}

async function createDoc() {
  if (!docForm.value.title.trim()) return
  await projectsStore.addDocument(
    props.projectId,
    docForm.value.title,
    docForm.value.content,
    currentFolderId.value,
  )
  docForm.value = { title: '', content: '' }
  showNewDoc.value = false
}

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const doc = await projectsStore.addDocument(props.projectId, file.name, '', currentFolderId.value)
    if (doc) await projectsStore.addDocumentFile(props.projectId, doc.id, file)
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

function userName(id: string | null) {
  if (!id) return '—'
  return auth.getUserById(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Breadcrumb -->
    <div class="flex flex-wrap items-center gap-1 text-sm">
      <button
        v-for="(crumb, i) in breadcrumbs"
        :key="crumb.id ?? 'root'"
        class="flex items-center gap-1 text-[#626f86] hover:text-[#172b4d]"
        @click="currentFolderId = crumb.id"
      >
        <Home v-if="i === 0" :size="14" />
        <ChevronRight v-if="i > 0" :size="12" class="text-[#091e4240]" />
        {{ crumb.name }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="flex items-center gap-1 rounded-lg border border-[#091e4229] px-3 py-2 text-sm text-[#172b4d] hover:bg-[#091e420a]"
        @click="showNewFolder = true"
      >
        <FolderPlus :size="14" />
        Nueva carpeta
      </button>
      <button
        class="flex items-center gap-1 rounded-lg bg-[#0c66e4] px-3 py-2 text-sm text-white"
        @click="showNewDoc = true"
      >
        <FileText :size="14" />
        Nuevo documento
      </button>
      <label class="flex cursor-pointer items-center gap-1 rounded-lg border border-[#091e4229] px-3 py-2 text-sm text-[#172b4d]">
        <Upload :size="14" />
        Subir archivo
        <input type="file" class="hidden" :disabled="uploading" @change="onUpload" />
      </label>
    </div>

    <!-- Grid tipo drive -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="folder in childFolders"
        :key="folder.id"
        class="flex items-center gap-3 rounded-xl border border-[#091e4214] bg-white p-4 text-left transition hover:border-[#0c66e4]/30 hover:shadow-sm"
        @click="currentFolderId = folder.id"
      >
        <Folder :size="28" class="shrink-0 text-[#0c66e4]" />
        <div class="min-w-0">
          <p class="truncate font-medium text-[#172b4d]">{{ folder.name }}</p>
          <p class="text-[10px] text-[#626f86]">{{ formatDateTime(folder.createdAt) }}</p>
        </div>
      </button>

      <div
        v-for="doc in folderDocs"
        :key="doc.id"
        class="rounded-xl border border-[#091e4214] bg-white p-4"
      >
        <div class="mb-2 flex items-start gap-2">
          <FileText :size="20" class="shrink-0 text-[#44546f]" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-[#172b4d]">{{ doc.title }}</p>
            <p class="text-[10px] text-[#626f86]">
              {{ userName(doc.createdBy) }} · {{ formatDateTime(doc.createdAt) }}
            </p>
          </div>
        </div>
        <p v-if="doc.content" class="mb-2 line-clamp-2 text-xs text-[#626f86]">{{ doc.content }}</p>
        <div v-for="att in doc.attachments" :key="att.id" class="flex gap-2">
          <button class="flex items-center gap-1 text-xs text-[#0c66e4] hover:underline" @click="openAttachment(att)">
            <Eye :size="12" /> Ver
          </button>
          <button class="flex items-center gap-1 text-xs text-[#626f86] hover:underline" @click="downloadAttachment(att)">
            <Download :size="12" /> Descargar
          </button>
        </div>
      </div>
    </div>

    <p v-if="!childFolders.length && !folderDocs.length" class="py-12 text-center text-sm text-[#626f86]">
      Esta carpeta está vacía. Crea una carpeta o sube documentación.
    </p>

    <ProjectModal v-if="showNewFolder" title="Nueva carpeta" size="sm" @close="showNewFolder = false">
      <input v-model="newFolderName" placeholder="Nombre de la carpeta" :class="inputClass" @keyup.enter="createFolder" />
      <template #footer>
        <button class="px-3 py-1.5 text-sm" @click="showNewFolder = false">Cancelar</button>
        <button class="rounded-lg bg-[#0c66e4] px-4 py-1.5 text-sm text-white" @click="createFolder">Crear</button>
      </template>
    </ProjectModal>

    <ProjectModal v-if="showNewDoc" title="Nuevo documento" @close="showNewDoc = false">
      <div class="space-y-3">
        <input v-model="docForm.title" placeholder="Título" :class="inputClass" />
        <textarea v-model="docForm.content" rows="4" placeholder="Contenido (opcional)" :class="inputClass" />
      </div>
      <template #footer>
        <button class="px-3 py-1.5 text-sm" @click="showNewDoc = false">Cancelar</button>
        <button class="rounded-lg bg-[#0c66e4] px-4 py-1.5 text-sm text-white" @click="createDoc">Guardar</button>
      </template>
    </ProjectModal>
  </div>
</template>
