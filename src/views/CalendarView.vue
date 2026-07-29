<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Download, ExternalLink } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/utils/permissions'
import { APP_LOCALE, APP_TIMEZONE, compareCalendarDates } from '@/utils/datetime'
import { downloadIcs, googleCalendarUrl, exportBoardToIcs } from '@/utils/calendar'

import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const store = useQuinListStore()
const ui = useUiStore()
const router = useRouter()
const auth = useAuthStore()
const notif = useNotificationStore()

const viewDate = ref(new Date())

const year = computed(() => viewDate.value.getFullYear())
const month = computed(() => viewDate.value.getMonth())
const monthName = computed(() =>
  new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(viewDate.value),
)

const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const firstDay = computed(() => new Date(year.value, month.value, 1).getDay())

const calendarDays = computed(() => {
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay.value; i++) days.push(null)
  for (let d = 1; d <= daysInMonth.value; d++) days.push(d)
  return days
})

const workspaceCards = computed(() => store.getWorkspaceCards())

const cardsWithDue = computed(() =>
  workspaceCards.value
    .filter((c) => c.dueDate)
    .sort((a, b) => compareCalendarDates(a.dueDate!, b.dueDate!)),
)

function dateKey(day: number) {
  const m = String(month.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year.value}-${m}-${d}`
}

function cardsForDay(day: number) {
  return store.getCardsByDate(dateKey(day))
}

function prevMonth() {
  viewDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(year.value, month.value + 1, 1)
}

function exportAll() {
  const allCards = workspaceCards.value
  const exported = exportBoardToIcs(allCards, store.currentWorkspace?.name ?? 'quinlist')
  if (!exported) {
    notif.push({
      type: 'card_due_soon',
      title: 'Sin fechas',
      message: 'No hay tareas con fecha límite para exportar',
      userId: auth.currentUserId ?? 'u1',
    })
  }
}

function exportCard(card: { title: string; description: string; dueDate: string; id: string }) {
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${card.title}`,
    `DTSTART;VALUE=DATE:${card.dueDate.replace(/-/g, '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  downloadIcs(content, `${card.title.slice(0, 20)}.ics`)
}

function openCard(cardId: string, boardId: string) {
  store.setCurrentBoard(boardId)
  router.push({ name: 'board', params: { boardId } })
  ui.openCard(cardId)
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Calendario</h1>
        <p class="text-sm text-slate-500">Tareas con fecha límite e integración con calendarios</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        @click="exportAll"
      >
        <Download :size="16" />
        Exportar .ics
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold capitalize text-slate-800">{{ monthName }}</h2>
          <div class="flex gap-1">
            <button class="rounded-lg p-2 hover:bg-slate-100" @click="prevMonth">
              <ChevronLeft :size="18" />
            </button>
            <button class="rounded-lg p-2 hover:bg-slate-100" @click="nextMonth">
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center">
          <span
            v-for="d in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
            :key="d"
            class="py-2 text-xs font-semibold text-slate-400"
          >
            {{ d }}
          </span>
          <div
            v-for="(day, i) in calendarDays"
            :key="i"
            class="min-h-[80px] rounded-lg border border-transparent p-1"
            :class="{
              'bg-blue-50 border-blue-200':
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear(),
              invisible: day === null,
            }"
          >
            <span v-if="day" class="text-xs font-medium text-slate-600">{{ day }}</span>
            <button
              v-for="card in day ? cardsForDay(day) : []"
              :key="card.id"
              class="mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.65rem] font-medium"
              :class="card.completed ? 'bg-green-100 text-green-700 line-through' : 'bg-blue-100 text-blue-700'"
              @click="openCard(card.id, card.boardId)"
            >
              {{ card.title }}
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Próximas fechas</h2>
        <div v-if="cardsWithDue.length === 0" class="text-sm text-slate-400">
          Sin tareas programadas
        </div>
        <div
          v-for="card in cardsWithDue.slice(0, 8)"
          :key="card.id"
          class="mb-3 rounded-lg border border-slate-100 p-3"
        >
          <button
            class="text-left text-sm font-medium text-slate-800 hover:text-blue-600"
            :class="{ 'line-through text-slate-400': card.completed }"
            @click="openCard(card.id, card.boardId)"
          >
            {{ card.title }}
          </button>
          <p class="mt-1 text-xs text-slate-400">{{ formatDate(card.dueDate) }}</p>
          <div v-if="card.dueDate && !card.completed" class="mt-2 flex gap-2">
            <a
              :href="googleCalendarUrl({ title: card.title, description: card.description, dueDate: card.dueDate })"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink :size="12" />
              Google Calendar
            </a>
            <button
              class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              @click="exportCard({ ...card, dueDate: card.dueDate! })"
            >
              <Download :size="12" />
              .ics
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
