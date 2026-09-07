<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  MapPin,
  Calendar as CalIcon,
  Users,
  Trash2,
  Check,
  X as XIcon,
  Clock,
} from '@lucide/vue'
import { useEventsStore } from '@/stores/events'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { APP_LOCALE, APP_TIMEZONE } from '@/utils/datetime'
import type { WorkspaceEvent, EventCategory } from '@/types/v3'

const eventsStore = useEventsStore()
const store = useQuinListStore()
const auth = useAuthStore()

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

function dateKey(day: number) {
  const m = String(month.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year.value}-${m}-${d}`
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

const showCreate = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const newLocation = ref('')
const newMeetingUrl = ref('')
const newDate = ref('')
const newStartTime = ref('09:00')
const newEndTime = ref('10:00')
const newCategory = ref<EventCategory>('meeting')
const newColor = ref('#3b82f6')
const newRecurrence = ref<'none' | 'daily' | 'weekly' | 'monthly'>('none')
const creating = ref(false)
const errorMsg = ref('')

const categoryOptions: { value: EventCategory; label: string; emoji: string; color: string }[] = [
  { value: 'meeting', label: 'Reunión', emoji: '🤝', color: '#3b82f6' },
  { value: 'workshop', label: 'Workshop', emoji: '🛠️', color: '#8b5cf6' },
  { value: 'review', label: 'Revisión', emoji: '🔍', color: '#10b981' },
  { value: 'social', label: 'Social', emoji: '🎉', color: '#ec4899' },
  { value: 'deadline', label: 'Fecha límite', emoji: '⏰', color: '#ef4444' },
  { value: 'other', label: 'Otro', emoji: '📌', color: '#6b7280' },
]

function openCreate(initialDate?: string) {
  newTitle.value = ''
  newDescription.value = ''
  newLocation.value = ''
  newMeetingUrl.value = ''
  newDate.value = initialDate ?? new Date().toISOString().slice(0, 10)
  newStartTime.value = '09:00'
  newEndTime.value = '10:00'
  newCategory.value = 'meeting'
  newColor.value = '#3b82f6'
  newRecurrence.value = 'none'
  errorMsg.value = ''
  showCreate.value = true
}

async function submitCreate() {
  if (!newTitle.value.trim() || !newDate.value || !store.currentWorkspaceId) {
    errorMsg.value = 'Completa título y fecha'
    return
  }
  creating.value = true
  try {
    const startsAt = new Date(`${newDate.value}T${newStartTime.value}:00`).toISOString()
    const endsAt = new Date(`${newDate.value}T${newEndTime.value}:00`).toISOString()
    await eventsStore.createEvent({
      workspaceId: store.currentWorkspaceId,
      projectId: null,
      boardId: null,
      title: newTitle.value.trim(),
      description: newDescription.value.trim(),
      location: newLocation.value.trim(),
      meetingUrl: newMeetingUrl.value.trim(),
      startsAt,
      endsAt,
      allDay: false,
      color: newColor.value,
      category: newCategory.value,
      recurrence: newRecurrence.value,
      recurrenceEnd: null,
      createdBy: auth.currentUserId ?? '',
      updatedBy: null,
    })
    showCreate.value = false
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error al crear el evento'
  } finally {
    creating.value = false
  }
}

const upcoming = computed(() => eventsStore.upcoming.slice(0, 10))

function respondToEvent(eventId: string, response: 'accepted' | 'declined') {
  eventsStore.rsvp(eventId, response)
}

async function removeEvent(eventId: string) {
  if (!confirm('¿Eliminar este evento?')) return
  try {
    await eventsStore.deleteEvent(eventId)
  } catch (err) {
    console.error('[events] delete error:', err)
  }
}

function attendeesCount(eventId: string) {
  return eventsStore.attendeesFor(eventId).filter((a) => a.response === 'accepted').length
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
          Eventos del equipo
        </h1>
        <p class="text-sm text-slate-500">
          Reuniones, workshops y fechas límite compartidas con todo el equipo.
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        @click="openCreate()"
      >
        <Plus :size="16" />
        Nuevo evento
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
            class="min-h-[90px] cursor-pointer rounded-lg border border-transparent p-1 hover:border-blue-200 hover:bg-blue-50/50"
            :class="{
              'bg-blue-50 border-blue-200':
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear(),
              invisible: day === null,
            }"
            @click="day && openCreate(dateKey(day))"
          >
            <span v-if="day" class="text-xs font-medium text-slate-600">{{ day }}</span>
            <button
              v-for="ev in day ? eventsForDay(day) : []"
              :key="ev.id"
              class="mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[0.65rem] font-medium text-white"
              :style="{ background: ev.color }"
              :title="ev.title"
            >
              {{ ev.title }}
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Próximos eventos</h2>
        <div v-if="upcoming.length === 0" class="text-sm text-slate-400">
          No hay eventos próximos.
        </div>
        <div
          v-for="ev in upcoming"
          :key="ev.id"
          class="mb-3 rounded-lg border border-slate-100 p-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :style="{ background: ev.color }"
                />
                <span class="text-sm font-semibold text-slate-800">{{ ev.title }}</span>
              </div>
              <p class="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Clock :size="12" />
                {{ new Date(ev.startsAt).toLocaleString(APP_LOCALE, { timeZone: APP_TIMEZONE, dateStyle: 'short', timeStyle: 'short' }) }}
              </p>
              <p v-if="ev.location" class="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <MapPin :size="12" />
                {{ ev.location }}
              </p>
              <p v-if="ev.meetingUrl" class="mt-1 flex items-center gap-2 text-xs">
                <Video :size="12" class="text-blue-500" />
                <a :href="ev.meetingUrl" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                  Unirse a la videollamada
                </a>
              </p>
              <div class="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Users :size="12" />
                <span>{{ attendeesCount(ev.id) }} confirmados</span>
              </div>
            </div>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <button
              class="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
              @click="respondToEvent(ev.id, 'accepted')"
            >
              <Check :size="12" /> Asistiré
            </button>
            <button
              class="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              @click="respondToEvent(ev.id, 'declined')"
            >
              <XIcon :size="12" /> No puedo
            </button>
            <button
              class="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
              @click="removeEvent(ev.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showCreate = false"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Nuevo evento</h2>
        <div class="space-y-3">
          <input
            v-model="newTitle"
            type="text"
            placeholder="Título del evento"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <textarea
            v-model="newDescription"
            placeholder="Descripción (opcional)"
            rows="2"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <div class="grid grid-cols-3 gap-2">
            <input
              v-model="newDate"
              type="date"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              v-model="newStartTime"
              type="time"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              v-model="newEndTime"
              type="time"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="newLocation"
              type="text"
              placeholder="Ubicación (opcional)"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <input
              v-model="newMeetingUrl"
              type="url"
              placeholder="URL de videollamada (Zoom, Meet...)"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categoryOptions"
              :key="cat.value"
              class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition"
              :class="
                newCategory === cat.value
                  ? 'border-transparent text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              :style="newCategory === cat.value ? { background: cat.color } : {}"
              @click="newCategory = cat.value; newColor = cat.color"
            >
              {{ cat.emoji }} {{ cat.label }}
            </button>
          </div>
          <select
            v-model="newRecurrence"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="none">Sin repetición</option>
            <option value="daily">Cada día</option>
            <option value="weekly">Cada semana</option>
            <option value="monthly">Cada mes</option>
          </select>
          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="showCreate = false"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="creating"
            @click="submitCreate"
          >
            {{ creating ? 'Creando...' : 'Crear evento' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>