<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import DonutChart from '@/components/charts/DonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { TASK_STATUS_LABELS } from '@/utils/projectStats'
import { calcFinanceSummary } from '@/utils/projectStats'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const costs = computed(() => projectsStore.getProjectCosts(props.projectId))

const STATUS_COLORS = ['#0c66e4', '#6554c0', '#44546f', '#626f86', '#091e42']
const PRIORITY_COLORS = { alta: '#44546f', media: '#0c66e4', baja: '#626f86' }

const statusData = computed(() => {
  const counts = new Map<string, number>()
  for (const t of tasks.value) {
    const label = TASK_STATUS_LABELS[t.status]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([label, value], i) => ({
    label,
    value,
    color: STATUS_COLORS[i % STATUS_COLORS.length]!,
  }))
})

const priorityData = computed(() => {
  const counts = { alta: 0, media: 0, baja: 0 }
  for (const t of tasks.value) counts[t.priority]++
  return [
    { label: 'Alta', value: counts.alta, color: PRIORITY_COLORS.alta },
    { label: 'Media', value: counts.media, color: PRIORITY_COLORS.media },
    { label: 'Baja', value: counts.baja, color: PRIORITY_COLORS.baja },
  ]
})

const finance = computed(() =>
  project.value ? calcFinanceSummary(project.value, costs.value) : null,
)
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-[#172b4d]">Reportes y estadísticas</h2>
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <h3 class="mb-4 text-sm font-medium text-[#626f86]">Tareas por estado</h3>
        <DonutChart v-if="statusData.length" :segments="statusData" />
        <p v-else class="text-sm text-[#626f86]">Sin datos.</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <h3 class="mb-4 text-sm font-medium text-[#626f86]">Tareas por prioridad</h3>
        <BarChart v-if="tasks.length" :items="priorityData" />
        <p v-else class="text-sm text-[#626f86]">Sin datos.</p>
      </div>
    </div>
    <div v-if="finance" class="rounded-xl border border-[#091e4214] bg-white p-5">
      <h3 class="mb-4 text-sm font-medium text-[#626f86]">Resumen financiero</h3>
      <div class="grid gap-4 sm:grid-cols-4 text-sm">
        <div>
          <p class="text-[#626f86]">Presupuesto base</p>
          <p class="text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.budget, currency) }}</p>
        </div>
        <div>
          <p class="text-[#626f86]">Ingresos</p>
          <p class="text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.income, currency) }}</p>
        </div>
        <div>
          <p class="text-[#626f86]">Egresos</p>
          <p class="text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.expenses, currency) }}</p>
        </div>
        <div>
          <p class="text-[#626f86]">Saldo disponible</p>
          <p class="text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.balance, currency) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
