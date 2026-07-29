<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuinListStore } from '@/stores/quinlist'
import { priorityLabel, priorityColor } from '@/utils/permissions'
import { compareCalendarDates } from '@/utils/datetime'

const store = useQuinListStore()
const router = useRouter()

const highPriorityCards = computed(() =>
  store
    .getWorkspaceCards()
    .filter((c) => c.priority === 'alta' && !c.completed)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return compareCalendarDates(a.dueDate, b.dueDate)
      return 0
    }),
)
</script>

<template>
  <div class="p-6">
    <h1 class="mb-2 text-2xl font-bold text-slate-800">Issues</h1>
    <p class="mb-6 text-sm text-slate-500">Tareas de prioridad alta pendientes</p>

    <div v-if="highPriorityCards.length === 0" class="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-400">
      No hay issues pendientes
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="card in highPriorityCards"
        :key="card.id"
        class="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-red-200 hover:shadow-sm"
        @click="router.push({ name: 'board', params: { boardId: card.boardId } })"
      >
        <span class="h-3 w-3 rounded-full" :style="{ background: priorityColor(card.priority) }" />
        <div class="flex-1">
          <p class="font-medium text-slate-800">{{ card.title }}</p>
          <p class="text-xs text-slate-400">{{ priorityLabel(card.priority) }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
