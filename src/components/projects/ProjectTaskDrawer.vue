<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2, Paperclip } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import type { ProjectTaskStatus } from '@/types/projects'
import type { Priority } from '@/types'
import AppWindow from '@/components/ui/AppWindow.vue'
import DateInput from './shared/DateInput.vue'
import { TASK_STATUS_LABELS } from '@/utils/projectStats'
import { openAttachment } from '@/services/storage'

const props = defineProps<{
  taskId: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const projectsStore = useProjectsStore()
const saving = ref(false)
const uploading = ref(false)

const task = computed(() =>
  props.taskId ? projectsStore.tasks.find((t) => t.id === props.taskId) ?? null : null,
)

const form = ref({
  title: '',
  description: '',
  status: 'todo' as ProjectTaskStatus,
  priority: 'media' as Priority,
  startDate: '',
  dueDate: '',
})

watch(
  task,
  (t) => {
    if (!t) return
    form.value = {
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      startDate: t.startDate ?? '',
      dueDate: t.dueDate ?? '',
    }
  },
  { immediate: true },
)

async function save() {
  if (!task.value || !form.value.title.trim()) return
  saving.value = true
  try {
    await projectsStore.updateTask(task.value.id, {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      status: form.value.status,
      priority: form.value.priority,
      startDate: form.value.startDate || null,
      dueDate: form.value.dueDate || null,
    })
    emit('close')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!task.value) return
  await projectsStore.deleteTask(task.value.id)
  emit('close')
}

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !task.value) return
  uploading.value = true
  try {
    await projectsStore.addTaskAttachment(task.value.id, file)
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

const timeMinutes = ref(30)
const timeNote = ref('')
const loggingTime = ref(false)

async function logTime() {
  if (!task.value || timeMinutes.value <= 0) return
  loggingTime.value = true
  try {
    await projectsStore.logTimeEntry(
      task.value.projectId,
      timeMinutes.value,
      timeNote.value,
      task.value.id,
    )
    timeNote.value = ''
  } finally {
    loggingTime.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="task"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <AppWindow
        :title="form.title.trim() || 'Tarea'"
        subtitle="Detalle y edición"
        class="app-window--wide"
        @close="emit('close')"
      >
        <div class="app-window-form-row app-window-form-row--2">
          <div class="app-window-form-span-full">
            <label class="project-create-modal__label">Título</label>
            <input v-model="form.title" type="text" class="project-create-modal__input" />
          </div>

          <div class="app-window-form-span-full">
            <label class="project-create-modal__label">Descripción</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="project-create-modal__input resize-none"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label class="project-create-modal__label">Estado</label>
            <select v-model="form.status" class="project-create-modal__input">
              <option v-for="(label, key) in TASK_STATUS_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="project-create-modal__label">Prioridad</label>
            <select v-model="form.priority" class="project-create-modal__input">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <DateInput v-model="form.startDate" label="Inicio" :default-today="false" />
          <DateInput v-model="form.dueDate" label="Vence" :default-today="false" />

          <div class="app-window-form-span-full rounded-xl border border-[#ebebed] bg-white p-4">
            <p class="mb-2 text-sm font-medium text-[#44546f]">Tiempo registrado</p>
            <p v-if="task.loggedMinutes" class="mb-3 text-sm text-[#172b4d]">
              <strong>{{ task.loggedMinutes }} min</strong> en esta tarea
            </p>
            <div class="flex flex-wrap gap-2">
              <input
                v-model.number="timeMinutes"
                type="number"
                min="1"
                class="project-create-modal__input w-24"
                placeholder="Min"
              />
              <input
                v-model="timeNote"
                type="text"
                class="project-create-modal__input min-w-0 flex-1"
                placeholder="¿En qué trabajaste?"
              />
              <button
                type="button"
                class="btn-brand"
                :disabled="loggingTime"
                @click="logTime"
              >
                Registrar
              </button>
            </div>
          </div>

          <div class="app-window-form-span-full">
            <div class="mb-2 flex items-center justify-between">
              <label class="project-create-modal__label mb-0">Adjuntos</label>
              <label class="flex cursor-pointer items-center gap-1 text-sm text-[#2d7eb8]">
                <Paperclip :size="14" />
                Añadir
                <input type="file" class="hidden" :disabled="uploading" @change="onFileUpload" />
              </label>
            </div>
            <ul v-if="task.attachments?.length" class="space-y-1.5">
              <li
                v-for="att in task.attachments"
                :key="att.id"
                class="flex items-center justify-between rounded-lg bg-[#f5f5f7] px-3 py-2 text-sm"
              >
                <span class="truncate text-[#172b4d]">{{ att.name }}</span>
                <button type="button" class="project-link-btn text-xs" @click="openAttachment(att)">
                  Ver
                </button>
              </li>
            </ul>
            <p v-else class="text-sm text-[#626f86]">Sin archivos adjuntos.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex w-full justify-between">
            <button type="button" class="btn-brand-ghost text-red-600 hover:bg-red-50" @click="remove">
              <Trash2 :size="16" />
              Eliminar
            </button>
            <div class="flex gap-2">
              <button type="button" class="btn-brand-ghost" @click="emit('close')">Cancelar</button>
              <button
                type="button"
                class="btn-brand"
                :disabled="saving || !form.title.trim()"
                @click="save"
              >
                Guardar
              </button>
            </div>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
