<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, List, LayoutGrid } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import type { ProjectTaskStatus } from '@/types/projects'
import { KANBAN_COLUMNS, TASK_STATUS_LABELS } from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'
import TaskStatusBadge from '@/components/projects/shared/TaskStatusBadge.vue'
import PriorityBadge from '@/components/projects/shared/PriorityBadge.vue'
import ProjectKanbanBoard from '@/components/projects/ProjectKanbanBoard.vue'
import ProjectTaskDrawer from '@/components/projects/ProjectTaskDrawer.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()

const view = ref<'kanban' | 'list'>('kanban')
const selectedTaskId = ref<string | null>(null)
const search = ref('')
const statusFilter = ref<ProjectTaskStatus | 'all'>('all')

const tasks = computed(() => {
  const q = search.value.trim().toLowerCase()
  return projectsStore.getProjectTasks(props.projectId).filter((t) => {
    if (statusFilter.value !== 'all' && t.status !== statusFilter.value) return false
    if (!q) return true
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  })
})

async function createInColumn(title: string, status: ProjectTaskStatus) {
  const task = await projectsStore.createTask(props.projectId, title)
  if (task && status !== 'todo') {
    await projectsStore.moveTaskToColumn(task.id, status)
  }
}

async function moveTask(taskId: string, status: ProjectTaskStatus) {
  await projectsStore.moveTaskToColumn(taskId, status)
}

async function toggleDone(taskId: string, current: string) {
  await projectsStore.updateTask(taskId, {
    status: current === 'done' ? 'todo' : 'done',
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex rounded-lg border border-[#091e4214] bg-white p-0.5">
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
          :class="view === 'kanban' ? 'bg-[#091e420f] font-medium text-[#172b4d]' : 'text-[#626f86]'"
          @click="view = 'kanban'"
        >
          <LayoutGrid :size="14" />
          Tablero
        </button>
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
          :class="view === 'list' ? 'bg-[#091e420f] font-medium text-[#172b4d]' : 'text-[#626f86]'"
          @click="view = 'list'"
        >
          <List :size="14" />
          Lista
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <div class="relative">
          <Search :size="14" class="absolute top-2.5 left-2.5 text-[#626f86]" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar tareas..."
            class="rounded-lg border border-[#091e4229] py-1.5 pr-3 pl-8 text-sm outline-none focus:border-[#0c66e4]"
          />
        </div>
        <select
          v-model="statusFilter"
          class="rounded-lg border border-[#091e4229] px-2 py-1.5 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option v-for="col in KANBAN_COLUMNS" :key="col" :value="col">
            {{ TASK_STATUS_LABELS[col] }}
          </option>
        </select>
      </div>
    </div>

    <ProjectKanbanBoard
      v-if="view === 'kanban'"
      :tasks="tasks"
      @select="selectedTaskId = $event"
      @move="moveTask"
      @create="createInColumn"
    />

    <div v-else class="overflow-hidden rounded-xl border border-[#091e4214] bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[#091e4214] bg-[#091e420a] text-left text-xs text-[#626f86]">
            <th class="px-4 py-3">Tarea</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Prioridad</th>
            <th class="px-4 py-3">Vence</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="task in tasks"
            :key="task.id"
            class="cursor-pointer border-b border-[#091e4214] transition-colors last:border-0 hover:bg-[#091e420a]"
            @click="selectedTaskId = task.id"
          >
            <td class="px-4 py-3">
              <label class="flex items-center gap-2" @click.stop>
                <input
                  type="checkbox"
                  :checked="task.status === 'done'"
                  @change="toggleDone(task.id, task.status)"
                />
                <span :class="task.status === 'done' ? 'text-[#626f86] line-through' : 'text-[#172b4d]'">
                  {{ task.title }}
                </span>
              </label>
            </td>
            <td class="px-4 py-3"><TaskStatusBadge :status="task.status" compact /></td>
            <td class="px-4 py-3"><PriorityBadge :priority="task.priority" compact /></td>
            <td class="px-4 py-3 text-[#626f86]">{{ formatDate(task.dueDate) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!tasks.length" class="px-4 py-8 text-center text-sm text-[#626f86]">
        No hay tareas. Añade la primera desde el tablero.
      </p>
    </div>

    <ProjectTaskDrawer :task-id="selectedTaskId" @close="selectedTaskId = null" />
  </div>
</template>
