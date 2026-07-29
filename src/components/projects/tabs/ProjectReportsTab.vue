<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, PieChart, Wallet } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import ProjectDonutChart from '@/components/projects/shared/ProjectDonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { TASK_STATUS_LABELS, calcFinanceSummary } from '@/utils/projectStats'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const costs = computed(() => projectsStore.getProjectCosts(props.projectId))

const STATUS_COLORS = ['#2d7eb8', '#5bbce4', '#f4845f', '#626f86', '#172b4d']
const PRIORITY_COLORS = { alta: '#f4845f', media: '#2d7eb8', baja: '#5bbce4' }

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
  <div class="space-y-7">
    <div>
      <h2 class="project-page-title">Reportes</h2>
      <p class="project-page-sub">Estadísticas de tareas y resumen financiero del proyecto</p>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <div class="project-card project-card--lg">
        <h3 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <PieChart :size="20" class="text-[#5bbce4]" />
          Tareas por estado
        </h3>
        <ProjectDonutChart v-if="statusData.length" :segments="statusData" :size="180" />
        <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin datos de tareas.</p>
      </div>

      <div class="project-card project-card--lg">
        <h3 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <BarChart3 :size="20" class="text-[#2d7eb8]" />
          Tareas por prioridad
        </h3>
        <BarChart v-if="tasks.length" :items="priorityData" />
        <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin datos de tareas.</p>
      </div>
    </div>

    <div v-if="finance" class="project-card project-card--lg">
      <h3 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
        <Wallet :size="20" class="text-[#f4845f]" />
        Resumen financiero
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="project-card project-kpi">
          <p class="project-kpi__label">Presupuesto base</p>
          <p class="project-kpi__value text-xl">{{ formatMoney(finance.budget, currency) }}</p>
        </div>
        <div class="project-card project-kpi">
          <p class="project-kpi__label">Ingresos</p>
          <p class="project-kpi__value text-xl text-[#2d7eb8]">{{ formatMoney(finance.income, currency) }}</p>
        </div>
        <div class="project-card project-kpi">
          <p class="project-kpi__label">Egresos</p>
          <p class="project-kpi__value text-xl text-[#f4845f]">{{ formatMoney(finance.expenses, currency) }}</p>
        </div>
        <div class="project-card project-kpi">
          <p class="project-kpi__label">Saldo disponible</p>
          <p class="project-kpi__value text-xl">{{ formatMoney(finance.balance, currency) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
