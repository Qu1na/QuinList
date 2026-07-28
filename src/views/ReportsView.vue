<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  Clock,
  LayoutGrid,
  ListTodo,
  AlertTriangle,
} from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { canManageMembers } from '@/utils/permissions'
import AccountShell from '@/components/layout/AccountShell.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import {
  statusSegments,
  priorityBars,
  boardBars,
  completionsByDay,
  avgDurationSeconds,
  formatDuration,
} from '@/utils/workspaceStats'

const store = useQuinListStore()

const canViewMetrics = computed(() =>
  canManageMembers(store.getUserRole(store.currentWorkspaceId)),
)

const cards = computed(() => store.getWorkspaceCards())
const boards = computed(() => store.workspaceBoards)

const stats = computed(() => {
  const all = cards.value
  const completed = all.filter((c) => c.completed)
  const avgSec = avgDurationSeconds(all)
  return {
    total: all.length,
    completed: completed.length,
    pending: all.filter((c) => !c.completed).length,
    alta: all.filter((c) => c.priority === 'alta' && !c.completed).length,
    avgLabel: avgSec ? formatDuration(avgSec) : '—',
    boardCount: boards.value.length,
  }
})

const statusData = computed(() => statusSegments(cards.value))
const priorityData = computed(() => priorityBars(cards.value))
const boardCountData = computed(() => boardBars(boards.value, cards.value))
const trendData = computed(() => completionsByDay(cards.value, 7))

const slowestCards = computed(() =>
  cards.value
    .filter((c) => c.completed && c.durationSeconds != null)
    .sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0))
    .slice(0, 5),
)

const boardDetails = computed(() =>
  boards.value.map((board) => {
    const boardCards = store.getBoardCards(board.id)
    const completed = boardCards.filter((c) => c.completed)
    const avg = avgDurationSeconds(boardCards)
    return {
      board,
      total: boardCards.length,
      completed: completed.length,
      pct: boardCards.length ? Math.round((completed.length / boardCards.length) * 100) : 0,
      avgLabel: avg ? formatDuration(avg) : '—',
    }
  }),
)
</script>

<template>
  <AccountShell>
    <template #header>
      <h1 class="mb-1 text-2xl font-semibold text-[#172b4d]">Centro de métricas</h1>
      <p class="mb-6 text-sm text-[#626f86]">
        Resumen de {{ store.currentWorkspace?.name }}
        <span v-if="!canViewMetrics" class="text-amber-600">· vista limitada</span>
      </p>
    </template>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm">
        <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#091e420f]">
          <ListTodo :size="16" class="text-[#44546f]" />
        </div>
        <p class="text-2xl font-bold text-[#172b4d]">{{ stats.total }}</p>
        <p class="text-xs text-[#626f86]">Total tareas</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm">
        <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
          <CheckCircle2 :size="16" class="text-green-600" />
        </div>
        <p class="text-2xl font-bold text-green-600">{{ stats.completed }}</p>
        <p class="text-xs text-[#626f86]">Completadas</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm">
        <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <Clock :size="16" class="text-amber-600" />
        </div>
        <p class="text-2xl font-bold text-amber-600">{{ stats.pending }}</p>
        <p class="text-xs text-[#626f86]">Pendientes</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm">
        <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <Clock :size="16" class="text-[#0c66e4]" />
        </div>
        <p class="text-2xl font-bold text-[#0c66e4]">{{ stats.avgLabel }}</p>
        <p class="text-xs text-[#626f86]">Tiempo promedio</p>
      </div>
      <div class="col-span-2 rounded-xl border border-[#091e4214] bg-white p-4 shadow-sm sm:col-span-1">
        <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <AlertTriangle :size="16" class="text-red-500" />
        </div>
        <p class="text-2xl font-bold text-red-500">{{ stats.alta }}</p>
        <p class="text-xs text-[#626f86]">Alta prioridad (pend.)</p>
      </div>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <section class="rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-[#172b4d]">Estado de las tareas</h2>
        <DonutChart v-if="stats.total" :segments="statusData" />
        <p v-else class="py-8 text-center text-sm text-[#626f86]">Aún no hay tareas en este espacio</p>
      </section>

      <section class="rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-[#172b4d]">Por prioridad</h2>
        <BarChart :items="priorityData" />
      </section>

      <section class="rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm">
        <h2 class="mb-1 text-sm font-semibold text-[#172b4d]">Completadas — últimos 7 días</h2>
        <p class="mb-4 text-xs text-[#626f86]">Tendencia diaria de tareas finalizadas</p>
        <LineChart :points="trendData" />
      </section>

      <section class="rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm">
        <h2 class="mb-1 text-sm font-semibold text-[#172b4d]">Tareas por tablero</h2>
        <p class="mb-4 text-xs text-[#626f86]">{{ stats.boardCount }} tablero(s) en el espacio</p>
        <BarChart :items="boardCountData" />
      </section>
    </div>

    <section class="mt-6 rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center gap-2">
        <LayoutGrid :size="18" class="text-[#0c66e4]" />
        <h2 class="text-sm font-semibold text-[#172b4d]">Progreso por tablero</h2>
      </div>

      <div v-if="boardDetails.length" class="space-y-4">
        <div v-for="item in boardDetails" :key="item.board.id">
          <div class="mb-1.5 flex items-center justify-between text-sm">
            <span class="font-medium text-[#172b4d]">{{ item.board.title }}</span>
            <span class="text-[#626f86]">
              {{ item.completed }}/{{ item.total }} · {{ item.pct }}% · prom. {{ item.avgLabel }}
            </span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-[#091e420f]">
            <div
              class="h-full rounded-full bg-[#0c66e4] transition-all"
              :style="{ width: `${item.pct}%` }"
            />
          </div>
        </div>
      </div>
      <p v-else class="py-6 text-center text-sm text-[#626f86]">No hay tableros en este espacio</p>
    </section>

    <section
      v-if="slowestCards.length"
      class="mt-6 rounded-xl border border-[#091e4214] bg-white p-5 shadow-sm"
    >
      <h2 class="mb-4 text-sm font-semibold text-[#172b4d]">Tareas que más tardaron</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[#091e4214] text-left text-xs text-[#626f86]">
              <th class="pb-2 font-medium">Tarea</th>
              <th class="pb-2 font-medium">Tablero</th>
              <th class="pb-2 text-right font-medium">Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="card in slowestCards"
              :key="card.id"
              class="border-b border-[#091e420a] last:border-0"
            >
              <td class="py-2.5 font-medium text-[#172b4d]">{{ card.title }}</td>
              <td class="py-2.5 text-[#626f86]">
                {{ boards.find((b) => b.id === card.boardId)?.title ?? '—' }}
              </td>
              <td class="py-2.5 text-right text-[#44546f]">
                {{ formatDuration(card.durationSeconds!) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AccountShell>
</template>
