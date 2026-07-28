<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import { MoreHorizontal, X, Pencil, Trash2 } from '@lucide/vue'
import type { Card, List } from '@/types'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { useBoardPresenceStore } from '@/stores/boardPresence'
import { useAuthStore } from '@/stores/auth'
import { beginKanbanDrag, endKanbanDrag } from '@/composables/useKanbanDrag'
import KanbanCard from './KanbanCard.vue'

const props = defineProps<{
  list: List
  canEdit: boolean
}>()

const store = useQuinListStore()
const ui = useUiStore()
const auth = useAuthStore()
const presence = useBoardPresenceStore()

const localCards = ref<Card[]>([])
const isAdding = ref(false)
const newTitle = ref('')
const isDragging = ref(false)
const addInput = ref<HTMLTextAreaElement | null>(null)
const showMenu = ref(false)
const isEditingTitle = ref(false)
const editTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const listTitle = computed(
  () => store.getListsByBoard(props.list.boardId).find((l) => l.id === props.list.id)?.title ?? props.list.title,
)

/** Mantiene referencias al store (sin copiar) para reactividad instantánea. */
function syncFromStore() {
  if (isDragging.value) return
  let cards = [...store.getCardsByList(props.list.id)]
  if (ui.focusMode && auth.currentUserId) {
    cards = cards.filter((c) => c.assigneeIds.includes(auth.currentUserId!))
  }
  localCards.value = cards
}

watch(() => store.cardsRevision, syncFromStore, { immediate: true })
watch(() => props.list.id, syncFromStore)
watch(() => ui.focusMode, syncFromStore)

watch(isAdding, (adding) => {
  if (adding) {
    void presence.setActivity('editing', 'Creando tarjeta')
  } else if (!isDragging.value && !ui.selectedCardId) {
    void presence.setActivity('online')
  }
})

function onDragStart() {
  isDragging.value = true
  beginKanbanDrag()
  store.beginCardDrag()
  void presence.setActivity('editing', 'Moviendo tarjetas')
}

function onDragChange(evt: {
  added?: { element: Card; newIndex: number }
  moved?: { element: Card; newIndex: number }
}) {
  if (evt.added) {
    store.moveCard(evt.added.element.id, props.list.id, evt.added.newIndex, true)
  } else if (evt.moved) {
    store.moveCard(evt.moved.element.id, props.list.id, evt.moved.newIndex, true)
  }
}

function onDragEnd() {
  void store.waitForCardMove().finally(() => {
    isDragging.value = false
    endKanbanDrag()
    store.endCardDrag()
    syncFromStore()
    void presence.setActivity('online')
  })
}

function startAdding() {
  isAdding.value = true
  setTimeout(() => addInput.value?.focus(), 50)
}

function cancelAdding() {
  isAdding.value = false
  newTitle.value = ''
}

function submitCard() {
  if (!newTitle.value.trim()) return
  store.createCard(props.list.id, newTitle.value.trim())
  newTitle.value = ''
  isAdding.value = false
}

function onAddKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitCard()
  }
  if (e.key === 'Escape') cancelAdding()
}

function startEditTitle() {
  editTitle.value = listTitle.value
  isEditingTitle.value = true
  showMenu.value = false
  setTimeout(() => titleInput.value?.focus(), 50)
}

function saveTitle() {
  if (editTitle.value.trim()) {
    store.updateList(props.list.id, editTitle.value.trim())
  }
  isEditingTitle.value = false
}

function onTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveTitle()
  }
  if (e.key === 'Escape') isEditingTitle.value = false
}

async function deleteList() {
  showMenu.value = false
  const confirmed = await ui.confirm({
    title: 'Eliminar lista',
    message: `¿Eliminar "${listTitle.value}"? Las tarjetas se moverán a otra lista.`,
    confirmText: 'Eliminar',
    variant: 'danger',
  })
  if (confirmed) store.deleteList(props.list.id)
}

