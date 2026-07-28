import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ModalType =
  | 'confirm'
  | 'prompt'
  | 'createBoard'
  | 'createList'
  | 'createWorkspace'
  | 'createTask'
  | null

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

export interface PromptOptions {
  title: string
  label: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
}

export const useUiStore = defineStore('ui', () => {
  const selectedCardId = ref<string | null>(null)
  const searchQuery = ref('')
  const activeModal = ref<ModalType>(null)

  const confirmOptions = ref<ConfirmOptions | null>(null)
  const promptOptions = ref<PromptOptions | null>(null)
  const createTaskListId = ref<string | null>(null)
  const createListBoardId = ref<string | null>(null)
  const focusMode = ref(false)

  let confirmResolver: ((value: boolean) => void) | null = null
  let promptResolver: ((value: string | null) => void) | null = null

  function openCard(cardId: string) {
    selectedCardId.value = cardId
  }

  function closeCard() {
    selectedCardId.value = null
  }

  function openCreateTask(listId?: string) {
    createTaskListId.value = listId ?? null
    activeModal.value = 'createTask'
  }

  function openCreateList(boardId: string) {
    createListBoardId.value = boardId
    activeModal.value = 'createList'
  }

  function openCreateBoard() {
    activeModal.value = 'createBoard'
  }

  function openCreateWorkspace() {
    activeModal.value = 'createWorkspace'
  }

  function closeModal() {
    activeModal.value = null
    createTaskListId.value = null
    createListBoardId.value = null
    confirmOptions.value = null
    promptOptions.value = null
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmOptions.value = options
      confirmResolver = resolve
      activeModal.value = 'confirm'
    })
  }

  function prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      promptOptions.value = options
      promptResolver = resolve
      activeModal.value = 'prompt'
    })
  }

  function resolveConfirm(result: boolean) {
    confirmResolver?.(result)
    confirmResolver = null
    closeModal()
  }

  function resolvePrompt(result: string | null) {
    promptResolver?.(result)
    promptResolver = null
    closeModal()
  }

  function toggleFocusMode() {
    focusMode.value = !focusMode.value
  }

  return {
    selectedCardId,
    searchQuery,
    activeModal,
    confirmOptions,
    promptOptions,
    createTaskListId,
    createListBoardId,
    focusMode,
    openCard,
    closeCard,
    openCreateTask,
    openCreateList,
    openCreateBoard,
    openCreateWorkspace,
    closeModal,
    confirm,
    prompt,
    resolveConfirm,
    resolvePrompt,
    toggleFocusMode,
  }
})
