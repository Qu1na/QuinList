<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X, Trash2, Paperclip } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import type { ProjectTaskStatus } from '@/types/projects'
import type { Priority } from '@/types'
import TaskStatusBadge from './shared/TaskStatusBadge.vue'
import PriorityBadge from './shared/PriorityBadge.vue'
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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="task"
      class="fixed inset-0 z-[2000] flex justify-end bg-black/40"
      @click.self="emit('close')"
    >
      <aside class="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-[#091e4214] px-5 py-4">
          <h2 class="font-semibold text-[#172b4d]">Detalle de tarea</h2>
          <button class="rounded p-1.5 text-[#626f86] hover:bg-[#091e420a]" @click="emit('close')">
            <X :size="20" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div class="mb-4 flex flex-wrap gap-2">
            <TaskStatusBadge :status="form.status" />
            <PriorityBadge :priority="form.priority" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-[#626f86] uppercase">Título</label>
              <input
                v-model="form.title"
                type="text"
                class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-[#626f86] uppercase">Descripción</label>
              <textarea
                v-model="form.description"
                rows="4"
                class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-[#626f86] uppercase">Estado</label>
                <select v-model="form.status" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
                  <option v-for="(label, key) in TASK_STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-[#626f86] uppercase">Prioridad</label>
                <select v-model="form.priority" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <DateInput v-model="form.startDate" label="Inicio" :default-today="false" />
              <DateInput v-model="form.dueDate" label="Vence" :default-today="false" />
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="text-xs font-medium text-[#626f86] uppercase">Adjuntos</label>
                <label class="flex cursor-pointer items-center gap-1 text-xs text-[#0c66e4]">
                  <Paperclip :size="12" />
                  Añadir
                  <input type="file" class="hidden" :disabled="uploading" @change="onFileUpload" />
                </label>
              </div>
              <ul v-if="task.attachments?.length" class="space-y-1">
                <li
                  v-for="att in task.attachments"
                  :key="att.id"
                  class="flex items-center justify-between rounded-lg bg-[#091e420a] px-3 py-2 text-sm"
                >
                  <span class="truncate text-[#172b4d]">{{ att.name }}</span>
                  <button class="text-xs text-[#0c66e4] hover:underline" @click="openAttachment(att)">Ver</button>
                </li>
              </ul>
              <p v-else class="text-xs text-[#626f86]">Sin archivos adjuntos.</p>
            </div>
          </div>
        </div>

        <footer class="border-t border-[#091e4214] px-5 py-4">
          <div class="flex gap-2">
            <button
              class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#091e4229] py-2.5 text-sm text-[#626f86] hover:bg-[#091e420a]"
              @click="remove"
            >
              <Trash2 :size="14" />
              Eliminar
            </button>
            <button
              class="flex-[2] rounded-lg bg-[#0c66e4] py-2.5 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-50"
              :disabled="saving || !form.title.trim()"
              @click="save"
            >
              Guardar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>
