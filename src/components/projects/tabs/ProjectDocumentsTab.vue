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

const inputClass = 'ql-input'

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
  <div class="space-y-6">
    <div>
      <h2 class="project-page-title">Documentación</h2>
      <p class="project-page-sub">Carpetas y documentos del proyecto</p>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button
        v-for="(crumb, i) in breadcrumbs"
        :key="crumb.id ?? 'root'"
        class="flex items-center gap-1 font-medium text-[#2d7eb8] hover:text-[#f4845f]"
        @click="currentFolderId = crumb.id"
      >
        <Home v-if="i === 0" :size="14" />
        <ChevronRight v-if="i > 0" :size="12" class="text-[#091e4240]" />
        {{ crumb.name }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button type="button" class="ql-btn ql-btn--ghost" @click="showNewFolder = true">
        <FolderPlus :size="18" />
        Nueva carpeta
      </button>
      <button type="button" class="ql-btn ql-btn--primary" @click="showNewDoc = true">
        <FileText :size="18" />
        Nuevo documento
      </button>
      <label class="ql-btn ql-btn--ghost cursor-pointer">
        <Upload :size="18" />
        Subir archivo
        <input type="file" class="hidden" :disabled="uploading" @change="onUpload" />
      </label>
    </div>

    <div class="drive-grid">
      <button
        v-for="folder in childFolders"
        :key="folder.id"
        type="button"
        class="drive-file-card text-left"
        @click="currentFolderId = folder.id"
      >
        <Folder :size="36" class="text-[#5bbce4]" />
        <p class="drive-file-card__name">{{ folder.name }}</p>
        <p class="drive-file-card__meta">{{ formatDateTime(folder.createdAt) }}</p>
      </button>

      <div v-for="doc in folderDocs" :key="doc.id" class="drive-file-card">
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
        <div v-for="att in doc.attachments" :key="att.id" class="mt-2 flex gap-2">
          <button type="button" class="project-link-btn flex items-center gap-1" @click="openAttachment(att)">
            <Eye :size="14" /> Ver
          </button>
          <button type="button" class="project-link-btn flex items-center gap-1" @click="downloadAttachment(att)">
            <Download :size="14" /> Descargar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!childFolders.length && !folderDocs.length" class="project-card flex flex-col items-center py-16 text-center">
      <Folder :size="48" class="mb-4 text-[#c7c7cc]" />
      <p class="text-base font-medium text-[#172b4d]">Carpeta vacía</p>
      <p class="mt-1 text-sm text-[#626f86]">Crea una carpeta o sube documentación.</p>
    </div>

    <ProjectModal v-if="showNewFolder" title="Nueva carpeta" size="sm" @close="showNewFolder = false">
      <input v-model="newFolderName" placeholder="Nombre de la carpeta" :class="inputClass" @keyup.enter="createFolder" />
      <template #footer>
        <button type="button" class="ql-btn ql-btn--ghost" @click="showNewFolder = false">Cancelar</button>
        <button type="button" class="ql-btn ql-btn--primary" @click="createFolder">Crear</button>
      </template>
    </ProjectModal>

    <ProjectModal v-if="showNewDoc" title="Nuevo documento" @close="showNewDoc = false">
      <div class="space-y-3">
        <input v-model="docForm.title" placeholder="Título" :class="inputClass" />
        <textarea v-model="docForm.content" rows="4" placeholder="Contenido (opcional)" :class="inputClass" />
      </div>
      <template #footer>
        <button type="button" class="ql-btn ql-btn--ghost" @click="showNewDoc = false">Cancelar</button>
        <button type="button" class="ql-btn ql-btn--primary" @click="createDoc">Guardar</button>
      </template>
    </ProjectModal>
  </div>
</template>
