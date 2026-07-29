<script setup lang="ts">
import { computed, ref } from 'vue'
import { FolderPlus, FileText, Upload, ChevronRight, Home, Folder } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDateTime } from '@/utils/permissions'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { openAttachment, downloadAttachment } from '@/services/storage'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import FileExplorerItem from '@/components/projects/shared/FileExplorerItem.vue'
import FileExplorerDesktop from '@/components/projects/shared/FileExplorerDesktop.vue'
import type { Attachment } from '@/types'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const currentFolderId = ref<string | null>(null)
const showNewFolder = ref(false)
const showNewDoc = ref(false)
const newFolderName = ref('')
const docForm = ref({ title: '', content: '' })
const uploadingCount = ref(0)
const uploading = computed(() => uploadingCount.value > 0)

const uploadLabel = computed(() => {
  if (!uploadingCount.value) return 'Subir archivos'
  const n = uploadingCount.value
  return n === 1 ? 'Subiendo 1 archivo…' : `Subiendo ${n} archivos…`
})

const folders = computed(() => projectsStore.getProjectFolders(props.projectId))
const documents = computed(() => projectsStore.getProjectDocuments(props.projectId))

const childFolders = computed(() =>
  folders.value.filter((f) => f.parentId === currentFolderId.value),
)

const folderDocs = computed(() =>
  documents.value.filter((d) => (d.folderId ?? null) === currentFolderId.value),
)

type ExplorerEntry =
  | { kind: 'folder'; id: string; name: string; createdAt: string }
  | { kind: 'doc'; id: string; name: string; subtitle: string; attachment?: Attachment }
  | { kind: 'file'; id: string; name: string; subtitle: string; attachment: Attachment }

const explorerItems = computed((): ExplorerEntry[] => {
  const items: ExplorerEntry[] = childFolders.value.map((f) => ({
    kind: 'folder' as const,
    id: f.id,
    name: f.name,
    createdAt: f.createdAt,
  }))

  for (const doc of folderDocs.value) {
    if (doc.attachments.length) {
      for (const att of doc.attachments) {
        items.push({
          kind: 'file',
          id: `${doc.id}-${att.id}`,
          name: att.name,
          subtitle: `${userName(doc.createdBy)} · ${formatDateTime(att.uploadedAt)}`,
          attachment: att,
        })
      }
    } else {
      items.push({
        kind: 'doc',
        id: doc.id,
        name: doc.title,
        subtitle: `${userName(doc.createdBy)} · ${formatDateTime(doc.createdAt)}`,
      })
    }
  }

  return items
})

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

async function createFolder() {
  if (!newFolderName.value.trim()) return
  const name = newFolderName.value.trim()
  newFolderName.value = ''
  showNewFolder.value = false
  try {
    await projectsStore.createFolder(props.projectId, name, currentFolderId.value)
  } catch (err) {
    console.error(err)
  }
}

async function createDoc() {
  if (!docForm.value.title.trim()) return
  const title = docForm.value.title
  const content = docForm.value.content
  const folderId = currentFolderId.value
  docForm.value = { title: '', content: '' }
  showNewDoc.value = false
  try {
    await projectsStore.addDocument(props.projectId, title, content, folderId)
  } catch (err) {
    console.error(err)
  }
}

async function uploadFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList).filter((f) => f.size > 0)
  if (!files.length) return

  const folderId = currentFolderId.value
  uploadingCount.value += files.length

  for (const file of files) {
    try {
      const doc = await projectsStore.addDocument(props.projectId, file.name, '', folderId)
      if (doc) await projectsStore.addDocumentFile(props.projectId, doc.id, file)
    } catch (err) {
      console.error('[documents] Error subiendo archivo:', file.name, err)
    } finally {
      uploadingCount.value--
    }
  }
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  await uploadFiles(input.files)
  input.value = ''
}

function onDropFiles(files: File[]) {
  void uploadFiles(files)
}

function userName(id: string | null) {
  if (!id) return '—'
  return resolveUser(id)?.name ?? 'Usuario'
}

function onItemClick(item: ExplorerEntry) {
  if (item.kind === 'folder') {
    currentFolderId.value = item.id
  }
}

function onOpen(item: ExplorerEntry) {
  if (item.kind === 'file' && item.attachment) {
    openAttachment(item.attachment)
  }
}

function onDownload(item: ExplorerEntry) {
  if (item.kind === 'file' && item.attachment) {
    downloadAttachment(item.attachment)
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Documentación</h2>
        <p class="project-page-sub">Explorador de carpetas y documentos del proyecto</p>
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
          {{ uploadLabel }}
          <input
            type="file"
            class="hidden"
            multiple
            :disabled="uploading"
            @change="onUpload"
          />
        </label>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-1 rounded-lg border border-[#091e4214] bg-white px-3 py-2 text-sm">
      <button
        v-for="(crumb, i) in breadcrumbs"
        :key="crumb.id ?? 'root'"
        type="button"
        class="flex items-center gap-1 font-medium text-[#2d7eb8] hover:text-[#f4845f]"
        @click="currentFolderId = crumb.id"
      >
        <Home v-if="i === 0" :size="14" />
        <ChevronRight v-if="i > 0" :size="12" class="text-[#c7c7cc]" />
        {{ crumb.name }}
      </button>
    </div>

    <FileExplorerDesktop
      enable-drop
      :empty="!explorerItems.length"
      empty-title="Carpeta vacía"
      empty-hint="Crea una carpeta, un documento o sube varios archivos a la vez."
      drop-label="Suelta los archivos para subirlos"
      @drop-files="onDropFiles"
    >
      <div class="fx-grid">
        <FileExplorerItem
          v-for="item in explorerItems"
          :key="item.id"
          :name="item.name"
          :subtitle="item.kind === 'folder' ? formatDateTime(item.createdAt) : item.subtitle"
          :is-folder="item.kind === 'folder'"
          :type="item.kind === 'file' ? item.attachment.type : item.kind === 'doc' ? 'text/plain' : ''"
          :attachment="item.kind === 'file' ? item.attachment : null"
          :show-actions="item.kind === 'file'"
          @click="onItemClick(item)"
          @open="onOpen(item)"
          @download="onDownload(item)"
        />
      </div>
      <template #empty-icon>
        <Folder :size="52" class="text-[#c7c7cc]" />
      </template>
    </FileExplorerDesktop>

    <ProjectModal v-if="showNewFolder" title="Nueva carpeta" size="sm" @close="showNewFolder = false">
      <input
        v-model="newFolderName"
        class="project-create-modal__input"
        placeholder="Nombre de la carpeta"
        @keyup.enter="createFolder"
      />
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showNewFolder = false">Cancelar</button>
        <button type="button" class="btn-brand" @click="createFolder">Crear</button>
      </template>
    </ProjectModal>

    <ProjectModal v-if="showNewDoc" title="Nuevo documento" @close="showNewDoc = false">
      <div class="space-y-3">
        <input v-model="docForm.title" class="project-create-modal__input" placeholder="Título" />
        <textarea
          v-model="docForm.content"
          rows="4"
          class="project-create-modal__input resize-none"
          placeholder="Contenido (opcional)"
        />
      </div>
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showNewDoc = false">Cancelar</button>
        <button type="button" class="btn-brand" @click="createDoc">Guardar</button>
      </template>
    </ProjectModal>
  </div>
</template>
