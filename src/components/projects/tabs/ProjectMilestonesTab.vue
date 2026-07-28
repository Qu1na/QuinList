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

const inputClass = 'w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]'

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
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <Flag :size="16" class="text-[#0c66e4]" />
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ milestones.length }}</p>
        <p class="text-xs text-[#626f86]">Total hitos</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-2xl font-bold text-[#172b4d]">{{ milestones.filter((m) => m.completed).length }}</p>
        <p class="text-xs text-[#626f86]">Completados</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-2xl font-bold text-[#0c66e4]">{{ progress }}%</p>
        <p class="text-xs text-[#626f86]">Progreso</p>
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="font-semibold text-[#172b4d]">Hitos del proyecto</h2>
        <button
          class="flex items-center gap-1.5 rounded-lg bg-[#0c66e4] px-3 py-2 text-sm text-white hover:bg-[#0055cc]"
          @click="openCreate"
        >
          <Plus :size="15" />
          Nuevo hito
        </button>
      </div>

      <div class="relative space-y-0">
        <div class="absolute top-0 bottom-0 left-[19px] w-0.5 bg-[#091e4214]" />
        <div v-for="(ms, i) in milestones" :key="ms.id" class="relative flex gap-4 pb-5">
          <button
            class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors"
            :class="ms.completed ? 'border-[#0c66e4] bg-[#0c66e4] text-white' : 'border-[#091e4229]'"
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
        <button class="px-3 py-1.5 text-sm text-[#626f86]" @click="showModal = false">Cancelar</button>
        <button class="rounded-lg bg-[#0c66e4] px-4 py-1.5 text-sm text-white" @click="save">
          {{ editingId ? 'Guardar' : 'Crear hito' }}
        </button>
      </template>
    </ProjectModal>
  </div>
</template>
