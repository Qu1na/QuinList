<script setup lang="ts">
import { computed, toRef } from 'vue'
import { AlignLeft, MessageSquare, Paperclip, CheckSquare, Ban } from '@lucide/vue'
import type { Card } from '@/types'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { canEdit } from '@/utils/permissions'
import { formatDate, isDueSoon, isOverdue } from '@/utils/permissions'
import { useBoardUsers } from '@/composables/useBoardUsers'

const props = defineProps<{ card: Card }>()

const store = useQuinListStore()
const ui = useUiStore()

const boardId = toRef(() => props.card.boardId)
const { getCardUsers, hasMultipleParticipants } = useBoardUsers(boardId)

const AVATAR_COLORS = ['#6554c0', '#0c66e4', '#e56910', '#61bd4f', '#cd5a91', '#00c2e0', '#c377e0']

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]!
}

const board = computed(() => store.boards.find((b) => b.id === props.card.boardId))
const canEditCard = computed(() =>
  board.value ? canEdit(store.getBoardRole(board.value.id)) : false,
)

const labelColors = computed(() => {
  if (!board.value) return []
  return props.card.labelIds
    .map((id) => board.value!.labels.find((l) => l.id === id)?.color)
    .filter(Boolean) as string[]
})

const cardUsers = computed(() =>
  hasMultipleParticipants.value ? getCardUsers(props.card) : [],
)

const checklistDone = computed(
  () => props.card.checklist.filter((i) => i.completed).length,
)
const checklistTotal = computed(() => props.card.checklist.length)

const commentCount = computed(() => props.card.comments.length)

const hasDescription = computed(() => !!props.card.description?.trim())
const hasAttachments = computed(() => (props.card.attachments?.length ?? 0) > 0)
const hasChecklist = computed(() => checklistTotal.value > 0)

const hasMetaRow = computed(
  () =>
    props.card.dueDate ||
    props.card.blocked ||
    hasDescription.value ||
    commentCount.value > 0 ||
    hasAttachments.value ||
    hasChecklist.value,
)

const dueClass = computed(() => {
  if (!props.card.dueDate) return ''
  if (isOverdue(props.card.dueDate)) return 'bg-red-100 text-red-700'
  if (isDueSoon(props.card.dueDate)) return 'bg-yellow-100 text-yellow-800'
  return 'bg-emerald-100 text-emerald-800'
})

function openCard() {
  ui.openCard(props.card.id)
}

async function toggleComplete(e: Event) {
  e.stopPropagation()
  if (!canEditCard.value) return
  await store.toggleCardCompleted(props.card.id)
}
</script>

<template>
  <div
    class="group relative cursor-pointer rounded-lg border border-gray-200/80 bg-white px-2 py-1.5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
    :class="{
      'opacity-60': card.completed,
      'ring-2 ring-red-400 ring-offset-1': card.blocked,
    }"
    @click="openCard"
  >
    <button
      v-if="canEditCard"
      class="absolute left-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
      :class="{ 'opacity-100': card.completed }"
      @click="toggleComplete"
    >
      <span
        v-if="card.completed"
        class="block h-2 w-2 rounded-sm bg-emerald-500"
      />
    </button>

    <div v-if="labelColors.length" class="mb-1 flex flex-wrap gap-0.5">
      <div
        v-for="(color, i) in labelColors"
        :key="i"
        class="h-2 min-w-[32px] flex-1 rounded-sm"
        :style="{ backgroundColor: color }"
      />
    </div>

    <div class="relative" :class="{ 'pl-4': canEditCard, 'pr-5': cardUsers.length }">
      <p
        class="text-[13px] leading-snug text-gray-800"
        :class="{ 'line-through text-gray-400': card.completed }"
      >
        {{ card.title }}
      </p>

      <div
        v-if="cardUsers.length"
        class="absolute -bottom-0.5 right-0 flex -space-x-1"
      >
        <div
          v-for="user in cardUsers.slice(0, 3)"
          :key="user.id"
          class="group/avatar relative"
        >
          <div
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white"
            :style="{ backgroundColor: avatarColor(user.id) }"
          >
            {{ user.initials || user.name.charAt(0).toUpperCase() }}
          </div>
          <div
            class="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden whitespace-nowrap rounded-md bg-[#172b4d] px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover/avatar:block"
          >
            {{ user.name }}
            <span
              v-if="user.id === card.createdBy"
              class="ml-1 font-normal text-white/70"
            >· creador</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="hasMetaRow"
      class="mt-1 flex flex-wrap items-center gap-1"
      :class="{ 'pl-4': canEditCard }"
    >
      <span
        v-if="card.blocked"
        class="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium text-red-700"
        title="Bloqueada"
      >
        <Ban :size="10" />
      </span>

      <span
        v-if="card.dueDate"
        class="rounded px-1 py-px text-[10px] font-medium leading-tight"
        :class="dueClass"
      >
        {{ formatDate(card.dueDate) }}
      </span>

      <AlignLeft v-if="hasDescription" :size="12" class="text-gray-400" />
      <span
        v-if="commentCount > 0"
        class="inline-flex items-center gap-0.5 text-[10px] text-gray-500"
      >
        <MessageSquare :size="11" class="text-gray-400" />
        {{ commentCount }}
      </span>
      <span
        v-if="hasAttachments"
        class="inline-flex items-center gap-0.5 text-[10px] text-gray-500"
      >
        <Paperclip :size="11" class="text-gray-400" />
        {{ card.attachments?.length }}
      </span>
      <span
        v-if="hasChecklist"
        class="inline-flex items-center gap-0.5 text-[10px] text-gray-500"
        :class="{
          'text-emerald-600': checklistDone === checklistTotal && checklistTotal > 0,
        }"
      >
        <CheckSquare :size="11" class="text-gray-400" />
        {{ checklistDone }}/{{ checklistTotal }}
      </span>
    </div>
  </div>
</template>
