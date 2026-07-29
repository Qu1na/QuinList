<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Star,
  Zap,
  MoreHorizontal,
  Palette,
  BarChart3,
  Pencil,
  Target,
  Activity,
  HardDrive,
  Trash2,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useIntegrationsStore } from '@/stores/integrations'
import { useUiStore } from '@/stores/ui'
import { useBoardPresenceStore } from '@/stores/boardPresence'
import { useBoardDriveStore } from '@/stores/boardDrive'
import { canEdit, canManageMembers } from '@/utils/permissions'
import {
  BOARD_BACKGROUNDS,
  getBoardBackground,
  getBoardBackgroundThumbStyle,
} from '@/utils/boardBackgrounds'
import AppWindow from '@/components/ui/AppWindow.vue'

const props = defineProps<{ boardId: string }>()

const store = useQuinListStore()
const integrations = useIntegrationsStore()
const ui = useUiStore()
const presence = useBoardPresenceStore()
const drive = useBoardDriveStore()
const router = useRouter()

const board = computed(() => store.boards.find((b) => b.id === props.boardId))
const canEditBoard = computed(() =>
  board.value ? canEdit(store.getBoardRole(board.value.id)) : false,
)
const canViewActivity = computed(() =>
  board.value ? canManageMembers(store.getBoardRole(board.value.id)) : false,
)
const canViewDrive = canViewActivity
const canDeleteBoard = canViewActivity
const activeEditors = computed(() => presence.editingCount + presence.onlineCount)
const driveFileCount = computed(() => {
  if (!board.value) return 0
  return store.getBoardCards(board.value.id).reduce(
    (sum, card) => sum + (card.attachments?.length ?? 0),
    0,
  )
})

function toggleDrive() {
  presence.closePanel()
  drive.togglePanel()
}

function toggleActivity() {
  drive.closePanel()
  presence.togglePanel()
}

const showBgPicker = ref(false)
const showMenu = ref(false)

function openBgPicker() {
  showBgPicker.value = true
  showMenu.value = false
}

function toggleStar() {
  if (board.value) store.toggleBoardStar(board.value.id)
}

function openPowerUps() {
  integrations.openPanel(props.boardId)
  showMenu.value = false
}

function setBackground(id: string) {
  store.setBoardBackground(props.boardId, id)
  showBgPicker.value = false
}

async function renameBoard() {
  if (!board.value) return
  const title = await ui.prompt({
    title: 'Renombrar tablero',
    label: 'Nombre',
    defaultValue: board.value.title,
    confirmText: 'Guardar',
  })
  if (title?.trim()) {
    await store.renameBoard(props.boardId, title.trim())
  }
  showMenu.value = false
}

function goReports() {
  router.push('/app/reports')
  showMenu.value = false
}

