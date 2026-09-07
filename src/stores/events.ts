import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WorkspaceEvent, EventAttendee } from '@/types/v3'
import * as eventsApi from '@/services/events'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notifications'

export const useEventsStore = defineStore('events', () => {
  const events = ref<WorkspaceEvent[]>([])
  const attendees = ref<Record<string, EventAttendee[]>>({})
  const isLoaded = ref(false)
  const isLoading = ref(false)

  const sortedByDate = computed(() =>
    [...events.value].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
  )

  const upcoming = computed(() => {
    const now = Date.now()
    return sortedByDate.value.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now)
  })

  function eventsByDate(date: string): WorkspaceEvent[] {
    return events.value.filter((e) => e.startsAt.slice(0, 10) === date)
  }

  async function load(workspaceId: string) {
    if (isLoading.value) return
    isLoading.value = true
    try {
      events.value = await eventsApi.listEvents(workspaceId)
      const attendeeEntries = await Promise.all(events.value.map(async (e) => [e.id, await eventsApi.listAttendees(e.id)] as const))
      attendees.value = Object.fromEntries(attendeeEntries)
      isLoaded.value = true
    } catch (err) {
      console.error('[events] load error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createEvent(input: Omit<WorkspaceEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceEvent> {
    const ev = await eventsApi.createEvent(input)
    events.value.push(ev)
    return ev
  }

  async function updateEvent(id: string, updates: Partial<WorkspaceEvent>) {
    const idx = events.value.findIndex((e) => e.id === id)
    if (idx === -1) return
    const prev = events.value[idx]!
    const next: WorkspaceEvent = { ...prev, ...updates, id, updatedAt: new Date().toISOString() }
    events.value[idx] = next
    try {
      await eventsApi.updateEvent(id, updates)
    } catch (err) {
      events.value[idx] = prev
      throw err
    }
  }

  async function deleteEvent(id: string) {
    const prev = events.value
    events.value = events.value.filter((e) => e.id !== id)
    try {
      await eventsApi.deleteEvent(id)
    } catch (err) {
      events.value = prev
      throw err
    }
  }

  async function rsvp(eventId: string, response: EventAttendee['response']) {
    const auth = useAuthStore()
    if (!auth.currentUserId) return
    const att = await eventsApi.rsvpEvent(eventId, auth.currentUserId, response)
    const list = attendees.value[eventId] ?? []
    const idx = list.findIndex((a) => a.userId === auth.currentUserId)
    if (idx >= 0) list[idx] = att
    else list.push(att)
    attendees.value[eventId] = [...list]
    const ev = events.value.find((e) => e.id === eventId)
    if (ev && response !== 'declined') {
      const notif = useNotificationStore()
      notif.push({
        type: 'event_rsvp',
        title: 'RSVP registrado',
        message: `Tu respuesta al evento "${ev.title}" fue guardada`,
        userId: auth.currentUserId,
      })
    }
  }

  function attendeesFor(eventId: string): EventAttendee[] {
    return attendees.value[eventId] ?? []
  }

  function reset() {
    events.value = []
    attendees.value = {}
    isLoaded.value = false
  }

  return {
    events,
    attendees,
    isLoaded,
    isLoading,
    sortedByDate,
    upcoming,
    eventsByDate,
    load,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvp,
    attendeesFor,
    reset,
  }
})