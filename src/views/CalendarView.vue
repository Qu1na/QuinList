<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Calendar as CalIcon,
  Video,
  MapPin,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useEventsStore } from '@/stores/events'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { formatDate } from '@/utils/permissions'
import { APP_LOCALE, APP_TIMEZONE, compareCalendarDates } from '@/utils/datetime'
import { downloadIcs, googleCalendarUrl } from '@/utils/calendar'

import type { WorkspaceEvent } from '@/types/v3'

const store = useQuinListStore()
const eventsStore = useEventsStore()
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

function eventsForDay(day: number): WorkspaceEvent[] {
  return eventsStore.eventsByDate(dateKey(day))
}

function prevMonth() {
  viewDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(year.value, month.value + 1, 1)
}

function jumpToday() {
  viewDate.value = new Date()
}

function exportAll() {
  const allCards = workspaceCards.value
  const allEvents = eventsStore.events
  const events: string[] = []
  for (const c of allCards) {
    if (!c.dueDate) continue
    const date = c.dueDate.replace(/-/g, '')
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:card-${c.id}@quinlist.app`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:[Tarjeta] ${c.title}`,
        `DESCRIPTION:${c.description || c.title}`,
        'END:VEVENT',
      ].join('\r\n'),
    )
  }
  for (const ev of allEvents) {
    if (!ev.startsAt) continue
    const dtStart = new Date(ev.startsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const dtEnd = ev.endsAt
      ? new Date(ev.endsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : dtStart
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:event-${ev.id}@quinlist.app`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[${ev.category}] ${ev.title}`,
        `DESCRIPTION:${ev.description || ev.title}`,
        ev.location ? `LOCATION:${ev.location}` : '',
        ev.meetingUrl ? `URL:${ev.meetingUrl}` : '',
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n'),
    )
  }
  if (events.length === 0) {
    notif.push({
      type: 'card_due_soon',
      title: 'Sin fechas',
      message: 'No hay tareas ni eventos con fecha para exportar',
      userId: auth.currentUserId ?? 'u1',
    })
    return
  }
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QuinList//ES',
    events.join('\r\n'),
    'END:VCALENDAR',
  ].join('\r\n')
  const filename = (store.currentWorkspace?.name ?? 'quinlist').replace(/\s+/g, '-').toLowerCase()
  downloadIcs(content, `${filename}.ics`)
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

function evIcsParams(ev: WorkspaceEvent) {
  const start = new Date(ev.startsAt)
  const end = ev.endsAt ? new Date(ev.endsAt) : new Date(start.getTime() + 60 * 60 * 1000)
  return {
    details: ev.meetingUrl ? `${ev.description || ev.title}\n\nVideollamada: ${ev.meetingUrl}` : ev.description || ev.title,
    dates: `${formatICS(start)}/${formatICS(end)}`,
  }
}

function formatICS(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

onMounted(() => {
  if (store.currentWorkspaceId && !eventsStore.isLoaded) {
    eventsStore.load(store.currentWorkspaceId)
  }
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <CalIcon :size="22" class="text-blue-500" />
          Calendario
        </h1>
        <p class="text-sm text-slate-500">
          Tarjetas con fecha límite, eventos del equipo, milestones de proyectos.
        </p>
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
            <button class="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100" @click="jumpToday">
              Hoy
            </button>
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
            class="min-h-[90px] rounded-lg border border-transparent p-1"
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
              v-for="ev in day ? eventsForDay(day) : []"
              :key="'ev-' + ev.id"
              class="mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.65rem] font-medium text-white"
              :style="{ background: ev.color }"
              :title="ev.title + (ev.location ? ' @ ' + ev.location : '')"
            >
              {{ ev.title }}
            </button>
            <button
              v-for="card in day ? cardsForDay(day) : []"
              :key="card.id"
              class="mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.65rem] font-medium"
              :class="card.completed ? 'bg-green-100 text-green-700 line-through' : 'bg-slate-100 text-slate-700'"
              @click="openCard(card.id, card.boardId)"
            >
              {{ card.title }}
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Próximas fechas</h2>

        <h3 class="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Eventos</h3>
        <div v-if="eventsStore.upcoming.length === 0" class="mb-4 text-sm text-slate-400">
          Sin eventos próximos
        </div>
        <div
          v-for="ev in eventsStore.upcoming.slice(0, 5)"
          :key="ev.id"
          class="mb-3 rounded-lg border border-slate-100 p-3"
        >
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full" :style="{ background: ev.color }" />
            <span class="text-sm font-medium text-slate-800">{{ ev.title }}</span>
          </div>
          <p class="mt-1 text-xs text-slate-400">
            {{ new Date(ev.startsAt).toLocaleString(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: 'short', timeStyle: 'short' }) }}
          </p>
          <p v-if="ev.location" class="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin :size="10" /> {{ ev.location }}
          </p>
          <p v-if="ev.meetingUrl" class="mt-1 flex items-center gap-1 text-xs">
            <Video :size="10" class="text-blue-500" />
            <a :href="ev.meetingUrl" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
              Unirse
            </a>
          </p>
          <a
            :href="googleCalendarUrl({ title: ev.title, description: evIcsParams(ev).details, dueDate: ev.startsAt.slice(0, 10) })"
            target="_blank"
            rel="noopener"
            class="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink :size="10" /> Google Calendar
          </a>
        </div>

        <h3 class="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Tarjetas</h3>
        <div v-if="cardsWithDue.length === 0" class="text-sm text-slate-400">Sin tareas programadas</div>
        <div
          v-for="card in cardsWithDue.slice(0, 6)"
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
              <ExternalLink :size="10" /> Google
            </a>
            <button
              class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              @click="exportCard({ ...card, dueDate: card.dueDate! })"
            >
              <Download :size="10" /> .ics
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>