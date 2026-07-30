<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { useBoardPresenceStore } from '@/stores/boardPresence'
import { useBoardChatStore } from '@/stores/boardChat'
import { getBoardBackgroundStyle } from '@/utils/boardBackgrounds'
import TrelloNav from '@/components/layout/TrelloNav.vue'
import BoardToolbar from '@/components/board/BoardToolbar.vue'
import KanbanBoard from '@/components/board/KanbanBoard.vue'
import BoardMessagesView from '@/components/board/BoardMessagesView.vue'
import IntegrationsPanel from '@/components/board/IntegrationsPanel.vue'
import ShareBoardModal from '@/components/board/ShareBoardModal.vue'
import CardModal from '@/components/board/CardModal.vue'
import AppModals from '@/components/ui/AppModals.vue'
import BoardPresencePanel from '@/components/board/BoardPresencePanel.vue'
import BoardDrivePanel from '@/components/board/BoardDrivePanel.vue'
import RealtimeToast from '@/components/layout/RealtimeToast.vue'
import CollaborationToasts from '@/components/layout/CollaborationToasts.vue'

const route = useRoute()
const router = useRouter()
const store = useQuinListStore()
const ui = useUiStore()
const presence = useBoardPresenceStore()
const boardChat = useBoardChatStore()

const boardId = computed(() => route.params.boardId as string)
const board = computed(() => store.boards.find((b) => b.id === boardId.value))
const view = computed(() => route.query.view as string | undefined)
const showMessages = computed(() => view.value === 'messages')
const backgroundStyle = computed(() =>
  getBoardBackgroundStyle(board.value?.background, { fixed: true }),
)

watch(
  () => [boardId.value, board.value, store.isReady] as const,
  ([id, b, ready]) => {
    if (!id) {
      void presence.unmount()
      boardChat.unmount()
      return
    }
    if (!b) {
      if (ready) router.replace({ name: 'home' })
      void presence.unmount()
      boardChat.unmount()
      return
    }
    store.setCurrentBoard(id)
    if (b.workspaceId !== store.currentWorkspaceId) {
      store.setCurrentWorkspace(b.workspaceId)
    }
    void presence.mount(id)
    void boardChat.ensureMounted(id)
  },
  { immediate: true },
)

watch(showMessages, (active) => {
  boardChat.setViewActive(active)
})

watch(
  () => ui.selectedCardId,
  (cardId) => {
    if (!boardId.value) return
    if (cardId) {
      const card = store.getCard(cardId)
      void presence.setActivity(
        'editing',
        card ? `Viendo «${card.title}»` : 'Editando tarjeta',
      )
    } else {
      void presence.setActivity('online')
    }
  },
)

onUnmounted(() => {
  void presence.unmount()
  boardChat.unmount()
})
</script>

<template>
  <div class="flex h-screen min-h-0 flex-col" :style="backgroundStyle">
    <TrelloNav />
    <BoardToolbar v-if="boardId" :board-id="boardId" />
    <BoardMessagesView v-if="board && showMessages" :board-id="boardId" class="min-h-0 flex-1" />
    <KanbanBoard v-else-if="board" class="min-h-0 flex-1" />
    <CardModal />
    <AppModals />
    <IntegrationsPanel />
    <ShareBoardModal />
    <BoardPresencePanel />
    <BoardDrivePanel />
    <CollaborationToasts />
    <RealtimeToast />
  </div>
</template>
