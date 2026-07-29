<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Paperclip,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Circle,
  AlignLeft,
  CheckSquare,
  MessageSquare,
  Tag,
  Flag,
  Calendar,
  Users,
  ListTodo,
  OctagonAlert,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { canEdit } from '@/utils/permissions'
import AttachmentMedia from '@/components/board/AttachmentMedia.vue'
import {
  formatDate,
  formatDateTime,
  priorityLabel,
  priorityColor,
  isOverdue,
} from '@/utils/permissions'
import type { Priority } from '@/types'
import { googleCalendarUrl } from '@/utils/calendar'
import { useIntegrationsStore } from '@/stores/integrations'
import { burstConfettiFromElement } from '@/utils/confetti'
import AppWindow from '@/components/ui/AppWindow.vue'

const store = useQuinListStore()
const auth = useAuthStore()
const ui = useUiStore()
const integrations = useIntegrationsStore()

const newComment = ref('')
const newChecklistItem = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const card = computed(() =>
  ui.selectedCardId ? store.getCard(ui.selectedCardId) : null,
)

const board = computed(() =>
  card.value ? store.boards.find((b) => b.id === card.value!.boardId) : null,
)

const listName = computed(() => {
  if (!card.value) return ''
  const list = store.getListsByBoard(card.value.boardId).find((l) => l.id === card.value!.listId)
  return list?.title ?? ''
})

const canEditCard = computed(() =>
  card.value ? canEdit(store.getBoardRole(card.value.boardId)) : false,
)

const workspaceMembers = computed(() => {
  const ws = store.currentWorkspace
  if (!ws) return []
  return ws.members.map((m) => ({
    ...m,
    user: auth.getUserById(m.userId),
  }))
})

const checklistDone = computed(() => {
  if (!card.value) return 0
  return card.value.checklist.filter((i) => i.completed).length
})

const checklistPercent = computed(() => {
  if (!card.value || card.value.checklist.length === 0) return 0
  return Math.round((checklistDone.value / card.value.checklist.length) * 100)
})

const activeLabels = computed(() => {
  if (!card.value || !board.value) return []
  return card.value.labelIds
    .map((id) => board.value!.labels.find((l) => l.id === id))
    .filter(Boolean)
})

const showGoogleCalendar = computed(
  () =>
    card.value?.dueDate &&
    integrations.isEnabled(card.value.boardId, 'google_calendar'),
)

const coverColor = computed(() => {
  if (!card.value || !board.value) return null
  const firstLabel = card.value.labelIds[0]
  if (firstLabel) {
    const label = board.value.labels.find((l) => l.id === firstLabel)
    if (label) return label.color
  }
  return null
})

function onToggleComplete(e: MouseEvent) {
  if (!card.value) return
  if (!card.value.completed) {
    burstConfettiFromElement(e.currentTarget as HTMLElement)
  }
  store.toggleCardCompleted(card.value.id)
}

async function toggleBlocked() {
  if (!card.value || !canEditCard.value) return
  if (card.value.blocked) {
    await store.setBlocked(card.value.id, false)
    return
  }
  const reason = await ui.prompt({
    title: 'Marcar como bloqueada',
    label: '¿Qué está impidiendo avanzar?',
    placeholder: 'Ej: Esperando aprobación del cliente',
    confirmText: 'Bloquear',
  })
  if (reason !== null) {
    await store.setBlocked(card.value.id, true, reason)
  }
}

watch(
  () => ui.selectedCardId,
  () => {
    newComment.value = ''
    newChecklistItem.value = ''
  },
)

function close() {
  ui.closeCard()
}

function updateTitle(e: Event) {
  if (!card.value) return
  store.updateCard(card.value.id, { title: (e.target as HTMLInputElement).value })
}

function updateDescription(e: Event) {
  if (!card.value) return
  store.updateCard(card.value.id, { description: (e.target as HTMLTextAreaElement).value })
}

function submitComment() {
  if (!card.value || !newComment.value.trim()) return
  store.addComment(card.value.id, newComment.value.trim())
  newComment.value = ''
}

function addChecklistItem() {
  if (!card.value || !newChecklistItem.value.trim()) return
  store.addChecklistItem(card.value.id, newChecklistItem.value.trim())
  newChecklistItem.value = ''
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!card.value || !input.files?.length) return
  Array.from(input.files).forEach((file) => store.addAttachment(card.value!.id, file))
  input.value = ''
}

