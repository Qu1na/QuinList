import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IntegrationType } from '@/utils/integrations'
import { useQuinListStore } from './quinlist'
import { useAuthStore } from './auth'

export async function sendWebhook(url: string, payload: object) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
      body: JSON.stringify(payload),
    })
    return true
  } catch {
    return false
  }
}

export const useIntegrationsStore = defineStore('integrations', () => {
  const showPanel = ref(false)
  const panelBoardId = ref<string | null>(null)

  function openPanel(boardId: string) {
    panelBoardId.value = boardId
    showPanel.value = true
  }

  function closePanel() {
    showPanel.value = false
    panelBoardId.value = null
  }

  function isEnabled(boardId: string, type: IntegrationType): boolean {
    const store = useQuinListStore()
    const board = store.boards.find((b) => b.id === boardId)
    return board?.integrations.find((i) => i.type === type)?.enabled ?? false
  }

  function getConfig(boardId: string, type: IntegrationType): Record<string, string> {
    const store = useQuinListStore()
    const board = store.boards.find((b) => b.id === boardId)
    return board?.integrations.find((i) => i.type === type)?.config ?? {}
  }

  function toggleIntegration(boardId: string, type: IntegrationType, enabled: boolean) {
    const store = useQuinListStore()
    store.setIntegrationEnabled(boardId, type, enabled)
  }

  function setConfig(boardId: string, type: IntegrationType, config: Record<string, string>) {
    const store = useQuinListStore()
    store.setIntegrationConfig(boardId, type, config)
  }

  async function notifyEvent(
    boardId: string,
    event: string,
    data: { title: string; message: string; cardId?: string },
  ) {
    const store = useQuinListStore()
    const auth = useAuthStore()
    const board = store.boards.find((b) => b.id === boardId)
    if (!board) return

    const payload = {
      event,
      board: board.title,
      user: auth.currentUser?.name,
      timestamp: new Date().toISOString(),
      ...data,
    }

    for (const integration of board.integrations) {
      if (!integration.enabled) continue
      if (integration.type === 'slack' || integration.type === 'webhook') {
        const url = integration.config.url
        if (url) await sendWebhook(url, payload)
      }
    }
  }

  return {
    showPanel,
    panelBoardId,
    openPanel,
    closePanel,
    isEnabled,
    getConfig,
    toggleIntegration,
    setConfig,
    notifyEvent,
  }
})
