<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Star, FolderKanban, LayoutGrid, FolderPlus, RefreshCw } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { useUiStore } from '@/stores/ui'
import { canEdit } from '@/utils/permissions'
import { getBoardBackgroundThumbStyle } from '@/utils/boardBackgrounds'
import { calcProjectProgress } from '@/utils/projectStats'
import { PROJECTS_MODULE_ENABLED } from '@/config/features'
import ProjectFolderIcon from '@/components/projects/shared/ProjectFolderIcon.vue'
import DesktopContextMenu from '@/components/workspace/DesktopContextMenu.vue'
import type { DesktopMenuItem } from '@/components/workspace/DesktopContextMenu.vue'

const store = useQuinListStore()
const projectsStore = useProjectsStore()
const ui = useUiStore()
const router = useRouter()

const contextMenu = ref<{ x: number; y: number } | null>(null)

onMounted(async () => {
  if (!PROJECTS_MODULE_ENABLED) return
  await projectsStore.init()
  const shared = projectsStore.getSharedOnlyProjects()
  if (shared.length === 1) {
    router.replace({ name: 'project-detail', params: { projectId: shared[0]!.id } })
  }
})

onUnmounted(() => {
  contextMenu.value = null
})

const canCreate = computed(() => canEdit(store.getUserRole(store.currentWorkspaceId)))

const contextMenuItems = computed((): DesktopMenuItem[] => [
  { id: 'new-board', label: 'Nuevo tablero', icon: LayoutGrid, disabled: !canCreate.value },
  {
    id: 'new-project',
    label: 'Nuevo proyecto',
    icon: FolderPlus,
    disabled: !canCreate.value || !PROJECTS_MODULE_ENABLED,
  },
  { id: 'refresh', label: 'Actualizar', icon: RefreshCw },
])

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

const workspaceProjects = computed(() =>
  projectsStore.workspaceProjects(store.currentWorkspaceId).map((project) => ({
    project,
    progress: calcProjectProgress(projectsStore.getProjectTasks(project.id)),
  })),
)

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    x: Math.min(e.clientX, window.innerWidth - 220),
    y: Math.min(e.clientY, window.innerHeight - 160),
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

async function onContextMenuSelect(id: string) {
  if (id === 'new-board') ui.openCreateBoard()
  else if (id === 'new-project') await router.push({ path: '/app/projects', query: { create: '1' } })
  else if (id === 'refresh') {
    await store.init()
    if (PROJECTS_MODULE_ENABLED) await projectsStore.reloadForWorkspace(store.currentWorkspaceId)
  }
}
</script>

<template>
  <div
    class="workspace-desktop min-h-full w-full bg-white px-6 py-6 lg:px-10"
    @contextmenu="onContextMenu"
  >
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[#172b4d]">
          {{ store.currentWorkspace?.name }}
        </h1>
        <p class="mt-0.5 text-sm text-[#626f86]">Tableros y proyectos de tu espacio de trabajo</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="canCreate && PROJECTS_MODULE_ENABLED"
          class="flex items-center gap-1.5 rounded-lg border border-[#091e4229] bg-white px-4 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#091e4208]"
          @click="router.push('/app/projects')"
        >
          <FolderKanban :size="16" />
          Proyectos
        </button>
        <button
          v-if="canCreate"
          class="btn-brand"
          @click="ui.openCreateBoard()"
        >
          Crear tablero
        </button>
      </div>
    </div>

    <section v-if="starredBoards.length" class="mb-10">
      <h2 class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
        <Star :size="14" />
        Destacados
      </h2>
      <div class="flex flex-wrap gap-4">
        <button
          v-for="{ board, stats } in starredBoards"
          :key="board.id"
          class="group relative h-32 w-56 overflow-hidden rounded-xl text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          :style="getBoardBackgroundThumbStyle(board.background)"
          @click="openBoard(board.id)"
        >
          <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />
          <div class="absolute inset-0 flex flex-col justify-end p-4">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · {{ stats.completed }} completadas
            </span>
            <div class="mt-2 h-1 overflow-hidden rounded-full bg-white/30">
              <div
                class="h-full rounded-full bg-white/90 transition-all"
                :style="{ width: `${progressPercent(stats)}%` }"
              />
            </div>
          </div>
        </button>
      </div>
    </section>

    <section v-if="sharedBoards.length" class="mb-10">
      <h2 class="mb-4 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
        Compartidos contigo
      </h2>
      <div class="flex flex-wrap gap-4">
        <button
          v-for="{ board, stats } in sharedBoards"
          :key="board.id"
          class="group relative h-32 w-56 overflow-hidden rounded-xl text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          :style="getBoardBackgroundThumbStyle(board.background)"
          @click="openBoard(board.id)"
        >
          <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />
          <div class="absolute inset-0 flex flex-col justify-end p-4">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · acceso compartido
            </span>
          </div>
        </button>
      </div>
    </section>

    <section v-if="PROJECTS_MODULE_ENABLED" class="mb-10">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
          <FolderKanban :size="14" />
          Proyectos
        </h2>
        <RouterLink to="/app/projects" class="text-xs font-medium text-[#f4845f] hover:underline">
          Ver escritorio completo
        </RouterLink>
      </div>
      <div class="workspace-desktop__grid">
        <RouterLink
          v-for="{ project, progress } in workspaceProjects"
          :key="project.id"
          :to="`/app/projects/${project.id}`"
          class="workspace-desktop__item"
          @click.stop
        >
          <ProjectFolderIcon :name="project.name" :status="project.status" :progress="progress" />
        </RouterLink>
        <RouterLink to="/app/projects" class="workspace-desktop__item workspace-desktop__item--new">
          <div class="project-folder project-folder--new">
            <div class="project-folder__icon-wrap project-folder__icon-wrap--new">
              <FolderKanban :size="26" class="text-brand-coral" />
            </div>
            <p class="project-folder__label">Ver todos</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xs font-semibold tracking-wide text-[#44546f] uppercase">
        Todos los tableros
      </h2>
      <div class="flex flex-wrap gap-4">
        <button
          v-for="{ board, stats } in allBoards"
          :key="board.id"
          class="group relative h-32 w-56 overflow-hidden rounded-xl text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
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
          <div class="absolute inset-0 flex flex-col justify-end p-4">
            <span class="text-sm font-bold text-white drop-shadow">{{ board.title }}</span>
            <span class="mt-0.5 text-[11px] text-white/80">
              {{ stats.total }} tareas · {{ stats.completed }} completadas
            </span>
            <div class="mt-2 h-1 overflow-hidden rounded-full bg-white/30">
              <div
                class="h-full rounded-full bg-white/90 transition-all"
                :style="{ width: `${progressPercent(stats)}%` }"
              />
            </div>
          </div>
        </button>

        <button
          v-if="canCreate"
          class="flex h-32 w-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#091e4229] bg-[#fafbfc] text-[#44546f] transition-colors hover:border-[#f4845f]/40 hover:bg-[#f4845f08]"
          @click="ui.openCreateBoard()"
        >
          <Plus :size="28" class="mb-1 text-brand-coral" />
          <span class="text-sm font-medium">Crear tablero</span>
        </button>
      </div>
    </section>

    <DesktopContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenuItems"
      @select="onContextMenuSelect"
      @close="closeContextMenu"
    />
  </div>
</template>
