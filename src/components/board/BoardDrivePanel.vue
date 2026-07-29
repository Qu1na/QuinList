<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  HardDrive,
  Search,
  Paperclip,
  Download,
  ExternalLink,
  FileText,
} from '@lucide/vue'
import { useBoardDriveStore } from '@/stores/boardDrive'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useBoardShareStore } from '@/stores/boardShare'
import {
  collectBoardAttachments,
  formatFileSize,
  fileTypeLabel,
  isImageAttachment,
  totalDriveSize,
  type BoardDriveItem,
} from '@/utils/boardDrive'
import RelativeTime from '@/components/ui/RelativeTime.vue'
import AppWindowPanel from '@/components/ui/AppWindowPanel.vue'
import { openAttachment, downloadAttachment } from '@/services/storage'
import AttachmentMedia from '@/components/board/AttachmentMedia.vue'

const drive = useBoardDriveStore()
const store = useQuinListStore()
const auth = useAuthStore()
const ui = useUiStore()
const boardShare = useBoardShareStore()

const search = ref('')
const typeFilter = ref<'all' | 'images' | 'documents'>('all')

const AVATAR_COLORS = ['#6554c0', '#0c66e4', '#e56910', '#61bd4f', '#cd5a91', '#00c2e0', '#c377e0']

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]!
}

const boardId = computed(() => store.currentBoardId)

const listTitleById = computed(() => {
  const map = new Map<string, string>()
  const board = store.boards.find((b) => b.id === boardId.value)
  for (const list of board?.lists ?? []) {
    map.set(list.id, list.title)
  }
  return map
})

const allItems = computed(() => {
  if (!boardId.value) return []
  const boardCards = store.getBoardCards(boardId.value)
  return collectBoardAttachments(boardId.value, boardCards, listTitleById.value)
})

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allItems.value.filter((item) => {
    if (typeFilter.value === 'images' && !isImageAttachment(item.type)) return false
    if (typeFilter.value === 'documents' && isImageAttachment(item.type)) return false
    if (!q) return true
    const uploader = resolveUserName(item.uploadedBy).toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.cardTitle.toLowerCase().includes(q) ||
      item.listTitle.toLowerCase().includes(q) ||
      uploader.includes(q)
    )
  })
})

const totalSize = computed(() => formatFileSize(totalDriveSize(allItems.value)))

function resolveUserName(userId: string): string {
  const fromAuth = auth.getUserById(userId)
  if (fromAuth) return fromAuth.name
  const participant = boardShare.participants.find((p) => p.user.id === userId)
  return participant?.user.name ?? 'Usuario'
}

function resolveUserInitials(userId: string): string {
  const fromAuth = auth.getUserById(userId)
  if (fromAuth) return fromAuth.initials
  const participant = boardShare.participants.find((p) => p.user.id === userId)
  return participant?.user.initials ?? '?'
}

function openCard(item: BoardDriveItem) {
  drive.closePanel()
  ui.openCard(item.cardId)
}

