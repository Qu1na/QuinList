<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Bug,
  Rocket,
  Users,
  Settings,
  Plus,
  CalendarClock,
  Target,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import AppLogo from '@/components/brand/AppLogo.vue'

const store = useQuinListStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const navItems = computed(() => [
  { icon: LayoutDashboard, label: 'Inicio', to: '/app' },
  { icon: Calendar, label: 'Calendario', to: '/app/calendar' },
  { icon: CalendarClock, label: 'Eventos', to: '/app/events' },
  { icon: Target, label: 'Objetivos', to: '/app/okrs' },
  { icon: BarChart3, label: 'Reportes', to: '/app/reports' },
  { icon: Bug, label: 'Issues', to: '/app/issues' },
  { icon: Rocket, label: 'Releases', to: '/app/releases' },
  { icon: Users, label: 'Equipo', to: '/app/team' },
  { icon: Settings, label: 'Configuración', to: '/app/settings' },
])

const workspaces = computed(() => store.workspaces)

function isActive(path: string) {
  if (path === '/app') return route.path === '/app' || route.path.startsWith('/app/board/')
  return route.path === path
}

function selectWorkspace(id: string) {
  store.setCurrentWorkspace(id)
  router.push({ name: 'home' })
}

function openBoard(boardId: string) {
  store.setCurrentBoard(boardId)
  router.push({ name: 'board', params: { boardId } })
}
</script>

<template>
  <aside
    class="flex h-screen w-56 min-w-56 flex-col overflow-y-auto bg-gradient-to-b from-[#1a2b4a] to-[#0f1c33] px-3 py-4 text-slate-300"
  >
    <button class="px-3 pb-6 text-left" @click="router.push({ name: 'home' })">
      <AppLogo size="sm" />
    </button>

    <nav class="mb-6 flex flex-col gap-0.5">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
        :class="
          isActive(item.to)
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        "
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="flex-1">
      <p class="mb-2 px-3 text-[0.7rem] font-medium uppercase tracking-wider text-slate-500">
        Espacios
      </p>
      <button
        v-for="ws in workspaces"
        :key="ws.id"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors"
        :class="
          ws.id === store.currentWorkspaceId
            ? 'bg-white/5 text-slate-200'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        "
        @click="selectWorkspace(ws.id)"
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[0.7rem] font-bold text-white"
          :style="{ background: ws.color }"
        >
          {{ ws.icon }}
        </span>
        <span>{{ ws.name }}</span>
      </button>

      <p class="mt-4 mb-2 px-3 text-[0.7rem] font-medium uppercase tracking-wider text-slate-500">
        Tableros
      </p>
      <button
        v-for="board in store.workspaceBoards"
        :key="board.id"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
        :class="
          route.params.boardId === board.id
            ? 'bg-white/5 text-slate-200'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        "
        @click="openBoard(board.id)"
      >
        <span class="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
        <span class="truncate">{{ board.title }}</span>
      </button>
    </div>

    <div class="pt-4">
      <button
        class="flex w-full items-center justify-center rounded-lg border border-dashed border-blue-500/40 bg-blue-500/15 py-3 text-blue-400 transition-colors hover:bg-blue-500/25"
        title="Crear espacio"
        @click="ui.openCreateWorkspace()"
      >
        <Plus :size="20" />
      </button>
    </div>
  </aside>
</template>
