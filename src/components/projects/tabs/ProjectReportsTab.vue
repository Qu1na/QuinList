<script setup lang="ts">
import { computed } from 'vue'
import {
  BarChart3,
  PieChart,
  Wallet,
  Users,
  Activity,
  ListTodo,
  Package,
  Clock,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import ProjectDonutChart from '@/components/projects/shared/ProjectDonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import ColumnChart from '@/components/charts/ColumnChart.vue'
import { PRIORITY_LABELS, calcFinanceSummary } from '@/utils/projectStats'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'
import {
  tasksByStatus,
  tasksByAssignee,
  tasksCompletedByUser,
  deliverablesByStatus,
  deliverablesByAssignee,
  activitiesByUser,
  activityTimeline,
  timeLoggedByUser,
} from '@/utils/projectReports'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const financeEnabled = computed(() => (project.value ? isProjectFinanceEnabled(project.value) : false))

const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const costs = computed(() => projectsStore.getProjectCosts(props.projectId))
const deliverables = computed(() => projectsStore.getProjectDeliverables(props.projectId))
const activities = computed(() => projectsStore.getProjectActivities(props.projectId))
const timeEntries = computed(() => projectsStore.getProjectTimeEntries(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))

const userName = (id: string) => resolveUser(id)?.name ?? 'Usuario'

const statusData = computed(() => tasksByStatus(tasks.value))
const priorityData = computed(() => {
  const counts = { alta: 0, media: 0, baja: 0 }
  for (const t of tasks.value) counts[t.priority]++
  return [
    { label: PRIORITY_LABELS.alta, value: counts.alta, color: '#f4845f' },
    { label: PRIORITY_LABELS.media, value: counts.media, color: '#2d7eb8' },
    { label: PRIORITY_LABELS.baja, value: counts.baja, color: '#5bbce4' },
  ]
})

const assigneeData = computed(() => tasksByAssignee(tasks.value, userName))
const completedByUser = computed(() => tasksCompletedByUser(tasks.value, userName))
const deliverableStatusData = computed(() => deliverablesByStatus(deliverables.value))
const deliverableAssigneeData = computed(() => deliverablesByAssignee(deliverables.value, userName))
const activityByUser = computed(() => activitiesByUser(activities.value, userName, 30))
const activityDays = computed(() => activityTimeline(activities.value, 14))
const timeByUser = computed(() => timeLoggedByUser(timeEntries.value, userName))

const finance = computed(() =>
  project.value ? calcFinanceSummary(project.value, costs.value) : null,
)

const teamSummary = computed(() => ({
  members: members.value.length,
  activeUsers: new Set(activities.value.slice(0, 50).map((a) => a.userId)).size,
  totalHours: Math.round(timeEntries.value.reduce((s, e) => s + e.minutes, 0) / 60 * 10) / 10,
}))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="project-page-title">Reportes</h2>
      <p class="project-page-sub">
        Estadísticas del proyecto por tareas, equipo, usuarios y actividad
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <Users :size="20" class="mb-2 text-[#6554c0]" />
        <p class="project-kpi__value">{{ teamSummary.members }}</p>
        <p class="project-kpi__label">Integrantes</p>
      </div>
      <div class="project-card project-kpi">
        <Activity :size="20" class="mb-2 text-[#2d7eb8]" />
        <p class="project-kpi__value">{{ activities.length }}</p>
        <p class="project-kpi__label">Eventos de actividad</p>
      </div>
      <div class="project-card project-kpi">
        <Clock :size="20" class="mb-2 text-[#f4845f]" />
        <p class="project-kpi__value">{{ teamSummary.totalHours }} h</p>
        <p class="project-kpi__label">Tiempo registrado</p>
      </div>
    </div>

    <section class="space-y-5">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#626f86]">
        <ListTodo :size="16" />
        Tareas
      </h3>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="project-card project-card--lg">
          <h4 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <PieChart :size="20" class="text-[#5bbce4]" />
            Tareas por estado
          </h4>
          <ProjectDonutChart
            v-if="statusData.length"
            :segments="statusData"
            :size="190"
            center-sub-label="tareas"
          />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin datos de tareas.</p>
        </div>

        <div class="project-card project-card--lg">
          <h4 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <BarChart3 :size="20" class="text-[#2d7eb8]" />
            Tareas por prioridad
          </h4>
          <BarChart v-if="tasks.length" :items="priorityData" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin datos de tareas.</p>
        </div>
      </div>
    </section>

    <section class="space-y-5">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#626f86]">
        <Users :size="16" />
        Por equipo y usuarios
      </h3>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="project-card project-card--lg">
          <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Tareas asignadas por usuario</h4>
          <BarChart v-if="assigneeData.length" :items="assigneeData" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin tareas asignadas.</p>
        </div>

        <div class="project-card project-card--lg">
          <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Tareas completadas por usuario</h4>
          <BarChart v-if="completedByUser.length" :items="completedByUser" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Nadie ha completado tareas aún.</p>
        </div>

        <div class="project-card project-card--lg">
          <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Tiempo registrado por usuario</h4>
          <BarChart v-if="timeByUser.length" :items="timeByUser" unit=" h" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin tiempo registrado.</p>
        </div>

        <div class="project-card project-card--lg">
          <h4 class="mb-5 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <Package :size="18" class="text-[#5bbce4]" />
            Entregables por responsable
          </h4>
          <BarChart v-if="deliverableAssigneeData.length" :items="deliverableAssigneeData" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin entregables.</p>
        </div>
      </div>
    </section>

    <section class="space-y-5">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#626f86]">
        <Activity :size="16" />
        Actividad
      </h3>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="project-card project-card--lg">
          <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Actividad por usuario (30 días)</h4>
          <BarChart v-if="activityByUser.length" :items="activityByUser" />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin actividad reciente.</p>
        </div>

        <div class="project-card project-card--lg">
          <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Entregables por estado</h4>
          <ProjectDonutChart
            v-if="deliverableStatusData.length"
            :segments="deliverableStatusData"
            :size="190"
            center-sub-label="entregables"
          />
          <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin entregables.</p>
        </div>
      </div>

      <div class="project-card project-card--lg">
        <h4 class="mb-5 text-base font-semibold text-[#172b4d]">Actividad diaria (últimos 14 días)</h4>
        <ColumnChart v-if="activityDays.some((p) => p.value > 0)" :points="activityDays" :height="200" />
        <LineChart v-else :points="activityDays" :height="200" />
      </div>
    </section>

    <section v-if="financeEnabled && finance" class="space-y-5">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#626f86]">
        <Wallet :size="16" />
        Finanzas
      </h3>
      <div class="project-card project-card--lg">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-[#091e4214] bg-[#fafafa] p-4">
            <p class="text-xs font-medium text-[#626f86]">Presupuesto base</p>
            <p class="mt-1 text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.budget, currency) }}</p>
          </div>
          <div class="rounded-xl border border-[#091e4214] bg-[#fafafa] p-4">
            <p class="text-xs font-medium text-[#626f86]">Ingresos</p>
            <p class="mt-1 text-xl font-bold text-[#2d7eb8]">{{ formatMoney(finance.income, currency) }}</p>
          </div>
          <div class="rounded-xl border border-[#091e4214] bg-[#fafafa] p-4">
            <p class="text-xs font-medium text-[#626f86]">Egresos</p>
            <p class="mt-1 text-xl font-bold text-[#f4845f]">{{ formatMoney(finance.expenses, currency) }}</p>
          </div>
          <div class="rounded-xl border border-[#091e4214] bg-[#fafafa] p-4">
            <p class="text-xs font-medium text-[#626f86]">Saldo disponible</p>
            <p class="mt-1 text-xl font-bold text-[#172b4d]">{{ formatMoney(finance.balance, currency) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
