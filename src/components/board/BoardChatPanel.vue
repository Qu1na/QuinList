<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { X, Send, MessageCircle, Loader2, Minus, Paperclip, FileText, Image as ImageIcon } from '@lucide/vue'
import { useBoardChatStore } from '@/stores/boardChat'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { CHAT_MAX_FILE_BYTES, CHAT_MAX_FILE_LABEL } from '@/services/storage'
import type { BoardMessage } from '@/types'

const route = useRoute()
const chatStore = useBoardChatStore()
const { isOpen, unreadCount, loading, sending, messages, boardId, error } =
  storeToRefs(chatStore)
const auth = useAuthStore()
const store = useQuinListStore()

const draft = ref('')
const listRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const routeBoardId = computed(() => route.params.boardId as string | undefined)
const visible = computed(() => !!routeBoardId.value)

const boardTitle = computed(() => {
  const id = boardId.value ?? routeBoardId.value
  if (!id) return 'Chat'
  return store.boards.find((b) => b.id === id)?.title ?? 'Tablero'
})

const sortedMessages = computed(() =>
  [...messages.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  ),
)

watch(
  routeBoardId,
  (id) => {
    if (id) void chatStore.ensureMounted(id)
    else chatStore.unmount()
  },
  { immediate: true },
)

async function scrollToBottom() {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}

watch(() => messages.value.length, scrollToBottom)
watch(isOpen, async (open) => {
  if (open) {
    await scrollToBottom()
    inputRef.value?.focus()
  }
})

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function senderName(userId: string) {
  return auth.getUserById(userId)?.name?.split(' ')[0] ?? 'Usuario'
}

function senderInitials(userId: string) {
  return auth.getUserById(userId)?.initials ?? '?'
}

function isImageAttachment(msg: BoardMessage) {
  return msg.attachment?.type.startsWith('image/')
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function pickFile() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > CHAT_MAX_FILE_BYTES) {
    chatStore.error = `Máximo ${CHAT_MAX_FILE_LABEL} por archivo`
    return
  }
  pendingFile.value = file
}

function clearFile() {
  pendingFile.value = null
}

