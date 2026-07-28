<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, HelpCircle, Bell, Settings } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'
import NotificationPanel from './NotificationPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useQuinListStore()
const auth = useAuthStore()
const notif = useNotificationStore()
const ui = useUiStore()

const showSearchResults = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    home: 'Inicio',
    board: store.currentBoard?.title ?? 'Tablero',
    calendar: 'Calendario',
    reports: 'Reportes',
    issues: 'Issues',
    releases: 'Releases',
    team: 'Equipo',
    settings: 'Configuración',
  }
  return titles[route.name as string] ?? 'QuinList'
})

const searchResults = computed(() => {
  if (!ui.searchQuery.trim()) return []
  return store.searchCards(ui.searchQuery)
})

function onSearchInput() {
  showSearchResults.value = ui.searchQuery.trim().length > 0
}

function selectSearchResult(cardId: string, boardId: string) {
  router.push(`/board/${boardId}`)
  ui.openCard(cardId)
  ui.searchQuery = ''
  showSearchResults.value = false
}

function hideSearchResults() {
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}
</script>

<template>
  <header class="relative z-10 flex items-center gap-6 border-b border-slate-200 bg-white px-6 py-3">
    <div class="flex min-w-40 flex-col">
      <span class="text-xs font-medium text-slate-500">#{{ store.currentWorkspace?.name }}</span>
      <h1 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h1>
    </div>

    <div class="relative max-w-md flex-1">
      <div class="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
        <Search :size="16" class="shrink-0 text-slate-400" />
        <input
          v-model="ui.searchQuery"
          type="text"
          placeholder="Buscar tarea, proyecto, etiqueta..."
          class="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          @input="onSearchInput"
          @focus="onSearchInput"
          @blur="hideSearchResults"
        />
      </div>
      <div
        v-if="showSearchResults"
        class="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg bg-white p-2 shadow-xl"
      >
        <p v-if="searchResults.length === 0" class="px-3 py-2 text-sm text-slate-400">
          Sin resultados
        </p>
        <button
          v-for="card in searchResults"
          :key="card.id"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          @mousedown.prevent="selectSearchResult(card.id, card.boardId)"
        >
          {{ card.title }}
        </button>
      </div>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-200"
        title="Ayuda"
      >
        <HelpCircle :size="18" />
      </button>
      <button
        class="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-200"
        title="Notificaciones"
        @click="notif.togglePanel()"
      >
        <Bell :size="18" />
        <span
          v-if="notif.unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white"
        >
          {{ notif.unreadCount }}
        </span>
      </button>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-200"
        title="Configuración"
      >
        <Settings :size="18" />
      </button>
      <div
        class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white"
        :title="auth.currentUser?.name"
      >
        {{ auth.currentUser?.initials }}
      </div>
    </div>

    <NotificationPanel v-if="notif.showPanel" />
  </header>
</template>
