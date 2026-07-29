<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, SlidersHorizontal, ArrowUpDown } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import type { ProjectTaskStatus } from '@/types/projects'
import ProjectKanbanBoard from '@/components/projects/ProjectKanbanBoard.vue'
import ProjectTaskDrawer from '@/components/projects/ProjectTaskDrawer.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()

const selectedTaskId = ref<string | null>(null)
const search = ref('')

const project = computed(() => projectsStore.getProject(props.projectId))

const tasks = computed(() => {
  const q = search.value.trim().toLowerCase()
  return projectsStore.getProjectTasks(props.projectId).filter((t) => {
    if (!q) return true
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  })
})

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

        <div class="pkt-header__actions">
          <button type="button" class="pkt-action-btn">
            <ArrowUpDown :size="16" />
            Ordenar
          </button>
          <button type="button" class="pkt-action-btn">
            <SlidersHorizontal :size="16" />
            Filtros
          </button>
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
