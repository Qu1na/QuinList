<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { Plus, Calendar, AlertCircle, GripVertical } from '@lucide/vue'
import type { ProjectTask, ProjectTaskStatus } from '@/types/projects'
import { TASK_STATUS_LABELS, KANBAN_COLUMNS, isTaskOverdue } from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'
import PriorityBadge from './shared/PriorityBadge.vue'

const props = defineProps<{
  tasks: ProjectTask[]
}>()

const emit = defineEmits<{
  select: [taskId: string]
  move: [taskId: string, status: ProjectTaskStatus]
  create: [title: string, status: ProjectTaskStatus]
}>()

const columnTasks = ref<Record<ProjectTaskStatus, ProjectTask[]>>({
  todo: [],
  in_progress: [],
  review: [],
  done: [],
  blocked: [],
})

const addingTo = ref<ProjectTaskStatus | null>(null)
const newTitle = ref('')

function syncColumns() {
  const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c, [] as ProjectTask[]])) as Record<
    ProjectTaskStatus,
    ProjectTask[]
  >
  for (const t of props.tasks) {
    const col = (t.kanbanColumn || t.status) as ProjectTaskStatus
    if (map[col]) map[col].push(t)
    else map.todo.push(t)
  }
  columnTasks.value = map
}

syncColumns()
watch(() => props.tasks, syncColumns, { deep: true })

const columnColors: Record<ProjectTaskStatus, string> = {
  todo: '#091e4240',
  in_progress: '#0c66e4',
  review: '#6554c0',
  done: '#44546f',
  blocked: '#626f86',
}

function onChange(col: ProjectTaskStatus, evt: { added?: { element: ProjectTask } }) {
  if (evt.added) {
    emit('move', evt.added.element.id, col)
  }
}

function submitAdd(col: ProjectTaskStatus) {
  if (!newTitle.value.trim()) return
  emit('create', newTitle.value.trim(), col)
  newTitle.value = ''
  addingTo.value = null
}
</script>

<template>
  <div class="flex gap-3 overflow-x-auto pb-3">
    <div
      v-for="col in KANBAN_COLUMNS"
      :key="col"
      class="flex w-72 shrink-0 flex-col rounded-xl bg-[#091e420f] p-2"
    >
      <div class="mb-2 flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" :style="{ background: columnColors[col] }" />
          <h4 class="text-xs font-semibold tracking-wide text-[#44546f] uppercase">
            {{ TASK_STATUS_LABELS[col] }}
          </h4>
          <span class="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-[#626f86]">
            {{ columnTasks[col].length }}
          </span>
        </div>
      </div>

      <draggable
        :list="columnTasks[col]"
        group="project-kanban"
        item-key="id"
        class="min-h-[60px] flex-1 space-y-2"
        ghost-class="opacity-40"
        drag-class="rotate-1"
        @change="onChange(col, $event)"
      >
        <template #item="{ element: task }">
          <div
            class="group cursor-pointer rounded-lg border border-[#091e4214] bg-white p-3 shadow-sm transition hover:border-[#0c66e4]/30 hover:shadow-md"
            @click="emit('select', task.id)"
          >
            <div class="mb-2 flex items-start gap-1.5">
              <GripVertical
                :size="14"
                class="mt-0.5 shrink-0 cursor-grab text-[#091e4240] opacity-0 group-hover:opacity-100"
              />
              <p class="flex-1 text-sm font-medium text-[#172b4d]">{{ task.title }}</p>
              <AlertCircle v-if="isTaskOverdue(task)" :size="13" class="shrink-0 text-[#44546f]" />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <PriorityBadge :priority="task.priority" compact />
              <span
                v-if="task.dueDate"
                class="flex items-center gap-0.5 text-[10px]"
                :class="isTaskOverdue(task) ? 'text-[#44546f] font-medium' : 'text-[#626f86]'"
              >
                <Calendar :size="10" />
                {{ formatDate(task.dueDate) }}
              </span>
            </div>
          </div>
        </template>
      </draggable>

      <div v-if="addingTo === col" class="mt-2">
        <textarea
          v-model="newTitle"
          rows="2"
          placeholder="Título de la tarea..."
          class="mb-2 w-full resize-none rounded-lg border border-[#091e4229] px-2 py-1.5 text-sm outline-none focus:border-[#0c66e4]"
          @keydown.enter.exact.prevent="submitAdd(col)"
        />
        <div class="flex gap-2">
          <button
            class="rounded-md bg-[#0c66e4] px-2.5 py-1 text-xs text-white"
            @click="submitAdd(col)"
          >
            Añadir
          </button>
          <button class="text-xs text-[#626f86]" @click="addingTo = null">Cancelar</button>
        </div>
      </div>
      <button
        v-else
        class="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#626f86] hover:bg-white/60"
        @click="addingTo = col; newTitle = ''"
      >
        <Plus :size="14" />
        Añadir tarjeta
      </button>
    </div>
  </div>
</template>
