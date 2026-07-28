<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { canEdit } from '@/utils/permissions'
import KanbanList from './KanbanList.vue'

const store = useQuinListStore()
const ui = useUiStore()

const isAddingList = ref(false)
const newListTitle = ref('')

const lists = computed(() => store.getListsByBoard(store.currentBoardId))
const canEditBoard = computed(() => canEdit(store.getBoardRole(store.currentBoardId)))

function startAddList() {
  isAddingList.value = true
}

function submitList() {
  if (!newListTitle.value.trim()) return
  store.createList(store.currentBoardId, newListTitle.value.trim())
  newListTitle.value = ''
  isAddingList.value = false
}

function cancelList() {
  isAddingList.value = false
  newListTitle.value = ''
}
</script>

<template>
  <div class="kanban-scroll kanban-board-scroll flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-4 pb-3">
    <KanbanList v-for="list in lists" :key="list.id" :list="list" :can-edit="canEditBoard" />

    <div v-if="canEditBoard" class="w-[272px] shrink-0">
      <div
        v-if="isAddingList"
        class="rounded-xl bg-[#f1f2f4]/95 p-2 backdrop-blur-sm"
      >
        <input
          v-model="newListTitle"
          placeholder="Introduce el título de la lista..."
          class="w-full rounded-lg border border-[#388bff] px-3 py-2 text-sm text-[#172b4d] outline-none"
          autofocus
          @keyup.enter="submitList"
          @keyup.escape="cancelList"
        />
        <div class="mt-2 flex gap-2">
          <button
            class="rounded bg-[#0c66e4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc]"
            @click="submitList"
          >
            Añadir lista
          </button>
          <button class="text-sm text-[#44546f] hover:underline" @click="cancelList">
            Cancelar
          </button>
        </div>
      </div>
      <button
        v-else
        class="flex w-full items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
        @click="startAddList"
      >
        <Plus :size="16" />
        Añadir otra lista
      </button>
    </div>
  </div>
</template>
