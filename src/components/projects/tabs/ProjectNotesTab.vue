<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, StickyNote } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import { useProjectUsers } from '@/composables/useProjectUsers'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import StickyNoteCard from '@/components/projects/shared/StickyNoteCard.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const ui = useUiStore()
const { resolveUser } = useProjectUsers()

const notes = computed(() => projectsStore.getProjectNotes(props.projectId))

const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ title: '', content: '' })

function userName(userId: string | null) {
  if (!userId) return 'Usuario'
  return resolveUser(userId)?.name ?? 'Usuario'
}

function openCreate() {
  editingId.value = null
  form.value = { title: '', content: '' }
  showModal.value = true
}

function openEdit(note: (typeof notes.value)[0]) {
  editingId.value = note.id
  form.value = { title: note.title, content: note.content }
  showModal.value = true
}

async function save() {
  if (!form.value.title.trim() && !form.value.content.trim()) return

  const payload = {
    title: form.value.title.trim() || 'Sin título',
    content: form.value.content.trim(),
  }

  showModal.value = false
  const editId = editingId.value

  if (editId) {
    await projectsStore.updateNote(editId, payload)
  } else {
    await projectsStore.addNote(props.projectId, payload)
  }
}

async function removeNote(id: string) {
  const ok = await ui.confirm({
    title: 'Eliminar nota',
    message: '¿Eliminar esta nota de la bitácora? Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    variant: 'danger',
  })
  if (!ok) return
  await projectsStore.deleteNote(id)
}
</script>

<template>
  <div class="space-y-7">
    <div>
      <h2 class="project-page-title">Bitácora</h2>
      <p class="project-page-sub">Notas del equipo en el tablero del proyecto</p>
    </div>

    <div v-if="notes.length" class="notes-board">
      <button type="button" class="notes-add-card" aria-label="Nueva nota" @click="openCreate">
        <span class="notes-add-card__icon">
          <Plus :size="24" stroke-width="2.25" />
        </span>
        <span class="notes-add-card__label">Nueva nota</span>
      </button>

      <StickyNoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :author-name="userName(note.createdBy)"
        @edit="openEdit(note)"
        @delete="removeNote(note.id)"
      />
    </div>

    <div v-else class="notes-empty">
      <StickyNote :size="44" class="notes-empty__icon" stroke-width="1.5" />
      <h3 class="text-lg font-semibold text-[#172b4d]">Aún no hay notas</h3>
      <p class="mt-1 max-w-sm text-sm text-[#626f86]">
        Deja recordatorios, ideas o seguimiento del proyecto en el tablero.
      </p>
      <button type="button" class="notes-add-card notes-add-card--solo" @click="openCreate">
        <span class="notes-add-card__icon">
          <Plus :size="24" stroke-width="2.25" />
        </span>
        <span class="notes-add-card__label">Crear primera nota</span>
      </button>
    </div>

    <ProjectModal
      v-if="showModal"
      :title="editingId ? 'Editar nota' : 'Nueva nota'"
      :subtitle="editingId ? 'Solo se editan título y contenido' : 'El color y estilo se asignan automáticamente'"
      size="md"
      @close="showModal = false"
    >
      <div class="space-y-4">
        <label class="block text-sm">
          <span class="mb-1.5 block font-medium text-[#44546f]">Título</span>
          <input
            v-model="form.title"
            type="text"
            class="ql-input"
            placeholder="Ej. Reunión con cliente"
            autofocus
          />
        </label>

        <label class="block text-sm">
          <span class="mb-1.5 block font-medium text-[#44546f]">Contenido</span>
          <textarea
            v-model="form.content"
            class="ql-input min-h-[140px] resize-y"
            placeholder="Escribe la nota…"
          />
        </label>
      </div>

      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showModal = false">Cancelar</button>
        <button type="button" class="btn-brand" @click="save">
          {{ editingId ? 'Guardar cambios' : 'Crear nota' }}
        </button>
      </template>
    </ProjectModal>
  </div>
</template>

<style scoped>
.notes-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.75rem 1.25rem;
  padding: 0.5rem 0 1rem;
}

.notes-add-card {
  display: flex;
  min-height: 200px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border: 2px dashed rgba(45, 126, 184, 0.35);
  border-radius: 4px;
  background: rgba(238, 246, 252, 0.45);
  color: #2d7eb8;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.notes-add-card:hover {
  border-color: #2d7eb8;
  background: rgba(238, 246, 252, 0.85);
  box-shadow: 0 4px 14px rgba(45, 126, 184, 0.12);
  transform: translateY(-2px);
}

.notes-add-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(45, 126, 184, 0.15);
}

.notes-add-card__label {
  font-size: 0.875rem;
  font-weight: 600;
}

.notes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.notes-empty__icon {
  margin-bottom: 1rem;
  color: #fbbf24;
}

.notes-add-card--solo {
  margin-top: 1.5rem;
  width: min(100%, 240px);
  min-height: 160px;
}
</style>
