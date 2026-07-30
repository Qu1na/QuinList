<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Hash, MessageSquare } from '@lucide/vue'
import { useBoardChatStore } from '@/stores/boardChat'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import SlackChatWorkspace from '@/components/chat/SlackChatWorkspace.vue'
import ChatMessageList from '@/components/chat/ChatMessageList.vue'
import MentionComposer from '@/components/chat/MentionComposer.vue'
import { buildBoardMentionCandidates } from '@/utils/mentionSuggestions'
import { CHAT_MAX_FILE_BYTES, CHAT_MAX_FILE_LABEL } from '@/services/storage'

const props = defineProps<{ boardId: string }>()

const chatStore = useBoardChatStore()
const { loading, sending, messages, error } = storeToRefs(chatStore)
const store = useQuinListStore()
const auth = useAuthStore()

const draft = ref('')
const workspaceRef = ref<InstanceType<typeof SlackChatWorkspace> | null>(null)
const pendingFile = ref<File | null>(null)

const boardTitle = computed(() => store.boards.find((b) => b.id === props.boardId)?.title ?? 'Tablero')
const memberCount = computed(() => store.currentWorkspace?.members?.length ?? 0)
const candidates = computed(() => buildBoardMentionCandidates(props.boardId))

const otherMemberIds = computed(() =>
  (store.currentWorkspace?.members ?? [])
    .map((m) => m.userId)
    .filter((id) => id !== auth.currentUserId),
)

const chatMessages = computed(() =>
  messages.value.map((m) => ({
    id: m.id,
    userId: m.userId,
    text: m.text,
    createdAt: m.createdAt,
    pending: m.pending,
    attachment: m.attachment,
  })),
)

onMounted(() => {
  void chatStore.ensureMounted(props.boardId)
  chatStore.setViewActive(true)
})

onUnmounted(() => {
  chatStore.setViewActive(false)
  chatStore.markRead()
})

watch(
  () => props.boardId,
  (id) => {
    if (id) void chatStore.ensureMounted(id)
  },
)

async function scrollToBottom() {
  await nextTick()
  const el = workspaceRef.value?.messagesEl
  if (el) el.scrollTop = el.scrollHeight
}

watch(() => messages.value.length, scrollToBottom)

function onPendingFile(file: File | null) {
  if (!file) {
    pendingFile.value = null
    return
  }
  if (file.size > CHAT_MAX_FILE_BYTES) {
    error.value = `Máximo ${CHAT_MAX_FILE_LABEL} por archivo`
    pendingFile.value = null
    return
  }
  pendingFile.value = file
}

async function submit() {
  const text = draft.value
  if (!text.trim() && !pendingFile.value) return
  const file = pendingFile.value
  draft.value = ''
  pendingFile.value = null
  await chatStore.send(text, file)
}
</script>

<template>
  <div class="board-messages">
    <SlackChatWorkspace
      ref="workspaceRef"
      :workspace-title="boardTitle"
      channel-name="general"
      :member-count="memberCount"
      :board-id="boardId"
    >
      <template #channels>
        <button type="button" class="ql-channel ql-channel--active">
          <Hash :size="15" class="opacity-80" />
          <span>general</span>
        </button>
      </template>

      <ChatMessageList
        :messages="chatMessages"
        :loading="loading"
        :current-user-id="auth.currentUserId"
        :other-member-ids="otherMemberIds"
      >
          <template #empty>
            <div class="board-messages__empty">
              <span class="board-messages__empty-icon">
                <MessageSquare :size="28" />
              </span>
              <h3>¡Bienvenido a #general!</h3>
              <p>
                Canal del tablero. Usa <strong>@</strong> para mencionar personas,
                <strong>#</strong> para tarjetas y <strong>Adjuntar archivo</strong> para imágenes y documentos.
              </p>
            </div>
          </template>
        </ChatMessageList>

      <template #composer>
        <p v-if="error" class="board-messages__error">{{ error }}</p>
        <MentionComposer
          :key="`board-composer-${boardId}`"
          v-model="draft"
          :pending-file="pendingFile"
          :candidates="candidates"
          channel-name="general"
          :sending="sending"
          @update:pending-file="onPendingFile"
          @submit="submit"
        />
      </template>
    </SlackChatWorkspace>
  </div>
</template>

<style scoped>
.board-messages {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  padding: 0.5rem 0.75rem 0.75rem;
  background: transparent;
}

.board-messages__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.board-messages__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  border-radius: 1rem;
  background: #f0f1f3;
  color: #616061;
}

.board-messages__empty h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #1d1c1d;
}

.board-messages__empty p {
  margin: 0.5rem 0 0;
  max-width: 24rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #616061;
}

.board-messages__file {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #1264a3;
  background: #f0f1f3;
}

.board-messages__image {
  margin-top: 0.5rem;
  max-height: 12rem;
  border-radius: 0.5rem;
  object-fit: cover;
}

.board-messages__error {
  margin: 0 0 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #b42318;
  background: #fef3f2;
}

.board-messages__pending-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #616061;
  background: #f0f1f3;
}

.board-messages__pending-file button {
  margin-left: auto;
  font-size: 0.75rem;
  color: #1264a3;
}
</style>