async function deleteBoard() {
  if (!board.value) return
  showMenu.value = false
  const confirmed = await ui.confirm({
    title: 'Eliminar tablero',
    message: `¿Eliminar «${board.value.title}»? Se borrarán todas las listas y tarjetas. Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar tablero',
    variant: 'danger',
  })
  if (!confirmed) return
  const id = board.value.id
  await store.deleteBoard(id)
  router.push({ name: 'home' })
}

function toggleFocus() {
  ui.toggleFocusMode()
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('[data-board-menu]')) showMenu.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div v-if="board" class="flex shrink-0 items-center gap-2 px-4 py-2">
    <button
      class="rounded px-3 py-1.5 text-lg font-bold text-white hover:bg-white/20"
      @click="router.push({ name: 'home' })"
    >
      {{ board.title }}
    </button>

    <button
      class="rounded p-1.5 text-white hover:bg-white/20"
      :class="{ 'text-yellow-300': board.starred }"
      title="Destacar tablero"
      @click="toggleStar"
    >
      <Star :size="18" :fill="board.starred ? 'currentColor' : 'none'" />
    </button>

    <div class="flex-1" />

    <button
      v-if="canViewDrive"
      class="relative flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium text-white transition-colors"
      :class="drive.showPanel ? 'bg-white/35 ring-1 ring-white/50' : 'bg-white/20 hover:bg-white/30'"
      title="Ver todos los archivos adjuntos del tablero"
      @click="toggleDrive"
    >
      <HardDrive :size="15" />
      <span class="hidden sm:inline">Drive</span>
      <span
        v-if="driveFileCount > 0"
        class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6554c0] px-1 text-[9px] font-bold text-white ring-2 ring-[#0052cc]"
      >
        {{ driveFileCount > 9 ? '9+' : driveFileCount }}
      </span>
    </button>

    <button
      v-if="canViewActivity"
      class="relative flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium text-white transition-colors"
      :class="presence.showPanel ? 'bg-white/35 ring-1 ring-white/50' : 'bg-white/20 hover:bg-white/30'"
      title="Ver quién está en línea y editando"
      @click="toggleActivity"
    >
      <Activity :size="15" />
      <span class="hidden sm:inline">Actividad</span>
      <span
        v-if="activeEditors > 0"
        class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#0052cc]"
      >
        {{ activeEditors > 9 ? '9+' : activeEditors }}
      </span>
    </button>

    <button
      class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium text-white transition-colors"
      :class="ui.focusMode ? 'bg-white/35 ring-1 ring-white/50' : 'bg-white/20 hover:bg-white/30'"
      title="Ver solo mis tareas asignadas"
      @click="toggleFocus"
    >
      <Target :size="15" />
      <span class="hidden sm:inline">Mi enfoque</span>
    </button>

    <button
      class="flex items-center gap-1.5 rounded bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30"
      @click="openPowerUps"
    >
      <Zap :size="15" />
      Integraciones
    </button>

    <button
      v-if="canEditBoard"
      class="rounded p-1.5 text-white hover:bg-white/20"
      title="Cambiar fondo"
      @click="openBgPicker"
    >
      <Palette :size="18" />
    </button>

    <div class="relative" data-board-menu>
      <button
        class="rounded p-1.5 text-white hover:bg-white/20"
        @click.stop="showMenu = !showMenu"
      >
        <MoreHorizontal :size="18" />
      </button>
      <div
        v-if="showMenu"
        class="absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg bg-white py-1 shadow-xl"
      >
        <button
          v-if="canEditBoard"
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#172b4d] hover:bg-slate-50"
          @click="renameBoard"
        >
          <Pencil :size="15" />
          Renombrar
        </button>
        <button
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#172b4d] hover:bg-slate-50"
          @click="goReports"
        >
          <BarChart3 :size="15" />
          Ver métricas
        </button>
        <div v-if="canDeleteBoard" class="my-1 border-t border-[#091e4214]" />
        <button
          v-if="canDeleteBoard"
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#44546f] hover:bg-[#091e420a]"
          @click="deleteBoard"
        >
          <Trash2 :size="15" />
          Eliminar tablero
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="showBgPicker"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="showBgPicker = false"
    >
      <AppWindow
        title="Fondo del tablero"
        subtitle="Elige una imagen para tu tablero"
        class="app-window--md"
        @close="showBgPicker = false"
      >
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="bg in BOARD_BACKGROUNDS"
            :key="bg.id"
            type="button"
            class="group relative h-20 overflow-hidden rounded-lg ring-2 ring-transparent transition-all hover:ring-[#5bbce4]"
            :class="{ 'ring-[#2d7eb8] ring-offset-2': getBoardBackground(board?.background).id === bg.id }"
            :style="getBoardBackgroundThumbStyle(bg.id)"
            :title="bg.label"
            @click="setBackground(bg.id)"
          >
            <span
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5 text-left text-[10px] font-medium text-white"
            >
              {{ bg.label }}
            </span>
          </button>
        </div>
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand" @click="showBgPicker = false">Listo</button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
