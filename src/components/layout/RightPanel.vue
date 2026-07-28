<script setup lang="ts">
import { computed } from 'vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/permissions'
import type { Card } from '@/types'

const store = useQuinListStore()
const auth = useAuthStore()

const today = new Date()
const currentMonth = today.getMonth()
const currentYear = today.getFullYear()
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
const firstDay = new Date(currentYear, currentMonth, 1).getDay()

const monthName = today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
const calendarDays = computed(() => {
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
})

const upcomingCards = computed(() => store.getUpcomingCards())

const cardColors = ['bg-amber-100', 'bg-blue-100', 'bg-emerald-100', 'bg-pink-100', 'bg-violet-100']

function getCardColor(index: number) {
  return cardColors[index % cardColors.length]
}

function getLabelName(card: Card) {
  if (card.labelIds.length === 0) return store.currentWorkspace?.name ?? ''
  const label = store.getLabel(card.boardId, card.labelIds[0]!)
  return label?.name ?? store.currentWorkspace?.name ?? ''
}
</script>

<template>
  <aside class="h-full w-65 min-w-65 overflow-y-auto border-l border-slate-200 bg-white p-5">
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-slate-800">
        ¡Hola, {{ auth.currentUser?.name.split(' ')[0] }}!
      </h2>
      <p class="mt-1 text-sm capitalize text-slate-500">
        {{
          today.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
        }}
      </p>
    </div>

    <div class="mb-6">
      <h3 class="mb-3 text-sm font-semibold capitalize text-slate-700">{{ monthName }}</h3>
      <div class="grid grid-cols-7 gap-0.5 text-center">
        <span
          v-for="d in ['D', 'L', 'M', 'M', 'J', 'V', 'S']"
          :key="d"
          class="py-1 text-[0.65rem] font-semibold text-slate-400"
        >
          {{ d }}
        </span>
        <span
          v-for="(day, i) in calendarDays"
          :key="i"
          class="rounded-md py-1.5 text-xs text-slate-600"
          :class="{
            'bg-blue-600 font-bold text-white': day === today.getDate(),
            invisible: day === null,
          }"
        >
          {{ day }}
        </span>
      </div>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-slate-700">Próximas tareas</h3>
      <div
        v-for="(card, i) in upcomingCards"
        :key="card.id"
        class="mb-2 flex items-center justify-between rounded-lg px-4 py-3"
        :class="getCardColor(i)"
      >
        <span class="text-sm font-semibold text-slate-700">{{ getLabelName(card) }}</span>
        <span class="text-xs text-slate-500">{{ formatDate(card.dueDate) }}</span>
      </div>
      <p v-if="upcomingCards.length === 0" class="text-sm text-slate-400">No hay tareas próximas</p>
    </div>
  </aside>
</template>
