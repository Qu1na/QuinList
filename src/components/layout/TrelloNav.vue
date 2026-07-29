<script setup lang="ts">
import { computed, watch, onUnmounted, ref, useAttrs } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, Search, Bell, ChevronDown, Plus, UserPlus, X, Users, BarChart3, LogOut, FolderKanban } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import AppLogo from '@/components/brand/AppLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'
import { useBoardShareStore } from '@/stores/boardShare'
import { useBoardPresenceStore } from '@/stores/boardPresence'
import { subscribeBoardShareRealtime } from '@/services/boardShare'
import { canManageMembers } from '@/utils/permissions'
import NotificationPanel from './NotificationPanel.vue'
import AppWindow from '@/components/ui/AppWindow.vue'
import { useProjectsStore } from '@/stores/projects'
import { PROJECTS_MODULE_ENABLED } from '@/config/features'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const route = useRoute()
const router = useRouter()
const store = useQuinListStore()
const auth = useAuthStore()
const notif = useNotificationStore()
const ui = useUiStore()
const boardShare = useBoardShareStore()
const presence = useBoardPresenceStore()
const projectsStore = useProjectsStore()

const isBoard = computed(() => route.name === 'board')
const boardId = computed(() => route.params.boardId as string | undefined)

const AVATAR_COLORS = ['#6554c0', '#0c66e4', '#e56910', '#61bd4f', '#cd5a91', '#00c2e0', '#c377e0']
const MAX_VISIBLE = 5
const showMembersModal = ref(false)
const showSearchResults = ref(false)
const showAccountMenu = ref(false)

const searchResults = computed(() => {
  if (!ui.searchQuery.trim()) return []
  return store.searchCards(ui.searchQuery)
})

function onSearchInput() {
  showSearchResults.value = ui.searchQuery.trim().length > 0
}

function selectSearchResult(cardId: string, boardIdResult: string) {
  router.push({ name: 'board', params: { boardId: boardIdResult } })
  ui.openCard(cardId)
  ui.searchQuery = ''
  showSearchResults.value = false
}

function hideSearchResults() {
  setTimeout(() => {
    showSearchResults.value = false
  }, 150)
}

interface ParticipantInfo {
  user: { id: string; name: string; email: string; initials: string }
  roleLabel: string
}

let unsubscribeParticipants: (() => void) | null = null

const board = computed(() =>
  boardId.value ? store.boards.find((b) => b.id === boardId.value) : undefined,
)

const participantDetails = computed((): ParticipantInfo[] => {
  if (!boardId.value) return []
  if (boardShare.participantsBoardId === boardId.value) {
    return boardShare.participants
  }
  return []
})

const boardParticipants = computed(() => participantDetails.value.map((p) => p.user))

const visibleParticipants = computed(() => boardParticipants.value.slice(0, MAX_VISIBLE))
const extraCount = computed(() => Math.max(0, boardParticipants.value.length - MAX_VISIBLE))

const canViewActivity = computed(() =>
  boardId.value ? canManageMembers(store.getBoardRole(boardId.value)) : false,
)

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]!
}

function openShare() {
  if (boardId.value) boardShare.openModal(boardId.value)
}

async function logout() {
  showAccountMenu.value = false
  void presence.unmount()
  notif.destroy()
  projectsStore.destroy()
  store.destroy()
  await auth.logout()
  router.push('/login')
}