function close() {
  drive.closePanel()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="drive.showPanel"
      class="app-window-overlay fixed inset-0 z-[2000] flex justify-end"
      @click.self="close"
    >
      <AppWindowPanel
        title="Drive del tablero"
        :subtitle="`${allItems.length} archivo${allItems.length === 1 ? '' : 's'} · ${totalSize}`"
        max-width="lg"
        @close="close"
      >
        <div class="space-y-3 border-b border-[#091e4214] pb-3">
          <div class="relative">
            <Search :size="15" class="absolute top-1/2 left-3 -translate-y-1/2 text-[#626f86]" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por archivo, tarjeta o usuario…"
              class="w-full rounded-lg border border-[#091e4221] py-2 pr-3 pl-9 text-sm text-[#172b4d] outline-none focus:border-[#388bff] focus:ring-2 focus:ring-[#388bff33]"
            />
          </div>

          <div class="flex gap-1">
            <button
              v-for="opt in [
                { id: 'all', label: 'Todos' },
                { id: 'images', label: 'Imágenes' },
                { id: 'documents', label: 'Documentos' },
              ] as const"
              :key="opt.id"
              class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              :class="
                typeFilter === opt.id
                  ? 'bg-[#0c66e4] text-white'
                  : 'bg-[#091e420f] text-[#44546f] hover:bg-[#091e4221]'
              "
              @click="typeFilter = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="scroll-thin min-h-0 flex-1 overflow-y-auto pt-3">
          <ul v-if="filteredItems.length" class="space-y-2">
            <li
              v-for="item in filteredItems"
              :key="item.id"
              class="flex gap-3 rounded-lg border border-[#091e4214] p-3 transition-colors hover:bg-[#091e420a]"
            >
              <button
                type="button"
                class="relative shrink-0 overflow-hidden rounded-md bg-[#091e420f]"
                @click="openAttachment(item)"
              >
                <AttachmentMedia
                  v-if="isImageAttachment(item.type)"
                  :attachment="item"
                  preview-only
                  image-class="h-14 w-14 object-cover"
                />
                <div
                  v-else
                  class="flex h-14 w-14 flex-col items-center justify-center gap-0.5 text-[#626f86]"
                >
                  <FileText v-if="item.type === 'application/pdf'" :size="22" />
                  <Paperclip v-else :size="20" />
                  <span class="text-[8px] font-medium uppercase">
                    {{ fileTypeLabel(item.type).slice(0, 6) }}
                  </span>
                </div>
              </button>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-[#172b4d]" :title="item.name">
                  {{ item.name }}
                </p>
                <p class="text-xs text-[#626f86]">
                  {{ formatFileSize(item.size) }} · {{ fileTypeLabel(item.type) }}
                </p>
                <button
                  class="mt-0.5 truncate text-left text-xs font-medium text-[#0c66e4] hover:underline"
                  :title="`Abrir tarjeta: ${item.cardTitle}`"
                  @click="openCard(item)"
                >
                  {{ item.cardTitle }}
                  <span class="font-normal text-[#626f86]">· {{ item.listTitle }}</span>
                </button>

                <div class="mt-1.5 flex items-center gap-1.5">
                  <span
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    :style="{ background: avatarColor(item.uploadedBy) }"
                  >
                    {{ resolveUserInitials(item.uploadedBy) }}
                  </span>
                  <span class="truncate text-xs text-[#626f86]">
                    {{ resolveUserName(item.uploadedBy) }}
                  </span>
                  <span class="text-[#091e4221]">·</span>
                  <time class="shrink-0 text-xs text-[#626f86]">
                    <RelativeTime :iso="item.uploadedAt" />
                  </time>
                </div>
              </div>

              <div class="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  class="rounded p-1.5 text-[#626f86] hover:bg-[#091e420f] hover:text-[#172b4d]"
                  title="Descargar"
                  @click="downloadAttachment(item)"
                >
                  <Download :size="15" />
                </button>
                <button
                  type="button"
                  class="rounded p-1.5 text-[#626f86] hover:bg-[#091e420f] hover:text-[#172b4d]"
                  title="Abrir"
                  @click="openAttachment(item)"
                >
                  <ExternalLink :size="15" />
                </button>
              </div>
            </li>
          </ul>

          <div
            v-else-if="allItems.length === 0"
            class="flex flex-col items-center justify-center px-4 py-16 text-center"
          >
            <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#091e420f]">
              <HardDrive :size="28" class="text-[#626f86]" />
            </div>
            <p class="text-sm font-medium text-[#172b4d]">Sin archivos adjuntos</p>
            <p class="mt-1 max-w-xs text-xs text-[#626f86]">
              Los archivos que se suban a las tarjetas de este tablero aparecerán aquí.
            </p>
          </div>

          <div v-else class="px-4 py-12 text-center text-sm text-[#626f86]">
            No hay resultados para «{{ search }}»
          </div>
        </div>
      </AppWindowPanel>
    </div>
  </Teleport>
</template>
