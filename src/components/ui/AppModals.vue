<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import { useQuinListStore } from '@/stores/quinlist'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const store = useQuinListStore()
const router = useRouter()

const promptValue = ref('')
const boardTitle = ref('')
const boardDescription = ref('')
const listTitle = ref('')
const taskTitle = ref('')
const taskListId = ref('')
const workspaceName = ref('')
const workspaceColor = ref('#2563eb')

const lists = computed(() =>
  ui.createTaskListId
    ? store.getListsByBoard(store.currentBoardId)
    : store.getListsByBoard(store.currentBoardId),
)

watch(
  () => ui.activeModal,
  (modal) => {
    if (modal === 'prompt') promptValue.value = ui.promptOptions?.defaultValue ?? ''
    if (modal === 'createBoard') {
      boardTitle.value = ''
      boardDescription.value = ''
    }
    if (modal === 'createList') listTitle.value = ''
    if (modal === 'createTask') {
      taskTitle.value = ''
      taskListId.value =
        ui.createTaskListId ??
        store.getListsByBoard(store.currentBoardId).find((l) => l.title === 'Por hacer')?.id ??
        store.getListsByBoard(store.currentBoardId)[0]?.id ??
        ''
    }
    if (modal === 'createWorkspace') {
      workspaceName.value = ''
      workspaceColor.value = '#2563eb'
    }
  },
)

function submitPrompt() {
  ui.resolvePrompt(promptValue.value.trim() || null)
}

async function submitBoard() {
  if (!boardTitle.value.trim()) return
  const board = await store.createBoard(
    store.currentWorkspaceId,
    boardTitle.value.trim(),
    boardDescription.value.trim(),
  )
  ui.closeModal()
  if (board) router.push(`/board/${board.id}`)
}

function submitList() {
  if (!listTitle.value.trim() || !ui.createListBoardId) return
  store.createList(ui.createListBoardId, listTitle.value.trim())
  ui.closeModal()
}

async function submitTask() {
  if (!taskTitle.value.trim() || !taskListId.value) return
  const card = await store.createCard(taskListId.value, taskTitle.value.trim())
  ui.closeModal()
  if (card) ui.openCard(card.id)
}

function submitWorkspace() {
  if (!workspaceName.value.trim()) return
  store.createWorkspace(workspaceName.value.trim(), workspaceName.value[0] ?? 'W', workspaceColor.value)
  ui.closeModal()
}
</script>

<template>
  <!-- Confirm -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'confirm' && ui.confirmOptions"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.resolveConfirm(false)"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800">{{ ui.confirmOptions.title }}</h3>
        <p class="mt-2 text-sm text-slate-600">{{ ui.confirmOptions.message }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="ui.resolveConfirm(false)"
          >
            {{ ui.confirmOptions.cancelText ?? 'Cancelar' }}
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            :class="
              ui.confirmOptions.variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-600 hover:bg-blue-700'
            "
            @click="ui.resolveConfirm(true)"
          >
            {{ ui.confirmOptions.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Prompt -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'prompt' && ui.promptOptions"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.resolvePrompt(null)"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800">{{ ui.promptOptions.title }}</h3>
        <label class="mt-4 block text-sm font-medium text-slate-600">
          {{ ui.promptOptions.label }}
          <input
            v-model="promptValue"
            :placeholder="ui.promptOptions.placeholder"
            class="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            autofocus
            @keyup.enter="submitPrompt"
          />
        </label>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            @click="ui.resolvePrompt(null)"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            @click="submitPrompt"
          >
            {{ ui.promptOptions.confirmText ?? 'Aceptar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create Board -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createBoard'"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.closeModal()"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">Crear tablero</h3>
          <button class="text-slate-400 hover:text-slate-600" @click="ui.closeModal()">
            <X :size="18" />
          </button>
        </div>
        <label class="mb-3 block text-sm font-medium text-slate-600">
          Nombre
          <input
            v-model="boardTitle"
            placeholder="Ej: Sprint Q2"
            class="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            autofocus
            @keyup.enter="submitBoard"
          />
        </label>
        <label class="mb-4 block text-sm font-medium text-slate-600">
          Descripción
          <textarea
            v-model="boardDescription"
            rows="2"
            placeholder="Opcional..."
            class="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            @click="ui.closeModal()"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="!boardTitle.trim()"
            @click="submitBoard"
          >
            Crear tablero
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create List -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createList'"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.closeModal()"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-lg font-semibold text-slate-800">Nueva lista</h3>
        <input
          v-model="listTitle"
          placeholder="Nombre de la lista"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          autofocus
          @keyup.enter="submitList"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="ui.closeModal()">
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="!listTitle.trim()"
            @click="submitList"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create Task -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createTask'"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.closeModal()"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-lg font-semibold text-slate-800">Crear tarea</h3>
        <label class="mb-3 block text-sm font-medium text-slate-600">
          Título
          <input
            v-model="taskTitle"
            placeholder="¿Qué hay que hacer?"
            class="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            autofocus
            @keyup.enter="submitTask"
          />
        </label>
        <label class="mb-4 block text-sm font-medium text-slate-600">
          Lista
          <select
            v-model="taskListId"
            class="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          >
            <option v-for="list in lists" :key="list.id" :value="list.id">{{ list.title }}</option>
          </select>
        </label>
        <div class="flex justify-end gap-2">
          <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="ui.closeModal()">
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="!taskTitle.trim()"
            @click="submitTask"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create Workspace -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createWorkspace'"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ui.closeModal()"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-lg font-semibold text-slate-800">Nuevo espacio de trabajo</h3>
        <label class="mb-3 block text-sm font-medium text-slate-600">
          Nombre
          <input
            v-model="workspaceName"
            placeholder="Ej: Mi equipo"
            class="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            autofocus
          />
        </label>
        <label class="mb-4 block text-sm font-medium text-slate-600">
          Color
          <input v-model="workspaceColor" type="color" class="mt-1.5 h-10 w-full cursor-pointer" />
        </label>
        <div class="flex justify-end gap-2">
          <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="ui.closeModal()">
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="!workspaceName.trim()"
            @click="submitWorkspace"
          >
            Crear espacio
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
