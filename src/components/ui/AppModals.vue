<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useQuinListStore } from '@/stores/quinlist'
import { useRouter } from 'vue-router'
import AppWindow from '@/components/ui/AppWindow.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

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
  if (board) router.push({ name: 'board', params: { boardId: board.id } })
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
  <!-- Confirm (estilo alerta macOS / iOS) -->
  <AppConfirmDialog
    v-if="ui.activeModal === 'confirm' && ui.confirmOptions"
    :options="ui.confirmOptions"
    @resolve="ui.resolveConfirm"
  />

  <!-- Prompt -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'prompt' && ui.promptOptions"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="ui.resolvePrompt(null)"
    >
      <AppWindow
        :title="ui.promptOptions.title"
        :subtitle="ui.promptOptions.label"
        class="app-window--md"
        @close="ui.resolvePrompt(null)"
      >
        <input
          v-model="promptValue"
          :placeholder="ui.promptOptions.placeholder"
          class="project-create-modal__input"
          autofocus
          @keyup.enter="submitPrompt"
        />
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="ui.resolvePrompt(null)">
              Cancelar
            </button>
            <button type="button" class="btn-brand" @click="submitPrompt">
              {{ ui.promptOptions.confirmText ?? 'Aceptar' }}
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>

  <!-- Create Board -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createBoard'"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="ui.closeModal()"
    >
      <AppWindow title="Nuevo tablero" subtitle="Espacio de trabajo" class="app-window--wide" @close="ui.closeModal()">
        <div class="app-window-form-row app-window-form-row--2">
          <div>
            <label class="project-create-modal__label">Nombre *</label>
            <input
              v-model="boardTitle"
              type="text"
              class="project-create-modal__input"
              placeholder="Ej. Sprint Q2"
              autofocus
              @keyup.enter="submitBoard"
            />
          </div>
          <div>
            <label class="project-create-modal__label">Descripción</label>
            <input
              v-model="boardDescription"
              type="text"
              class="project-create-modal__input"
              placeholder="Opcional"
              @keyup.enter="submitBoard"
            />
          </div>
        </div>

        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="ui.closeModal()">Cancelar</button>
            <button
              type="button"
              class="btn-brand"
              :disabled="!boardTitle.trim()"
              @click="submitBoard"
            >
              Crear tablero
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>

  <!-- Create List -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createList'"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="ui.closeModal()"
    >
      <AppWindow title="Nueva lista" subtitle="Añadir columna al tablero" class="app-window--sm" @close="ui.closeModal()">
        <label class="project-create-modal__label">Nombre *</label>
        <input
          v-model="listTitle"
          type="text"
          class="project-create-modal__input"
          placeholder="Nombre de la lista"
          autofocus
          @keyup.enter="submitList"
        />
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="ui.closeModal()">Cancelar</button>
            <button
              type="button"
              class="btn-brand"
              :disabled="!listTitle.trim()"
              @click="submitList"
            >
              Crear lista
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>

  <!-- Create Task -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createTask'"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="ui.closeModal()"
    >
      <AppWindow title="Crear tarea" subtitle="Nueva tarjeta" class="app-window--md" @close="ui.closeModal()">
        <div class="app-window-form-row">
          <div>
            <label class="project-create-modal__label">Título *</label>
            <input
              v-model="taskTitle"
              type="text"
              class="project-create-modal__input"
              placeholder="¿Qué hay que hacer?"
              autofocus
              @keyup.enter="submitTask"
            />
          </div>
          <div>
            <label class="project-create-modal__label">Lista</label>
            <select v-model="taskListId" class="project-create-modal__input">
              <option v-for="list in lists" :key="list.id" :value="list.id">{{ list.title }}</option>
            </select>
          </div>
        </div>
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="ui.closeModal()">Cancelar</button>
            <button
              type="button"
              class="btn-brand"
              :disabled="!taskTitle.trim()"
              @click="submitTask"
            >
              Crear tarea
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>

  <!-- Create Workspace -->
  <Teleport to="body">
    <div
      v-if="ui.activeModal === 'createWorkspace'"
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="ui.closeModal()"
    >
      <AppWindow title="Nuevo espacio de trabajo" subtitle="Organiza tus tableros" class="app-window--md" @close="ui.closeModal()">
        <div class="app-window-form-row">
          <div>
            <label class="project-create-modal__label">Nombre *</label>
            <input
              v-model="workspaceName"
              type="text"
              class="project-create-modal__input"
              placeholder="Ej: Mi equipo"
              autofocus
            />
          </div>
          <div>
            <label class="project-create-modal__label">Color</label>
            <input v-model="workspaceColor" type="color" class="h-10 w-full cursor-pointer rounded-lg border border-[#091e4229]" />
          </div>
        </div>
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="ui.closeModal()">Cancelar</button>
            <button
              type="button"
              class="btn-brand"
              :disabled="!workspaceName.trim()"
              @click="submitWorkspace"
            >
              Crear espacio
            </button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
