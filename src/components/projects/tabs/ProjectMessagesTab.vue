<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Hash, MessageSquare, ChevronDown } from '@lucide/vue'
import { useProjectChatStore } from '@/stores/projectChat'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import SlackChatWorkspace from '@/components/chat/SlackChatWorkspace.vue'
import ChatMessageList from '@/components/chat/ChatMessageList.vue'
import ChatTypingIndicator from '@/components/chat/ChatTypingIndicator.vue'
import ChatPresenceBar from '@/components/chat/ChatPresenceBar.vue'
import MentionComposer from '@/components/chat/MentionComposer.vue'
import { buildProjectMentionCandidates } from '@/utils/mentionSuggestions'
import { CHAT_MAX_FILE_BYTES, CHAT_MAX_FILE_LABEL } from '@/services/storage'
import { useChatScroll } from '@/composables/useChatScroll'

const props = defineProps<{ projectId: string }>()

const chatStore = useProjectChatStore()
const {
  loading,
  sending,
  messages,
  error,
  typingUserIds,
  presence,
  otherMemberIds,
} = storeToRefs(chatStore)
const projectsStore = useProjectsStore()
const auth = useAuthStore()

const draft = ref('')
const pendingFile = ref<File | null>(null)
const workspaceRef = ref<InstanceType<typeof SlackChatWorkspace> | null>(null)
const composerRef = ref<InstanceType<typeof MentionComposer> | null>(null)

const projectName = computed(() => projectsStore.getProject(props.projectId)?.name ?? 'Proyecto')
const memberIds = computed(() =>
  projectsStore.getProjectMembers(props.projectId).map((m) => m.userId),
)
const candidates = computed(() => buildProjectMentionCandidates(props.projectId))

const chatMessages = computed(() =>
  messages.value.map((m) => ({
    id: m.id,
    userId: m.userId,
    text: m.text,
    createdAt: m.createdAt,
    pending: m.pending,
    status: m.status,
    readBy: m.readBy,
    attachment: m.attachment,
  })),
)

const scroll = useChatScroll(() => workspaceRef.value?.messagesEl ?? null)

onMounted(() => {
  void chatStore.ensureMounted(props.projectId)
  chatStore.setViewActive(true)
})

onUnmounted(() => {
  chatStore.setViewActive(false)
  void chatStore.unmount()
})

watch(
  () => props.projectId,
  (id) => {
    if (id) void chatStore.ensureMounted(id)
  },
)

watch(
  () => messages.value.length,
  () => {
    const last = messages.value[messages.value.length - 1]
    const isOwn = last?.userId === auth.currentUserId
    scroll.onNewMessage(Boolean(isOwn))
  },
)

watch(loading, (v) => {
  if (!v) void scroll.scrollToBottom()
})

function onPendingFile(file: File | null) {
  if (!file) {
    pendingFile.value = null
    return
  }
  if (file.size > CHAT_MAX_FILE_BYTES) {
    chatStore.error = `Máximo ${CHAT_MAX_FILE_LABEL} por archivo`
    pendingFile.value = null
    return
  }
  pendingFile.value = file
}

async function submit() {
  const text = draft.value
  const file = pendingFile.value
  if (!text.trim() && !file) return
  draft.value = ''
  pendingFile.value = null
  void chatStore.send(text, file).then(() => {
    void scroll.scrollToBottom()
    composerRef.value?.focusEditor()
  })
}

function onDraftInput() {
  void chatStore.notifyTyping()
}
</script>

<template>
  <div class="project-messages">
    <SlackChatWorkspace
      ref="workspaceRef"
      class="project-messages__workspace"
      :workspace-title="projectName"
      channel-name="general"
      :member-count="memberIds.length"
      :project-id="projectId"
    >
      <template #header-subtitle>
        <ChatPresenceBar :presence="presence" :member-ids="memberIds" />
      </template>

      <template #channels>
        <button type="button" class="ql-channel ql-channel--active">
          <Hash :size="15" class="opacity-80" />
          <span>general</span>
        </button>
      </template>

      <div class="project-messages__list-wrap">
        <ChatMessageList
          :messages="chatMessages"
          :loading="loading"
          :current-user-id="auth.currentUserId"
          :other-member-ids="otherMemberIds"
        >
          <template #empty>
            <div class="project-messages__empty">
              <span class="project-messages__empty-icon">
                <MessageSquare :size="28" />
              </span>
              <h3>¡Bienvenido a <span>#general</span>!</h3>
              <p>
                Chat del equipo en tiempo real. Tus mensajes a la derecha, los del equipo a la izquierda.
                Adjunta archivos con vista previa estilo WhatsApp.
              </p>
            </div>
          </template>
        </ChatMessageList>

        <button
          v-if="scroll.newMessagesBelow.value > 0"
          type="button"
          class="project-messages__new-btn"
          @click="scroll.scrollToBottom(true)"
        >
          <ChevronDown :size="14" />
          Nuevos mensajes ({{ scroll.newMessagesBelow.value }})
        </button>
      </div>

      <template #composer>
        <ChatTypingIndicator :typing-user-ids="typingUserIds" />
        <p v-if="error" class="project-messages__error">{{ error }}</p>
        <MentionComposer
          ref="composerRef"
          :key="`chat-composer-${projectId}`"
          v-model="draft"
          :pending-file="pendingFile"
          :candidates="candidates"
          channel-name="general"
          :sending="sending"
          @update:pending-file="onPendingFile"
          @update:model-value="onDraftInput"
          @submit="submit"
        />
      </template>
    </SlackChatWorkspace>
  </div>
</template>

<style scoped>
.project-messages {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0.625rem 0.75rem 0.75rem;
  background: transparent;
  overflow: hidden;
}

.project-messages__workspace {
  flex: 1;
  min-height: 0;
  height: auto;
}

.project-messages__list-wrap {
  position: relative;
  min-height: 0;
  flex: 1;
}

.project-messages__new-btn {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  z-index: 5;
  display: inline-flex;
  transform: translateX(-50%);
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  background: var(--ql-chat-primary, #2d7eb8);
  box-shadow: 0 4px 14px rgba(45, 126, 184, 0.35);
}

.project-messages__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  text-align: center;
}

.project-messages__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.25rem;
  height: 4.25rem;
  margin-bottom: 1rem;
  border-radius: 1.125rem;
  background: linear-gradient(135deg, rgba(91, 188, 228, 0.2) 0%, rgba(45, 126, 184, 0.12) 100%);
  color: #2d7eb8;
}

.project-messages__empty h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #172b4d;
}

.project-messages__empty h3 :deep(span) {
  color: #2d7eb8;
}

.project-messages__empty p {
  margin: 0.5rem 0 0;
  max-width: 28rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #626f86;
}

.project-messages__error {
  margin: 0 0 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #b42318;
  background: #fef3f2;
}
</style>
