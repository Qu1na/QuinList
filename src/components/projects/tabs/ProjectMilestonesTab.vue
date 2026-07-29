<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Check, Flag, Trash2, Pencil } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const progress = computed(() => {
  const done = milestones.value.filter((m) => m.completed).length
  return milestones.value.length ? Math.round((done / milestones.value.length) * 100) : 0
})

const showModal = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const form = ref({ title: '', description: '', startDate: todayISO(), dueDate: todayISO() })

const inputClass = 'ql-input'

function openCreate() {
  editingId.value = null
  form.value = { title: '', description: '', startDate: todayISO(), dueDate: todayISO() }
  formError.value = ''
  showModal.value = true
}

function openEdit(ms: { id: string; title: string; description: string; startDate: string | null; dueDate: string | null }) {
  editingId.value = ms.id
  form.value = {
    title: ms.title,
    description: ms.description,
    startDate: ms.startDate ?? todayISO(),
    dueDate: ms.dueDate ?? todayISO(),
  }
  formError.value = ''
  showModal.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.title.trim()) {
    formError.value = 'El título es obligatorio'
    return
  }
  if (!form.value.dueDate) {
    formError.value = 'La fecha de vencimiento es obligatoria'
    return
  }
  if (form.value.startDate && form.value.dueDate < form.value.startDate) {
    formError.value = 'La fecha de fin debe ser posterior al inicio'
    return
  }

  if (editingId.value) {
    await projectsStore.updateMilestone(editingId.value, {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      startDate: form.value.startDate,
      dueDate: form.value.dueDate,
    })
  } else {
    await projectsStore.addMilestone(props.projectId, {
      title: form.value.title,
      description: form.value.description,
      startDate: form.value.startDate,
      dueDate: form.value.dueDate,
    })
  }
  showModal.value = false
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Hitos</h2>
        <p class="project-page-sub">Objetivos clave y fechas del proyecto</p>
      </div>
      <button type="button" class="ql-btn ql-btn--primary" @click="openCreate">
        <Plus :size="18" />
        Nuevo hito
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <Flag :size="20" class="mb-2 text-[#5bbce4]" />
        <p class="project-kpi__value">{{ milestones.length }}</p>
        <p class="project-kpi__label">Total hitos</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__value">{{ milestones.filter((m) => m.completed).length }}</p>
        <p class="project-kpi__label">Completados</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__value text-[#2d7eb8]">{{ progress }}%</p>
        <p class="project-kpi__label">Progreso</p>
      </div>
    </div>

    <div class="project-card project-card--lg">
      <div class="relative space-y-0">
        <div class="absolute top-0 bottom-0 left-[19px] w-0.5 bg-[#091e4214]" />
        <div v-for="(ms, i) in milestones" :key="ms.id" class="relative flex gap-4 pb-5">
          <button
            class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors"
            :class="ms.completed ? 'border-[#5bbce4] bg-[#5bbce4] text-white' : 'border-[#c7c7cc]'"
            @click="projectsStore.toggleMilestone(ms.id)"
          >
            <Check v-if="ms.completed" :size="16" />
            <span v-else class="text-xs font-bold text-[#626f86]">{{ i + 1 }}</span>
          </button>
          <div class="min-w-0 flex-1 rounded-lg border border-[#091e4214] p-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-medium" :class="ms.completed ? 'text-[#626f86] line-through' : 'text-[#172b4d]'">
                  {{ ms.title }}
                </p>
                <p v-if="ms.description" class="mt-1 text-sm text-[#626f86]">{{ ms.description }}</p>
                <p class="mt-2 text-xs text-[#626f86]">
                  {{ formatDate(ms.startDate) }} → {{ formatDate(ms.dueDate) }}
                </p>
              </div>
              <div class="flex gap-1">
                <button class="rounded p-1.5 text-[#626f86] hover:bg-[#091e420a]" @click="openEdit(ms)">
                  <Pencil :size="14" />
                </button>
                <button class="rounded p-1.5 text-[#626f86] hover:bg-[#091e420a]" @click="projectsStore.deleteMilestone(ms.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="!milestones.length" class="text-sm text-[#626f86]">
        No hay hitos. Define los objetivos clave del proyecto.
      </p>
    </div>

    <ProjectModal
      v-if="showModal"
      :title="editingId ? 'Editar hito' : 'Nuevo hito'"
      subtitle="Las fechas son obligatorias"
      @close="showModal = false"
    >
      <div class="space-y-3">
        <input v-model="form.title" placeholder="Título del hito *" :class="inputClass" />
        <textarea v-model="form.description" rows="2" placeholder="Descripción" :class="inputClass" />
        <div class="grid gap-3 sm:grid-cols-2">
          <DateInput v-model="form.startDate" label="Fecha inicio" required />
          <DateInput v-model="form.dueDate" label="Fecha vencimiento" required />
        </div>
        <p v-if="formError" class="text-xs text-[#44546f]">{{ formError }}</p>
      </div>
      <template #footer>
        <button type="button" class="ql-btn ql-btn--ghost" @click="showModal = false">Cancelar</button>
        <button type="button" class="ql-btn ql-btn--primary" @click="save">
          {{ editingId ? 'Guardar' : 'Crear hito' }}
        </button>
      </template>
    </ProjectModal>
  </div>
</template>