async function deleteCard() {
  if (!card.value) return
  const confirmed = await ui.confirm({
    title: 'Eliminar tarjeta',
    message: `¿Seguro que deseas eliminar "${card.value.title}"? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    variant: 'danger',
  })
  if (confirmed) {
    store.deleteCard(card.value.id)
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="card"
      class="app-window-overlay fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto p-4 pt-12 pb-8 sm:p-8 sm:pt-16"
      @click.self="close"
    >
      <AppWindow
        :title="card.title || 'Tarjeta'"
        :subtitle="listName ? `en lista ${listName}` : undefined"
        class="app-window--card"
        role="dialog"
        aria-modal="true"
        @close="close"
      >
        <!-- Cover strip (solo si hay etiqueta) -->
        <div v-if="coverColor" class="h-2 w-full" :style="{ background: coverColor }" />

        <div class="flex flex-col sm:flex-row">
          <!-- Contenido principal -->
          <div class="min-w-0 flex-1 px-6 pt-5 pb-6 sm:pr-4">
            <!-- Título + completar -->
            <div class="mb-1 flex items-start gap-3 pr-8">
              <button
                v-if="canEditCard"
                class="mt-1 shrink-0 text-[#626f86] transition-colors hover:text-[#4bce97]"
                :aria-label="card.completed ? 'Marcar incompleta' : 'Marcar completada'"
                @click="onToggleComplete"
              >
                <CheckCircle2
                  v-if="card.completed"
                  :size="22"
                  class="text-[#4bce97]"
                  fill="currentColor"
                />
                <Circle v-else :size="22" :stroke-width="2" />
              </button>
              <div class="min-w-0 flex-1">
                <input
                  class="w-full border-none bg-transparent text-lg font-semibold text-[#172b4d] outline-none placeholder:text-[#626f86] sm:text-xl"
                  :class="{ 'line-through opacity-70': card.completed }"
                  :value="card.title"
                  :readonly="!canEditCard"
                  @change="updateTitle"
                />
                <p v-if="listName" class="mt-0.5 text-xs text-[#626f86]">
                  en lista <span class="underline decoration-[#091e4221]">{{ listName }}</span>
                </p>
              </div>
            </div>

            <!-- Etiquetas activas (chips) -->
            <div v-if="activeLabels.length" class="mb-4 ml-9 flex flex-wrap gap-1.5">
              <span
                v-for="label in activeLabels"
                :key="label!.id"
                class="rounded px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                :style="{ background: label!.color }"
              >
                {{ label!.name }}
              </span>
            </div>

            <!-- Meta rápida -->
            <div
              v-if="card.dueDate || card.assigneeIds.length"
              class="mb-5 ml-9 flex flex-wrap gap-2"
            >
              <span
                v-if="card.dueDate"
                class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                :class="
                  isOverdue(card.dueDate) && !card.completed
                    ? 'bg-[#f87168] text-white'
                    : 'bg-[#091e4221] text-[#172b4d]'
                "
              >
                <Calendar :size="12" />
                {{ formatDate(card.dueDate) }}
              </span>
              <span
                v-for="uid in card.assigneeIds"
                :key="uid"
                class="inline-flex items-center gap-1.5 rounded bg-[#091e4221] px-2 py-1 text-xs text-[#172b4d]"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-[#6554c0] text-[9px] font-bold text-white"
                >
                  {{ auth.getUserById(uid)?.initials }}
                </span>
                {{ auth.getUserById(uid)?.name.split(' ')[0] }}
              </span>
            </div>

            <!-- Descripción -->
            <section class="mb-6">
              <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
                <AlignLeft :size="16" class="text-[#44546f]" />
                Descripción
              </h3>
              <textarea
                class="ml-6 w-[calc(100%-1.5rem)] resize-y rounded-lg bg-[#f8f9fa] p-3 text-sm leading-relaxed text-[#172b4d] outline-none ring-[#388bff] placeholder:text-[#626f86] focus:bg-white focus:ring-2"
                :value="card.description"
                :readonly="!canEditCard"
                placeholder="Añade una descripción más detallada..."
                rows="3"
                @change="updateDescription"
              />
            </section>

            <!-- Checklist -->
            <section v-if="card.checklist.length > 0 || canEditCard" class="mb-6">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
                  <CheckSquare :size="16" class="text-[#44546f]" />
                  Checklist
                  <span
                    v-if="card.checklist.length > 0"
                    class="font-normal text-[#626f86]"
                  >
                    {{ checklistPercent }}%
                  </span>
                </h3>
              </div>
              <div
                v-if="card.checklist.length > 0"
                class="mb-3 ml-6 h-2 overflow-hidden rounded-full bg-[#091e4221]"
              >
                <div
                  class="h-full rounded-full bg-[#4bce97] transition-all duration-300"
                  :style="{ width: `${checklistPercent}%` }"
                />
              </div>
              <div class="ml-6 space-y-0.5">
                <label
                  v-for="item in card.checklist"
                  :key="item.id"
                  class="group flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-[#091e420a]"
                >
                  <input
                    type="checkbox"
                    :checked="item.completed"
                    :disabled="!canEditCard"
                    class="h-4 w-4 rounded border-[#091e4224] text-[#4bce97] focus:ring-[#4bce97]"
                    @change="store.toggleChecklistItem(card.id, item.id)"
                  />
                  <span
                    class="flex-1 text-sm text-[#172b4d]"
                    :class="{ 'text-[#626f86] line-through': item.completed }"
                  >
                    {{ item.text }}
                  </span>
                  <button
                    v-if="canEditCard"
                    class="opacity-0 transition-opacity group-hover:opacity-100 text-[#626f86] hover:text-red-500"
                    @click.prevent="store.removeChecklistItem(card.id, item.id)"
                  >
                    <X :size="14" />
                  </button>
                </label>
              </div>
              <div v-if="canEditCard" class="ml-6 mt-2 flex gap-2">
                <input
                  v-model="newChecklistItem"
                  placeholder="Añadir un ítem..."
                  class="flex-1 rounded-md border border-[#091e4224] bg-white px-3 py-2 text-sm text-[#172b4d] outline-none focus:border-[#388bff] focus:ring-1 focus:ring-[#388bff]"
                  @keyup.enter="addChecklistItem"
                />
                <button
                  class="rounded-md bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
                  @click="addChecklistItem"
                >
                  Añadir
                </button>
              </div>
            </section>

            <!-- Adjuntos -->
            <section v-if="card.attachments.length > 0 || canEditCard" class="mb-6">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
                <Paperclip :size="16" class="text-[#44546f]" />
                Adjuntos
                <span class="font-normal text-[#626f86]">({{ card.attachments.length }})</span>
              </h3>
              <div class="ml-6 flex flex-wrap gap-2">
                <div v-for="att in card.attachments" :key="att.id" class="group relative">
                  <AttachmentMedia :attachment="att" />
                  <button
                    v-if="canEditCard"
                    class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ae2a19] text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                    @click="store.removeAttachment(card.id, att.id)"
                  >
                    <X :size="10" />
                  </button>
                </div>
              </div>
              <input
                v-if="canEditCard"
                ref="fileInput"
                type="file"
                multiple
                hidden
                @change="onFileSelect"
              />
              <button
                v-if="canEditCard"
                class="ml-6 mt-3 flex items-center gap-2 rounded-md bg-[#091e420f] px-3 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#091e4221]"
                @click="fileInput?.click()"
              >
                <Paperclip :size="14" />
                Añadir archivo
              </button>
            </section>

            <!-- Comentarios -->
            <section>
              <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
                <MessageSquare :size="16" class="text-[#44546f]" />
                Comentarios
                <span class="font-normal text-[#626f86]">({{ card.comments.length }})</span>
              </h3>

              <div class="ml-6 space-y-3">
                <div v-for="comment in card.comments" :key="comment.id" class="flex gap-2">
                  <div
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-[9px] font-bold text-white"
                  >
                    {{ auth.getUserById(comment.userId)?.initials }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <span class="text-sm font-semibold text-[#172b4d]">
                        {{ auth.getUserById(comment.userId)?.name }}
                      </span>
                      <time class="text-xs text-[#626f86]">
                        {{ formatDateTime(comment.createdAt) }}
                      </time>
                    </div>
                    <p class="mt-0.5 text-sm leading-snug text-[#172b4d]">
                      {{ comment.text }}
                    </p>
                  </div>
                </div>

                <div v-if="canEditCard" class="flex gap-2">
                  <div
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-[9px] font-bold text-white"
                  >
                    {{ auth.currentUser?.initials }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <textarea
                      v-model="newComment"
                      placeholder="Escribe un comentario..."
                      rows="2"
                      class="w-full resize-none rounded-lg border border-[#091e4224] bg-white p-3 text-sm text-[#172b4d] outline-none placeholder:text-[#626f86] focus:border-[#388bff] focus:ring-1 focus:ring-[#388bff]"
                      @keydown.ctrl.enter="submitComment"
                    />
                    <button
                      v-if="newComment.trim()"
                      class="mt-2 rounded-md bg-[#0c66e4] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc]"
                      @click="submitComment"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="w-full shrink-0 border-t border-[#091e4221] bg-[#f8f9fa] px-4 py-4 sm:w-[200px] sm:border-t-0 sm:border-l sm:py-6">
            <p class="mb-2 text-[11px] font-semibold tracking-wide text-[#44546f] uppercase">
              Añadir a la tarjeta
            </p>

            <div v-if="board?.labels.length" class="mb-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#44546f]">
                <Tag :size="13" />
                Etiquetas
              </p>
              <div class="flex flex-col gap-1">
                <button
                  v-for="label in board.labels"
                  :key="label.id"
                  class="rounded px-2 py-1.5 text-left text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  :class="card.labelIds.includes(label.id) ? 'ring-2 ring-[#0c66e4] ring-offset-1' : 'opacity-50'"
                  :style="{ background: label.color }"
                  :disabled="!canEditCard"
                  @click="store.toggleLabel(card.id, label.id)"
                >
                  {{ label.name }}
                </button>
              </div>
            </div>

            <div class="mb-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#44546f]">
                <Flag :size="13" />
                Prioridad
              </p>
              <div class="flex flex-col gap-1">
                <button
                  v-for="p in ['alta', 'media', 'baja'] as Priority[]"
                  :key="p"
                  class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-[#172b4d] transition-colors hover:bg-[#091e4221]"
                  :class="card.priority === p ? 'bg-[#091e4221] font-medium' : ''"
                  :disabled="!canEditCard"
                  @click="store.setPriority(card.id, p)"
                >
                  <span class="h-2 w-2 shrink-0 rounded-full" :style="{ background: priorityColor(p) }" />
                  {{ priorityLabel(p) }}
                </button>
              </div>
            </div>

            <div class="mb-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#44546f]">
                <Calendar :size="13" />
                Fecha
              </p>
              <input
                type="date"
                class="w-full rounded-md border border-[#091e4224] bg-white px-2 py-1.5 text-xs text-[#172b4d] outline-none focus:border-[#388bff]"
                :value="card.dueDate ?? ''"
                :disabled="!canEditCard"
                @change="
                  store.setDueDate(card.id, ($event.target as HTMLInputElement).value || null)
                "
              />
              <p
                v-if="card.dueDate && isOverdue(card.dueDate) && !card.completed"
                class="mt-1 flex items-center gap-1 text-[11px] text-[#ae2a19]"
              >
                <AlertTriangle :size="11" />
                Vencida
              </p>
              <a
                v-if="showGoogleCalendar && card.dueDate"
                :href="
                  googleCalendarUrl({
                    title: card.title,
                    description: card.description,
                    dueDate: card.dueDate,
                  })
                "
                target="_blank"
                rel="noopener"
                class="mt-1.5 block text-[11px] text-[#0c66e4] hover:underline"
              >
                Google Calendar
              </a>
            </div>

            <div class="mb-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#44546f]">
                <OctagonAlert :size="13" />
                Bloqueo
              </p>
              <button
                class="w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors"
                :class="
                  card.blocked
                    ? 'bg-red-50 font-medium text-red-700'
                    : 'text-[#172b4d] hover:bg-[#091e4221]'
                "
                :disabled="!canEditCard"
                @click="toggleBlocked"
              >
                {{ card.blocked ? 'Quitar bloqueo' : 'Marcar bloqueada' }}
              </button>
              <p v-if="card.blocked && card.blockedReason" class="mt-1.5 text-[11px] text-red-600">
                {{ card.blockedReason }}
              </p>
            </div>

            <div v-if="workspaceMembers.length" class="mb-4">
              <p class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#44546f]">
                <Users :size="13" />
                Miembros
              </p>
              <div class="flex flex-col gap-0.5">
                <button
                  v-for="member in workspaceMembers"
                  :key="member.userId"
                  class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[#172b4d] transition-colors hover:bg-[#091e4221]"
                  :class="card.assigneeIds.includes(member.userId) ? 'bg-[#091e4221] font-medium' : ''"
                  :disabled="!canEditCard"
                  @click="store.toggleAssignee(card.id, member.userId)"
                >
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-[#6554c0] text-[9px] font-bold text-white"
                  >
                    {{ member.user?.initials }}
                  </span>
                  <span class="truncate">{{ member.user?.name.split(' ')[0] }}</span>
                </button>
              </div>
            </div>

            <div class="mt-6 border-t border-[#091e4221] pt-4">
              <p class="mb-2 text-[11px] font-semibold tracking-wide text-[#44546f] uppercase">
                Acciones
              </p>
              <button
                v-if="canEditCard"
                class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[#172b4d] transition-colors hover:bg-[#091e4221]"
                @click="onToggleComplete"
              >
                <ListTodo :size="14" />
                {{ card.completed ? 'Marcar incompleta' : 'Marcar completada' }}
              </button>
              <button
                v-if="canEditCard"
                class="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[#ae2a19] transition-colors hover:bg-[#ae2a1914]"
                @click="deleteCard"
              >
                <Trash2 :size="14" />
                Eliminar
              </button>
            </div>
          </aside>
        </div>
      </AppWindow>
    </div>
  </Teleport>
</template>
