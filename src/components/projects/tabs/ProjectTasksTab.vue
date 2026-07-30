<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, SlidersHorizontal, ArrowUpDown } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import type { ProjectTaskStatus } from '@/types/projects'
import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/utils/projectStats'
import ProjectKanbanBoard from '@/components/projects/ProjectKanbanBoard.vue'
import ProjectTaskDrawer from '@/components/projects/ProjectTaskDrawer.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const selectedTaskId = ref<string | null>(null)
const search = ref('')
const showFilters = ref(false)
const showSort = ref(false)

const filterStatus = ref<ProjectTaskStatus | ''>('')
const filterPriority = ref<Priority | ''>('')
const filterAssignee = ref('')
const sortBy = ref<'position' | 'dueDate' | 'priority' | 'title'>('position')

const project = computed(() => projectsStore.getProject(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))

const priorityRank: Record<Priority, number> = { alta: 0, media: 1, baja: 2 }

const tasks = computed(() => {
  let list = [...projectsStore.getProjectTasks(props.projectId)]
  const q = search.value.trim().toLowerCase()

  if (q) {
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    )
  }
  if (filterStatus.value) list = list.filter((t) => t.status === filterStatus.value)
  if (filterPriority.value) list = list.filter((t) => t.priority === filterPriority.value)
  if (filterAssignee.value) {
    list = list.filter((t) => t.assigneeIds.includes(filterAssignee.value))
  }

  list.sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title, 'es')
    if (sortBy.value === 'dueDate') {
      const ad = a.dueDate ?? '9999'
      const bd = b.dueDate ?? '9999'
      return ad.localeCompare(bd)
    }
    if (sortBy.value === 'priority') {
      return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
    }
    return a.position - b.position
  })

  return list
})

const activeFilterCount = computed(() => {
  let n = 0
  if (filterStatus.value) n++
  if (filterPriority.value) n++
  if (filterAssignee.value) n++
  return n
})

function clearFilters() {
  filterStatus.value = ''
  filterPriority.value = ''
  filterAssignee.value = ''
}

async function createInColumn(title: string, status: ProjectTaskStatus) {
  await projectsStore.createTask(props.projectId, title, { status })
}

async function moveTask(taskId: string, status: ProjectTaskStatus) {
  await projectsStore.moveTaskToColumn(taskId, status)
}
</script>

<template>
  <div class="pkt-shell">
    <header class="pkt-header">
      <div class="pkt-header__top">
        <h1 class="pkt-header__title">{{ project?.name ?? 'Tareas' }}</h1>
      </div>

      <div class="pkt-header__toolbar">
        <div class="pkt-search">
          <Search :size="18" class="pkt-search__icon" />
          <input
            v-model="search"
            type="search"
            class="pkt-search__input"
            placeholder="Buscar tareas..."
          />
        </div>

        <div class="pkt-header__actions relative">
          <button type="button" class="pkt-action-btn" @click="showSort = !showSort; showFilters = false">
            <ArrowUpDown :size="16" />
            Ordenar
          </button>
          <div
            v-if="showSort"
            class="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#091e4214] bg-white py-1 shadow-lg"
          >
            <button
              v-for="opt in [
                { id: 'position', label: 'Orden manual' },
                { id: 'dueDate', label: 'Vencimiento' },
                { id: 'priority', label: 'Prioridad' },
                { id: 'title', label: 'Título A-Z' },
              ]"
              :key="opt.id"
              type="button"
              class="block w-full px-4 py-2 text-left text-sm hover:bg-[#f5f5f7]"
              :class="sortBy === opt.id ? 'font-semibold text-[#2d7eb8]' : 'text-[#44546f]'"
              @click="sortBy = opt.id as typeof sortBy; showSort = false"
            >
              {{ opt.label }}
            </button>
          </div>

          <button
            type="button"
            class="pkt-action-btn"
            :class="{ 'pkt-action-btn--active': activeFilterCount > 0 }"
            @click="showFilters = !showFilters; showSort = false"
          >
            <SlidersHorizontal :size="16" />
            Filtros
            <span v-if="activeFilterCount" class="ml-1 rounded-full bg-[#2d7eb8] px-1.5 text-[10px] text-white">
              {{ activeFilterCount }}
            </span>
          </button>
          <div
            v-if="showFilters"
            class="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-[#091e4214] bg-white p-4 shadow-lg"
          >
            <label class="mb-3 block text-xs font-medium text-[#626f86]">
              Estado
              <select v-model="filterStatus" class="ql-input mt-1 w-full text-sm">
                <option value="">Todos</option>
                <option value="todo">Por hacer</option>
                <option value="in_progress">En progreso</option>
                <option value="review">En revisión</option>
                <option value="done">Completada</option>
                <option value="blocked">Bloqueada</option>
              </select>
            </label>
            <label class="mb-3 block text-xs font-medium text-[#626f86]">
              Prioridad
              <select v-model="filterPriority" class="ql-input mt-1 w-full text-sm">
                <option value="">Todas</option>
                <option v-for="(label, key) in PRIORITY_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>
            <label class="mb-3 block text-xs font-medium text-[#626f86]">
              Responsable
              <select v-model="filterAssignee" class="ql-input mt-1 w-full text-sm">
                <option value="">Todos</option>
                <option v-for="m in members" :key="m.id" :value="m.userId">
                  {{ resolveUser(m.userId)?.name ?? m.userId }}
                </option>
              </select>
            </label>
            <button type="button" class="text-xs text-[#2d7eb8] hover:underline" @click="clearFilters">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </header>

    <ProjectKanbanBoard
      class="pkt-board"
      :tasks="tasks"
      @select="selectedTaskId = $event"
      @move="moveTask"
      @create="createInColumn"
    />

    <ProjectTaskDrawer :task-id="selectedTaskId" @close="selectedTaskId = null" />
  </div>
</template>

<style scoped>
.pkt-action-btn--active {
  background: #eef6fc;
  color: #2d7eb8;
}
</style>
