<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Star, FolderKanban } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import { canEdit } from '@/utils/permissions'
import { getBoardBackgroundThumbStyle } from '@/utils/boardBackgrounds'
import { calcProjectProgress } from '@/utils/projectStats'
import { PROJECTS_MODULE_ENABLED } from '@/config/features'

const store = useQuinListStore()
const projectsStore = useProjectsStore()
const ui = useUiStore()
const router = useRouter()

onMounted(() => {
  if (PROJECTS_MODULE_ENABLED && !projectsStore.isReady) void projectsStore.init()
})

const canCreate = computed(() => canEdit(store.getUserRole(store.currentWorkspaceId)))
const starredBoards = computed(() =>
  store.getStarredBoards().map((board) => ({
    board,
    stats: store.getBoardStats(board.id),
  })),
)
const allBoards = computed(() =>
  store.workspaceBoards.map((board) => ({
    board,
    stats: store.getBoardStats(board.id),
  })),
)

const sharedBoards = computed(() => {
  const wsIds = new Set(store.workspaceBoards.map((b) => b.id))
  return store.boards
    .filter((b) => !wsIds.has(b.id))
    .map((board) => ({
      board,
      stats: store.getBoardStats(board.id),
    }))
})

function openBoard(id: string) {
  router.push({ name: 'board', params: { boardId: id } })
}

function progressPercent(stats: { total: number; completed: number }) {
  if (stats.total === 0) return 0
  return Math.round((stats.completed / stats.total) * 100)
}

const recentProjects = computed(() =>
  projectsStore.workspaceProjects(store.currentWorkspaceId).slice(0, 4).map((project) => ({
    project,
    progress: calcProjectProgress(projectsStore.getProjectTasks(project.id)),
  })),
)
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-6">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-[#172b4d]">
        Tableros en {{ store.currentWorkspace?.name }}
      </h1>
      <button
        v-if="canCreate"
        class="rounded bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
        @click="ui.openCreateBoard()"
      >
        Crear tablero
      </button>
    </div>

    <section v-if="starredBoards.length" class="mb-8">
      <h2
        class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#44546f] uppercase"
      >
        <Star :size="14" />
        Destacados
      </h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="{ board, stats } in starredBoards"
          :key="board.id"
          class="group relative h-28 w-52 overflow-hidden rounded-lg text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          :style="getBoardBackgroundThumbStyle(board.background)"
          @click="openBoard(board.id)"
        >
          <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />
          <div class="absolute inset-0 flex flex-col justify-end p-3">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · {{ stats.completed }} completadas
            </span>
            <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-white/30">
              <div
                class="h-full rounded-full bg-white/90 transition-all"
                :style="{ width: `${progressPercent(stats)}%` }"
              />
            </div>
          </div>
        </button>
      </div>
    </section>

    <section v-if="sharedBoards.length" class="mb-8">
      <h2 class="mb-3 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
        Compartidos contigo
      </h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="{ board, stats } in sharedBoards"
          :key="board.id"
          class="group relative h-28 w-52 overflow-hidden rounded-lg text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          :style="getBoardBackgroundThumbStyle(board.background)"
          @click="openBoard(board.id)"
        >
          <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />
          <div class="absolute inset-0 flex flex-col justify-end p-3">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · acceso compartido
            </span>
          </div>
        </button>
      </div>
    </section>

    <section v-if="PROJECTS_MODULE_ENABLED" class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
          <FolderKanban :size="14" />
          Gestión de Proyectos
        </h2>
        <RouterLink to="/app/projects" class="text-xs font-medium text-[#0c66e4] hover:underline">
          Ver todos
        </RouterLink>
      </div>
      <div class="flex flex-wrap gap-3">
        <RouterLink
          v-for="{ project, progress } in recentProjects"
          :key="project.id"
          :to="`/app/projects/${project.id}`"
          class="h-28 w-52 rounded-lg border border-[#091e4214] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p class="truncate text-sm font-bold text-[#172b4d]">{{ project.name }}</p>
          <p v-if="project.client" class="mt-0.5 truncate text-[11px] text-[#626f86]">{{ project.client }}</p>
          <div class="mt-3">
            <div class="mb-1 flex justify-between text-[10px] text-[#626f86]">
              <span>Avance</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="h-1 overflow-hidden rounded-full bg-[#091e4214]">
              <div class="h-full rounded-full bg-[#0c66e4]" :style="{ width: `${progress}%` }" />
            </div>
          </div>
        </RouterLink>
        <RouterLink
          to="/app/projects"
          class="flex h-28 w-52 flex-col items-center justify-center rounded-lg bg-[#091e420f] text-[#44546f] transition-colors hover:bg-[#091e4221]"
        >
          <FolderKanban :size="24" class="mb-1" />
          <span class="text-sm">Ver proyectos</span>
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="mb-3 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
        Todos los tableros
      </h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="{ board, stats } in allBoards"
          :key="board.id"
          class="group relative h-28 w-52 overflow-hidden rounded-lg text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          :style="getBoardBackgroundThumbStyle(board.background)"
          @click="openBoard(board.id)"
        >
          <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />
          <Star
            v-if="board.starred"
            :size="14"
            class="absolute top-2 right-2 z-10 text-yellow-300"
            fill="currentColor"
          />
          <div class="absolute inset-0 flex flex-col justify-end p-3">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · {{ stats.completed }} completadas
            </span>
            <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-white/30">
              <div
                class="h-full rounded-full bg-white/90 transition-all"
                :style="{ width: `${progressPercent(stats)}%` }"
              />
            </div>
          </div>
        </button>

        <button
          v-if="canCreate"
          class="flex h-28 w-52 flex-col items-center justify-center rounded-lg bg-[#091e420f] text-[#44546f] transition-colors hover:bg-[#091e4221]"
          @click="ui.openCreateBoard()"
        >
          <Plus :size="24" class="mb-1" />
          <span class="text-sm">Crear tablero</span>
        </button>
      </div>
    </section>
  </div>
</template>