watch(
  boardId,
  (id) => {
    unsubscribeParticipants?.()
    unsubscribeParticipants = null

    if (!id || route.name !== 'board') return

    boardShare.loadParticipants(id)
    unsubscribeParticipants = subscribeBoardShareRealtime(id, () => {
      boardShare.loadParticipants(id)
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  unsubscribeParticipants?.()
})
</script>

<template>
  <header
    class="relative z-30 flex h-12 shrink-0 items-center gap-3 px-4"
    :class="[attrs.class, isBoard ? 'bg-black/15 text-white backdrop-blur-sm' : 'app-header text-white']"
  >
    <button
      class="flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-white/20"
      @click="router.push({ name: 'home' })"
    >
      <AppLogo size="sm" />
    </button>

    <div class="relative hidden sm:block">
      <button
        class="flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium hover:bg-white/20"
      >
        {{ store.currentWorkspace?.name }}
        <ChevronDown :size="14" />
      </button>
    </div>

    <div class="relative mx-auto hidden max-w-md flex-1 md:block">
      <div
        class="flex items-center gap-2 rounded-md px-3 py-1.5"
        :class="isBoard ? 'bg-white/20' : 'bg-white/25'"
      >
        <Search :size="15" class="shrink-0 opacity-80" />
        <input
          v-model="ui.searchQuery"
          type="text"
          placeholder="Buscar tarjetas..."
          class="w-full bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
          @input="onSearchInput"
          @focus="onSearchInput"
          @blur="hideSearchResults"
        />
      </div>
      <div
        v-if="showSearchResults"
        class="scroll-thin absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg bg-white py-1 shadow-2xl"
      >
        <button
          v-for="card in searchResults"
          :key="card.id"
          class="flex w-full flex-col px-4 py-2.5 text-left hover:bg-slate-50"
          @mousedown.prevent="selectSearchResult(card.id, card.boardId)"
        >
          <span class="text-sm font-medium text-[#172b4d]">{{ card.title }}</span>
          <span class="text-xs text-[#626f86]">
            {{ store.boards.find((b) => b.id === card.boardId)?.title }}
          </span>
        </button>
        <p
          v-if="searchResults.length === 0"
          class="px-4 py-6 text-center text-sm text-[#626f86]"
        >
          No hay resultados para "{{ ui.searchQuery }}"
        </p>
      </div>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        v-if="!isBoard"
        class="flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white/35"
        @click="ui.openCreateBoard()"
      >
        <Plus :size="16" />
        Crear
      </button>

      <div v-if="isBoard" class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex items-center -space-x-2 rounded-full py-0.5 pr-1 transition-opacity hover:opacity-90"
          :title="`${boardParticipants.length} miembros`"
          @click="showMembersModal = true"
        >
          <span
            v-for="(user, index) in visibleParticipants"
            :key="user.id"
            class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black/25 text-[11px] font-bold text-white shadow-sm"
            :style="{ background: avatarColor(user.id), zIndex: visibleParticipants.length - index }"
            :title="canViewActivity && presence.isUserOnline(user.id) ? `${user.name} · En línea` : user.name"
          >
            {{ user.initials }}
            <span
              v-if="canViewActivity && presence.isUserOnline(user.id)"
              class="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-black/25"
              :class="presence.getUserPresence(user.id)?.status === 'editing' ? 'bg-amber-400' : 'bg-emerald-400'"
            />
          </span>
          <span
            v-if="extraCount > 0"
            class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black/25 bg-white/25 text-[10px] font-bold text-white backdrop-blur-sm"
          >
            +{{ extraCount }}
          </span>
        </button>

        <button
          class="flex items-center gap-1.5 rounded-md bg-black/25 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/35"
          @click="openShare"
        >
          <UserPlus :size="16" />
          <span class="hidden sm:inline">Compartir</span>
        </button>
      </div>

      <button
        class="relative rounded p-2 hover:bg-white/20"
        @click="notif.togglePanel()"
      >
        <Bell :size="18" />
        <span
          v-if="notif.unreadCount > 0"
          class="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"
        />
      </button>

      <div class="relative">
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full bg-[#6554c0] text-xs font-bold"
          :title="auth.currentUser?.name"
          @click="showAccountMenu = !showAccountMenu"
        >
          {{ auth.currentUser?.initials }}
        </button>

        <div
          v-if="showAccountMenu"
          class="fixed inset-0 z-[1500]"
          @click="showAccountMenu = false"
        />
        <div
          v-if="showAccountMenu"
          class="absolute right-0 top-full z-[1501] mt-2 w-72 overflow-hidden rounded-xl border border-[#091e4214] bg-white py-2 shadow-xl"
        >
          <p class="px-4 py-1 text-[11px] font-semibold tracking-wide text-[#626f86] uppercase">
            Cuenta
          </p>
          <div class="flex items-center gap-3 px-4 py-2">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-sm font-bold text-white"
            >
              {{ auth.currentUser?.initials }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-[#172b4d]">{{ auth.currentUser?.name }}</p>
              <p class="truncate text-xs text-[#626f86]">{{ auth.currentUser?.email }}</p>
            </div>
          </div>

          <div class="my-2 border-t border-[#091e4214]" />

          <p class="px-4 py-1 text-[11px] font-semibold tracking-wide text-[#626f86] uppercase">
            QuinList
          </p>
          <RouterLink
            to="/app/settings"
            class="block px-4 py-2 text-sm text-[#172b4d] hover:bg-[#091e420a]"
            @click="showAccountMenu = false"
          >
            Perfil y visibilidad
          </RouterLink>
          <RouterLink
            v-if="PROJECTS_MODULE_ENABLED"
            to="/app/projects"
            class="flex items-center gap-2 px-4 py-2 text-sm text-[#172b4d] hover:bg-[#091e420a]"
            @click="showAccountMenu = false"
          >
            <FolderKanban :size="14" />
            Proyectos
          </RouterLink>
          <RouterLink
            to="/app/reports"
            class="flex items-center gap-2 px-4 py-2 text-sm text-[#172b4d] hover:bg-[#091e420a]"
            @click="showAccountMenu = false"
          >
            <BarChart3 :size="14" />
            Métricas
          </RouterLink>
          <RouterLink
            to="/app/team"
            class="flex items-center gap-2 px-4 py-2 text-sm text-[#172b4d] hover:bg-[#091e420a]"
            @click="showAccountMenu = false"
          >
            <Users :size="14" />
            Equipo
          </RouterLink>

          <div class="my-2 border-t border-[#091e4214]" />

          <button
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#172b4d] hover:bg-[#091e420a]"
            @click="logout"
          >
            <LogOut :size="14" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>

    <NotificationPanel v-if="notif.showPanel" />
  </header>

  <Teleport to="body">
    <div
      v-if="showMembersModal && isBoard"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="showMembersModal = false"
    >
      <AppWindow
        title="Miembros del tablero"
        :subtitle="board?.title"
        class="app-window--md"
        @close="showMembersModal = false"
      >
        <ul class="max-h-[50vh] overflow-y-auto -mx-1">
          <li
            v-for="{ user, roleLabel: rLabel } in participantDetails"
            :key="user.id"
            class="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-[#091e420a]"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              :style="{ background: avatarColor(user.id) }"
            >
              {{ user.initials }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-[#172b4d]">{{ user.name }}</p>
              <p class="truncate text-sm text-[#626f86]">{{ user.email }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-[#091e420f] px-2.5 py-1 text-xs font-medium text-[#44546f]">
              {{ rLabel }}
            </span>
          </li>
          <li
            v-if="participantDetails.length === 0"
            class="px-2 py-8 text-center text-sm text-[#626f86]"
          >
            No hay miembros en este tablero
          </li>
        </ul>

        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="showMembersModal = false">
              Cerrar
            </button>
            <button
              type="button"
              class="btn-brand"
              @click="showMembersModal = false; openShare()"
            >
              Invitar a alguien
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