function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (isDragging.value) endKanbanDrag()
})
</script>

<template>
  <div
    class="flex max-h-full min-h-0 w-[272px] shrink-0 flex-col rounded-xl bg-[#f1f2f4]/95 backdrop-blur-sm"
  >
    <div class="relative flex items-center gap-1 px-2 py-2">
      <input
        v-if="isEditingTitle && canEdit"
        ref="titleInput"
        v-model="editTitle"
        class="flex-1 rounded border border-[#388bff] bg-white px-2 py-1 text-sm font-semibold text-[#172b4d] outline-none"
        @blur="saveTitle"
        @keydown.enter.prevent="saveTitle"
        @keydown="onTitleKeydown"
      />
      <h3
        v-else
        class="flex-1 cursor-pointer truncate rounded px-2 py-1 text-sm font-semibold text-[#172b4d] hover:bg-[#091e4221]"
        :title="listTitle"
        @click="canEdit && startEditTitle()"
      >
        {{ listTitle }}
      </h3>
      <span class="shrink-0 rounded-full bg-[#091e4221] px-2 py-0.5 text-[11px] text-[#44546f]">
        {{ localCards.length }}
      </span>
      <div v-if="canEdit" ref="menuRef" class="relative">
        <button
          class="rounded p-1.5 text-[#44546f] hover:bg-[#091e4221]"
          @click.stop="showMenu = !showMenu"
        >
          <MoreHorizontal :size="16" />
        </button>
        <div
          v-if="showMenu"
          class="absolute top-full right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border border-[#091e4221] bg-white py-1 shadow-lg"
        >
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#172b4d] hover:bg-[#091e4221]"
            @click="startEditTitle"
          >
            <Pencil :size="14" />
            Editar lista
          </button>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            @click="deleteList"
          >
            <Trash2 :size="14" />
            Eliminar lista
          </button>
        </div>
      </div>
    </div>

    <div class="scroll-thin kanban-list-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
      <draggable
        v-model="localCards"
        group="cards"
        item-key="id"
        tag="div"
        class="kanban-drop-zone flex min-h-[48px] flex-1 flex-col gap-2 pb-1"
        :disabled="!canEdit"
        :animation="200"
        easing="cubic-bezier(0.2, 0, 0, 1)"
        ghost-class="kanban-ghost"
        chosen-class="kanban-chosen"
        drag-class="kanban-dragging"
        filter=".no-drag"
        :prevent-on-filter="false"
        :scroll="true"
        :bubble-scroll="true"
        :scroll-sensitivity="100"
        :scroll-speed="16"
        :force-fallback="true"
        :fallback-on-body="true"
        :fallback-tolerance="5"
        :empty-insert-threshold="24"
        :swap-threshold="0.65"
        direction="vertical"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <KanbanCard :card="element" @open="ui.openCard(element.id)" />
        </template>
      </draggable>
    </div>

    <div v-if="canEdit" class="p-2 pt-0">
      <div v-if="isAdding" class="rounded-lg bg-white p-2 shadow-sm">
        <textarea
          ref="addInput"
          v-model="newTitle"
          rows="2"
          placeholder="Introduce un título para esta tarjeta..."
          class="w-full resize-none rounded border border-[#388bff] px-2 py-1.5 text-sm text-[#172b4d] outline-none"
          @keydown="onAddKeydown"
        />
        <div class="mt-2 flex items-center gap-2">
          <button
            class="rounded bg-[#0c66e4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc]"
            @click="submitCard"
          >
            Añadir tarjeta
          </button>
          <button class="rounded p-1.5 text-[#44546f] hover:bg-[#091e4221]" @click="cancelAdding">
            <X :size="18" />
          </button>
        </div>
      </div>
      <button
        v-else
        class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-[#44546f] hover:bg-[#091e4221]"
        @click="startAdding"
      >
        + Añadir una tarjeta
      </button>
    </div>
  </div>
</template>