async function submit() {
  const text = draft.value.trim()
  if (!text && !pendingFile.value) return
  const file = pendingFile.value
  draft.value = ''
  pendingFile.value = null
  await chatStore.send(text, file)
  await scrollToBottom()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

async function onBubbleClick() {
  if (routeBoardId.value) await chatStore.toggle(routeBoardId.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pointer-events-none fixed z-[2500] flex flex-col items-end gap-3"
      :class="
        isOpen
          ? 'inset-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:left-auto sm:top-auto'
          : 'right-4 bottom-4 sm:right-6 sm:bottom-6'
      "
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <div
          v-show="isOpen"
          class="pointer-events-auto flex flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/10"
          :class="
            'h-full w-full sm:h-[min(520px,calc(100vh-7rem))] sm:w-[min(400px,calc(100vw-2rem))] sm:rounded-2xl'
          "
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#0c66e4] to-[#6554c0] px-4 py-3 text-white safe-top">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <MessageCircle :size="18" />
              </span>
              <div class="min-w-0">
                <h2 class="truncate text-sm font-semibold">Chat del equipo</h2>
                <p class="truncate text-xs text-white/75">{{ boardTitle }} · en vivo</p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="rounded-full p-2 hover:bg-white/15"
                title="Minimizar"
                @click="chatStore.minimize()"
              >
                <Minus :size="16" />
              </button>
              <button
                type="button"
                class="rounded-full p-2 hover:bg-white/15 sm:hidden"
                title="Cerrar"
                @click="chatStore.minimize()"
              >
                <X :size="16" />
              </button>
            </div>
          </header>

          <div ref="listRef" class="scroll-thin flex-1 overflow-y-auto bg-[#f4f5f7] px-3 py-3">
            <div v-if="loading" class="flex justify-center py-10">
              <Loader2 :size="22" class="animate-spin text-[#626f86]" />
            </div>
            <p
              v-else-if="!sortedMessages.length"
              class="py-10 text-center text-sm text-[#626f86]"
            >
              Sin mensajes aún.
            </p>
            <div v-else class="space-y-3">
              <div
                v-for="msg in sortedMessages"
                :key="msg.id"
                class="flex gap-2"
                :class="msg.userId === auth.currentUserId ? 'flex-row-reverse' : 'flex-row'"
              >
                <span
                  v-if="msg.userId !== auth.currentUserId"
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-[10px] font-bold text-white"
                >
                  {{ senderInitials(msg.userId) }}
                </span>
                <div class="max-w-[82%] sm:max-w-[78%]">
                  <p
                    v-if="msg.userId !== auth.currentUserId"
                    class="mb-0.5 px-1 text-[10px] font-medium text-[#626f86]"
                  >
                    {{ senderName(msg.userId) }}
                  </p>
                  <div
                    class="relative px-3 py-2 text-sm leading-snug shadow-sm transition-opacity"
                    :class="[
                      msg.userId === auth.currentUserId
                        ? 'rounded-2xl rounded-br-md bg-[#0c66e4] text-white'
                        : 'rounded-2xl rounded-bl-md bg-white text-[#172b4d] ring-1 ring-[#091e4214]',
                      msg.pending ? 'opacity-70' : '',
                    ]"
                  >
                    <a
                      v-if="msg.attachment && isImageAttachment(msg) && msg.attachment.url"
                      :href="msg.attachment.url"
                      target="_blank"
                      rel="noopener"
                      class="mb-2 block overflow-hidden rounded-lg"
                    >
                      <img
                        :src="msg.attachment.url"
                        :alt="msg.attachment.name"
                        class="max-h-48 w-full object-cover"
                      />
                    </a>

                    <a
                      v-else-if="msg.attachment?.url"
                      :href="msg.attachment.url"
                      target="_blank"
                      rel="noopener"
                      class="mb-2 flex items-center gap-2 rounded-lg p-2"
                      :class="
                        msg.userId === auth.currentUserId
                          ? 'bg-white/15 hover:bg-white/25'
                          : 'bg-[#091e420a] hover:bg-[#091e4214]'
                      "
                    >
                      <FileText :size="16" class="shrink-0" />
                      <span class="min-w-0 flex-1 truncate text-xs font-medium">
                        {{ msg.attachment.name }}
                      </span>
                      <span class="text-[10px] opacity-70">
                        {{ formatFileSize(msg.attachment.size) }}
                      </span>
                    </a>

                    <p v-if="msg.text?.trim()" class="whitespace-pre-wrap break-words">
                      {{ msg.text }}
                    </p>

                    <p
                      class="mt-1 flex items-center gap-1 text-[10px]"
                      :class="[
                        msg.userId === auth.currentUserId
                          ? 'justify-end text-white/65'
                          : 'text-[#626f86]',
                      ]"
                    >
                      <Loader2 v-if="msg.pending" :size="10" class="animate-spin" />
                      {{ formatTime(msg.createdAt) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="shrink-0 border-t border-[#091e4214] bg-white p-3 safe-bottom">
            <p v-if="error" class="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
              {{ error }}
            </p>

            <div
              v-if="pendingFile"
              class="mb-2 flex items-center gap-2 rounded-lg bg-[#091e420a] px-3 py-2 text-xs text-[#44546f]"
            >
              <ImageIcon v-if="pendingFile.type.startsWith('image/')" :size="14" />
              <FileText v-else :size="14" />
              <span class="min-w-0 flex-1 truncate">{{ pendingFile.name }}</span>
              <span class="shrink-0 opacity-70">{{ formatFileSize(pendingFile.size) }}</span>
              <button type="button" class="rounded p-0.5 hover:bg-[#091e4214]" @click="clearFile">
                <X :size="14" />
              </button>
            </div>

            <form class="flex items-end gap-2" @submit.prevent="submit">
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*,.pdf,.txt"
                @change="onFileSelected"
              />
              <button
                type="button"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#626f86] hover:bg-[#091e420f]"
                title="Adjuntar archivo"
                :disabled="sending"
                @click="pickFile"
              >
                <Paperclip :size="18" />
              </button>
              <textarea
                ref="inputRef"
                v-model="draft"
                rows="1"
                placeholder="Mensaje..."
                class="max-h-24 min-h-[40px] flex-1 resize-none rounded-2xl border border-[#091e4221] bg-[#f4f5f7] px-4 py-2.5 text-sm outline-none focus:border-[#388bff] focus:bg-white focus:ring-2 focus:ring-[#388bff33]"
                maxlength="500"
                @keydown="onKeydown"
              />
              <button
                type="submit"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c66e4] text-white shadow-md transition-transform hover:bg-[#0055cc] active:scale-95 disabled:opacity-50"
                :disabled="sending || (!draft.trim() && !pendingFile)"
              >
                <Loader2 v-if="sending" :size="16" class="animate-spin" />
                <Send v-else :size="16" />
              </button>
            </form>
          </div>
        </div>
      </Transition>

      <button
        type="button"
        class="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0c66e4] to-[#6554c0] text-white shadow-xl ring-4 ring-white/30 transition-transform hover:scale-105 active:scale-95"
        :title="isOpen ? 'Minimizar chat' : 'Abrir chat del equipo'"
        @click="onBubbleClick"
      >
        <X v-if="isOpen" :size="24" />
        <MessageCircle v-else :size="24" />
        <span
          v-if="unreadCount > 0 && !isOpen"
          class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.safe-top {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}
.safe-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}
</style>
