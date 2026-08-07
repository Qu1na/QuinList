<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  Activity,
  Flag,
  AlertTriangle,
  Wallet,
  ListTodo,
  Users,
  Package,
  ArrowRight,
  Settings2,
  Paperclip,
  FolderOpen,
  Zap,
  Ban,
  Gauge,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import BudgetProgressBar from '@/components/projects/shared/BudgetProgressBar.vue'
import ProjectDonutChart from '@/components/projects/shared/ProjectDonutChart.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import RelativeTime from '@/components/ui/RelativeTime.vue'
import { formatDate } from '@/utils/permissions'
import {
  calendarTimeElapsedPercent,
  formatRemainingDaysLabel,
  isCalendarOverdue,
} from '@/utils/datetime'
import ActivityLine from '@/components/projects/shared/ActivityLine.vue'
import { useProjectHealthConfig } from '@/composables/useProjectHealthConfig'
import { calculateProjectHealth } from '@/utils/projectHealth'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'
import { memberWorkload } from '@/utils/projectReports'
import {
  KANBAN_COLUMNS,
  TASK_STATUS_LABELS,
  isTaskOverdue,
  isProjectOverdue,
} from '@/utils/projectStats'
import {
  avgVelocity,
  buildAlertItems,
  buildAttentionQueue,
  burnupSeries,
  dueSoonTasks,
  priorityDistribution,
  scheduleVariance,
  topOpenRisks,
  unassignedActiveCount,
  upcomingMilestones,
  velocitySeries,
} from '@/utils/projectDashboardMetrics'
import type { ProjectDetailTab } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const WIDGETS_KEY = 'ql-dashboard-widgets-v2'

type WidgetId =
  | 'alerts'
  | 'kpis'
  | 'analytics'
  | 'attention'
  | 'workload'
  | 'ops'
  | 'activity'
  | 'files'
  | 'budget'

const defaultWidgets: Record<WidgetId, boolean> = {
  alerts: true,
  kpis: true,
  analytics: true,
  attention: true,
  workload: true,
  ops: true,
  activity: true,
  files: true,
  budget: true,
}

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()
const router = useRouter()
const route = useRoute()

const showWidgetPanel = ref(false)
const widgets = ref<Record<WidgetId, boolean>>({ ...defaultWidgets })

function loadWidgets() {
  try {
    const raw = localStorage.getItem(`${WIDGETS_KEY}-${props.projectId}`)
    const merged = raw ? { ...defaultWidgets, ...JSON.parse(raw) } : { ...defaultWidgets }
    if (project.value && !isProjectFinanceEnabled(project.value)) {
      merged.budget = false
    }
    widgets.value = merged
  } catch {
    widgets.value = { ...defaultWidgets }
  }
}

watch(() => props.projectId, () => loadWidgets(), { immediate: true })
watch(
  widgets,
  (v) => localStorage.setItem(`${WIDGETS_KEY}-${props.projectId}`, JSON.stringify(v)),
  { deep: true },
)

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const dashboard = computed(() => projectsStore.getProjectDashboard(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const risks = computed(() => projectsStore.getProjectRisks(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))
const deliverables = computed(() => projectsStore.getProjectDeliverables(props.projectId))
const activities = computed(() => projectsStore.getProjectActivities(props.projectId))
const timeEntries = computed(() => projectsStore.getProjectTimeEntries(props.projectId))
const teamCount = computed(() => members.value.length)
const deliverableCount = computed(() => deliverables.value.length)
const openRisks = computed(() => risks.value.filter((r) => r.status === 'open'))
const completedMilestones = computed(() => milestones.value.filter((m) => m.completed).length)
const MAX_RECENT_FILES = 4

const recentFiles = computed(() =>
  projectsStore.getProjectFiles(props.projectId).slice(0, MAX_RECENT_FILES),
)
const overdueTasks = computed(() => tasks.value.filter((t) => isTaskOverdue(t)).length)
const blockedTasks = computed(() => tasks.value.filter((t) => t.status === 'blocked').length)
const dueSoon = computed(() => dueSoonTasks(tasks.value, 7))
const financeEnabled = computed(() => (project.value ? isProjectFinanceEnabled(project.value) : false))

const healthCounts = computed(() => ({
  tasks: tasks.value.length,
  milestones: milestones.value.length,
}))

const { factors: healthFactors } = useProjectHealthConfig(
  computed(() => props.projectId),
  project,
  healthCounts,
)

const health = computed(() =>
  calculateProjectHealth({
    taskProgress: dashboard.value.progress,
    overdueTasks: overdueTasks.value,
    blockedTasks: blockedTasks.value,
    openRisks: openRisks.value.length,
    projectOverdue: project.value ? isProjectOverdue(project.value) : false,
    milestonePercent: milestones.value.length
      ? Math.round((completedMilestones.value / milestones.value.length) * 100)
      : null,
    finance: financeEnabled.value ? dashboard.value.finance : null,
    factors: healthFactors.value,
  }),
)

const healthScore = computed(() => health.value.score)
const healthLabel = computed(() => health.value.label)
const healthColor = computed(() => health.value.color)
const healthCircumference = 2 * Math.PI * 38

const activeHealthFactors = computed(() => {
  const items = health.value.breakdown.filter((b) => b.enabled && b.available)
  const modifiers = items.filter((b) => b.id !== 'taskProgress')
  return (modifiers.length ? modifiers : items).slice(0, 5)
})

const timeElapsedPercent = computed(() => {
  if (!project.value) return null
  return calendarTimeElapsedPercent(project.value.startDate, project.value.dueDate)
})

const variance = computed(() =>
  scheduleVariance(dashboard.value.progress, timeElapsedPercent.value),
)

const remainingDaysLabel = computed(() => {
  if (!project.value?.dueDate) return null
  return formatRemainingDaysLabel(project.value.dueDate, {
    completed: project.value.status === 'completed',
    cancelled: project.value.status === 'cancelled',
  })
})

const alerts = computed(() => {
  if (!project.value) return []
  return buildAlertItems({
    project: project.value,
    overdueTasks: overdueTasks.value,
    blockedTasks: blockedTasks.value,
    dueSoonCount: dueSoon.value.length,
    openRisks: openRisks.value,
    finance: dashboard.value.finance,
    financeEnabled: financeEnabled.value,
    timeElapsedPct: timeElapsedPercent.value,
    progressPct: dashboard.value.progress,
  })
})

const donutSegments = computed(() => {
  const counts: Record<string, number> = {}
  for (const col of KANBAN_COLUMNS) counts[col] = 0
  for (const t of tasks.value) {
    const col = t.kanbanColumn || t.status
    if (counts[col] != null) counts[col]++
    else counts['todo'] = (counts['todo'] ?? 0) + 1
  }
  const colors: Record<string, string> = {
    todo: '#94a3b8',
    in_progress: '#5bbce4',
    review: '#6554c0',
    done: '#10b981',
    blocked: '#f4845f',
  }
  return KANBAN_COLUMNS.map((col) => ({
    label: TASK_STATUS_LABELS[col],
    value: counts[col] ?? 0,
    color: colors[col] ?? '#94a3b8',
  }))
})

const velocityPoints = computed(() => velocitySeries(tasks.value, 7))
const velocityAvg = computed(() => avgVelocity(velocityPoints.value))
const velocityMax = computed(() => Math.max(...velocityPoints.value.map((p) => p.value), 1))
const burnupPoints = computed(() => burnupSeries(tasks.value, 14))
const priorityBars = computed(() => priorityDistribution(tasks.value))
const attentionQueue = computed(() => buildAttentionQueue(tasks.value, 8))
const nextMilestones = computed(() => upcomingMilestones(milestones.value, 5))
const riskSpotlight = computed(() => topOpenRisks(risks.value, 3))
const unassignedCount = computed(() => unassignedActiveCount(tasks.value))

const teamRows = computed(() =>
  memberWorkload(
    members.value,
    tasks.value,
    deliverables.value,
    activities.value,
    timeEntries.value,
    (id) => resolveUser(id)?.name ?? 'Usuario',
  )
    .map((row) => {
      const active = row.tasksTotal - row.tasksDone
      return { ...row, active, donePct: row.tasksTotal ? Math.round((row.tasksDone / row.tasksTotal) * 100) : 0 }
    })
    .sort((a, b) => b.active - a.active)
    .slice(0, 6),
)

const maxActiveWorkload = computed(() => Math.max(...teamRows.value.map((r) => r.active), 1))

const milestoneProgress = computed(() =>
  milestones.value.length
    ? Math.round((completedMilestones.value / milestones.value.length) * 100)
    : 0,
)

function userName(id: string) {
  return resolveUser(id)?.name ?? 'Usuario'
}

function goToTab(tab: ProjectDetailTab) {
  router.replace({ path: route.path, query: { tab } })
}

const severityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const widgetOptions = computed(() => {
  const options: { id: WidgetId; label: string }[] = [
    { id: 'alerts', label: 'Alertas' },
    { id: 'kpis', label: 'Métricas principales' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'attention', label: 'Atención hoy' },
    { id: 'workload', label: 'Carga del equipo' },
    { id: 'ops', label: 'Hitos y riesgos' },
    { id: 'budget', label: 'Presupuesto' },
    { id: 'activity', label: 'Actividad reciente' },
    { id: 'files', label: 'Archivos recientes' },
  ]
  return financeEnabled.value ? options : options.filter((o) => o.id !== 'budget')
})

const shortcuts = computed(() => [
  {
    tab: 'tasks' as const,
    icon: ListTodo,
    label: 'Tareas',
    value: String(tasks.value.length),
    color: '#5bbce4',
  },
  {
    tab: 'risks' as const,
    icon: AlertTriangle,
    label: 'Riesgos',
    value: String(openRisks.value.length),
    color: '#f4845f',
  },
  {
    tab: 'team' as const,
    icon: Users,
    label: 'Equipo',
    value: String(teamCount.value),
    color: '#2d7eb8',
  },
  {
    tab: 'deliverables' as const,
    icon: Package,
    label: 'Entregables',
    value: String(deliverableCount.value),
    color: '#10b981',
  },
])
</script>

<template>
  <div v-if="project" class="dash">
    <!-- Hero -->
    <div class="dash-hero">
      <div class="dash-hero__top">
        <div v-if="widgets.alerts && alerts.length" class="dash-alerts">
          <button
            v-for="alert in alerts"
            :key="alert.id"
            type="button"
            class="dash-alert"
            :class="`dash-alert--${alert.severity}`"
            @click="goToTab(alert.tab)"
          >
            <AlertTriangle :size="13" />
            <span>{{ alert.label }}</span>
            <ArrowRight :size="13" class="dash-alert__arrow" />
          </button>
        </div>
        <button
          type="button"
          class="dash-hero__settings"
          title="Personalizar widgets"
          @click="showWidgetPanel = !showWidgetPanel"
        >
          <Settings2 :size="16" />
        </button>
      </div>

      <div class="dash-hero__body">
        <div class="dash-hero__content">
          <p class="dash-hero__eyebrow">Panel del proyecto</p>
          <h2 class="dash-hero__title">{{ project.name }}</h2>
          <div class="dash-hero__meta">
            <ProjectStatusBadge :status="project.status" />
            <span v-if="project.startDate && project.dueDate" class="dash-hero__dates">
              <Calendar :size="14" />
              {{ formatDate(project.startDate) }} — {{ formatDate(project.dueDate) }}
            </span>
            <span
              v-if="remainingDaysLabel"
              class="dash-hero__dates"
              :class="isProjectOverdue(project) ? 'dash-hero__dates--warn' : ''"
            >
              <Clock :size="14" />
              {{ remainingDaysLabel }}
              <template v-if="timeElapsedPercent != null"> · {{ timeElapsedPercent }}% del plazo</template>
            </span>
          </div>

          <ul v-if="activeHealthFactors.length" class="dash-health-factors">
            <li
              v-for="factor in activeHealthFactors"
              :key="factor.id"
              class="dash-health-factors__item"
              :class="factor.impact >= 0 ? 'dash-health-factors__item--ok' : 'dash-health-factors__item--bad'"
              :title="factor.detail"
            >
              <span class="dash-health-factors__label">{{ factor.detail }}</span>
              <span class="dash-health-factors__impact">
                {{ factor.impact >= 0 ? '+' : '' }}{{ factor.impact }}
              </span>
            </li>
          </ul>
        </div>

        <div class="dash-hero__health">
          <div class="dash-health-ring">
            <svg viewBox="0 0 88 88" aria-hidden="true">
              <circle class="dash-health-ring__track" cx="44" cy="44" r="38" />
              <circle
                class="dash-health-ring__progress"
                cx="44"
                cy="44"
                r="38"
                :stroke="healthColor"
                :stroke-dasharray="`${(healthScore / 100) * healthCircumference} ${healthCircumference}`"
              />
            </svg>
            <div class="dash-health-ring__label">
              <span class="dash-health-ring__value">{{ healthScore }}</span>
              <span class="dash-health-ring__text">{{ healthLabel }}</span>
            </div>
          </div>
          <p class="dash-hero__health-caption">Salud</p>
        </div>
      </div>
    </div>

    <div v-if="showWidgetPanel" class="project-card project-card--lg">
      <p class="mb-3 text-sm font-medium text-[#172b4d]">Mostrar en el dashboard</p>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label
          v-for="opt in widgetOptions"
          :key="opt.id"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#44546f] hover:bg-[#f5f5f7]"
        >
          <input v-model="widgets[opt.id]" type="checkbox" class="rounded border-[#c7c7cc]" />
          {{ opt.label }}
        </label>
      </div>
    </div>

    <!-- KPIs -->
    <div v-if="widgets.kpis" class="dash-kpis dash-kpis--dense">
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--blue"><TrendingUp :size="18" /></div>
        <div class="min-w-0">
          <p class="dash-kpi__value">{{ dashboard.progress }}%</p>
          <p class="dash-kpi__label">Avance</p>
          <div class="dash-kpi__bar"><div :style="{ width: `${dashboard.progress}%` }" /></div>
          <p
            class="dash-kpi__hint"
            :class="{
              'dash-kpi__hint--ok': variance.tone === 'ahead' || variance.tone === 'on_track',
              'dash-kpi__hint--bad': variance.tone === 'behind',
            }"
          >
            {{ variance.label }}
            <template v-if="timeElapsedPercent != null"> · plazo {{ timeElapsedPercent }}%</template>
          </p>
        </div>
      </div>

      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--green"><CheckCircle2 :size="18" /></div>
        <div>
          <p class="dash-kpi__value">{{ dashboard.completed }}</p>
          <p class="dash-kpi__label">Completadas</p>
          <p class="dash-kpi__hint">{{ dashboard.pending }} pendientes</p>
        </div>
      </div>

      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--red"><AlertTriangle :size="18" /></div>
        <div>
          <p class="dash-kpi__value">{{ overdueTasks }}</p>
          <p class="dash-kpi__label">Vencidas</p>
          <p class="dash-kpi__hint">{{ dueSoon.length }} por vencer (7d)</p>
        </div>
      </div>

      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--amber"><Ban :size="18" /></div>
        <div>
          <p class="dash-kpi__value">{{ blockedTasks }}</p>
          <p class="dash-kpi__label">Bloqueadas</p>
          <p class="dash-kpi__hint">Requieren desbloqueo</p>
        </div>
      </div>

      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--purple"><Flag :size="18" /></div>
        <div>
          <p class="dash-kpi__value">{{ milestoneProgress }}%</p>
          <p class="dash-kpi__label">Hitos</p>
          <p class="dash-kpi__hint">{{ completedMilestones }}/{{ milestones.length }} completados</p>
        </div>
      </div>

      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--blue"><Gauge :size="18" /></div>
        <div>
          <p class="dash-kpi__value">{{ velocityAvg }}</p>
          <p class="dash-kpi__label">Velocidad</p>
          <p class="dash-kpi__hint">tareas/día · 7 días</p>
        </div>
      </div>

      <div v-if="financeEnabled" class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--coral"><Wallet :size="18" /></div>
        <div>
          <p class="dash-kpi__value">
            {{ dashboard.finance ? `${dashboard.finance.usagePercent}%` : '—' }}
          </p>
          <p class="dash-kpi__label">Presupuesto</p>
          <p class="dash-kpi__hint">uso del presupuesto</p>
        </div>
      </div>
    </div>

    <!-- Analytics -->
    <div v-if="widgets.analytics" class="grid gap-4 xl:grid-cols-3">
      <div class="dash-chart-card xl:col-span-2">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="dash-section-title">Tendencia de avance</h3>
            <p class="dash-section-sub">
              Burnup acumulado · 14 días · total {{ tasks.length }} tareas
            </p>
          </div>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver tareas</button>
        </div>
        <LineChart
          :points="burnupPoints"
          :height="168"
          empty-text="Aún no hay tareas completadas para mostrar la tendencia"
        />
      </div>

      <div class="dash-chart-card">
        <h3 class="dash-section-title">Distribución por estado</h3>
        <p class="dash-section-sub mb-4">Tareas del proyecto</p>
        <ProjectDonutChart :segments="donutSegments" :size="148" />
      </div>
    </div>

    <div v-if="widgets.analytics" class="grid gap-4 lg:grid-cols-2">
      <div class="dash-chart-card">
        <div class="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 class="dash-section-title">Velocidad diaria</h3>
            <p class="dash-section-sub">Completadas por día · promedio {{ velocityAvg }}/día</p>
          </div>
        </div>
        <div class="dash-bars dash-bars--compact">
          <div v-for="point in velocityPoints" :key="point.label" class="dash-bars__col">
            <span class="dash-bars__value">{{ point.value }}</span>
            <div class="dash-bars__track">
              <div
                class="dash-bars__fill"
                :class="{ 'dash-bars__fill--avg': point.value >= velocityAvg && velocityAvg > 0 }"
                :style="{ height: `${(point.value / velocityMax) * 100}%` }"
              />
            </div>
            <span class="dash-bars__label">{{ point.label }}</span>
          </div>
        </div>
        <div class="dash-bars__avg-note">
          Línea de referencia: promedio {{ velocityAvg }} tareas/día
        </div>
      </div>

      <div class="dash-chart-card">
        <h3 class="dash-section-title">Por prioridad</h3>
        <p class="dash-section-sub mb-4">Tareas pendientes</p>
        <BarChart v-if="priorityBars.length" :items="priorityBars" />
        <p v-else class="text-sm text-[#626f86]">No hay tareas pendientes.</p>
      </div>
    </div>

    <!-- Attention + workload -->
    <div class="grid gap-4 lg:grid-cols-5">
      <div v-if="widgets.attention" class="dash-chart-card lg:col-span-3">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Zap :size="18" class="text-[#f4845f]" />
            Atención hoy
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver todas</button>
        </div>
        <ul v-if="attentionQueue.length" class="dash-attention">
          <li
            v-for="item in attentionQueue"
            :key="item.task.id"
            class="dash-attention__row"
          >
            <span
              class="dash-attention__tag"
              :class="`dash-attention__tag--${item.reason}`"
            >
              {{ item.reasonLabel }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-[#172b4d]">{{ item.task.title }}</p>
              <p class="text-xs text-[#626f86] capitalize">{{ item.task.priority }} prioridad</p>
            </div>
            <span
              class="shrink-0 text-sm"
              :class="isTaskOverdue(item.task) ? 'font-semibold text-[#f4845f]' : 'text-[#626f86]'"
            >
              {{ formatDate(item.task.dueDate) || 'Sin fecha' }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Nada urgente por ahora. Buen momento para avanzar.</p>
      </div>

      <div v-if="widgets.workload" class="dash-chart-card lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="dash-section-title">Carga del equipo</h3>
            <p class="dash-section-sub">
              Tareas activas
              <template v-if="unassignedCount"> · {{ unassignedCount }} sin asignar</template>
            </p>
          </div>
          <button type="button" class="project-link-btn" @click="goToTab('team')">Equipo</button>
        </div>
        <ul v-if="teamRows.length" class="space-y-3">
          <li v-for="row in teamRows" :key="row.userId" class="flex items-center gap-3">
            <UserAvatar :user-id="row.userId" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-medium text-[#172b4d]">{{ row.name }}</p>
                <span class="text-xs text-[#626f86]">{{ row.donePct }}% done</span>
              </div>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-[#ebebed]">
                <div
                  class="h-full rounded-full bg-[#f4845f]"
                  :style="{ width: `${(row.active / maxActiveWorkload) * 100}%` }"
                />
              </div>
            </div>
            <span class="text-sm font-semibold text-[#172b4d]">{{ row.active }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Sin miembros o tareas activas.</p>
      </div>
    </div>

    <!-- Ops: milestones, risks, budget -->
    <div
      v-if="widgets.ops || (widgets.budget && financeEnabled)"
      class="grid gap-4"
      :class="widgets.budget && financeEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2'"
    >
      <div v-if="widgets.ops" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Flag :size="18" class="text-[#6554c0]" />
            Próximos hitos
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('milestones')">Ver</button>
        </div>
        <ul v-if="nextMilestones.length" class="space-y-2">
          <li
            v-for="ms in nextMilestones"
            :key="ms.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-[#091e4214] bg-[#fafafa] px-3 py-2.5"
          >
            <p class="min-w-0 truncate text-sm font-medium text-[#172b4d]">{{ ms.title }}</p>
            <span
              class="shrink-0 text-xs"
              :class="ms.dueDate && isCalendarOverdue(ms.dueDate) ? 'font-semibold text-[#f4845f]' : 'text-[#626f86]'"
            >
              {{ formatDate(ms.dueDate) || 'Sin fecha' }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay hitos pendientes.</p>
      </div>

      <div v-if="widgets.ops" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <AlertTriangle :size="18" class="text-[#f4845f]" />
            Riesgos abiertos
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('risks')">Ver</button>
        </div>
        <p class="mb-3 text-sm text-[#626f86]">{{ openRisks.length }} en total</p>
        <ul v-if="riskSpotlight.length" class="space-y-2">
          <li
            v-for="risk in riskSpotlight"
            :key="risk.id"
            class="rounded-xl border border-[#091e4214] bg-[#fafafa] px-3 py-2.5"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="min-w-0 truncate text-sm font-medium text-[#172b4d]">{{ risk.title }}</p>
              <span class="dash-risk-sev" :class="`dash-risk-sev--${risk.severity}`">
                {{ severityLabels[risk.severity] }}
              </span>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Sin riesgos abiertos.</p>
      </div>

      <div v-if="widgets.budget && financeEnabled" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Wallet :size="18" class="text-[#f4845f]" />
            Presupuesto
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('finance')">Finanzas</button>
        </div>
        <BudgetProgressBar
          v-if="dashboard.finance"
          :percent="dashboard.finance.usagePercent"
          :spent="dashboard.finance.spent"
          :budget="dashboard.finance.budget"
          :currency="currency"
        />
        <div v-if="dashboard.finance" class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-[#fafafa] px-2 py-2">
            <p class="text-sm font-bold text-[#172b4d]">{{ formatMoney(dashboard.finance.budget, currency) }}</p>
            <p class="text-[11px] text-[#626f86]">Presupuesto</p>
          </div>
          <div class="rounded-lg bg-[#fafafa] px-2 py-2">
            <p class="text-sm font-bold text-[#f4845f]">{{ formatMoney(dashboard.finance.spent, currency) }}</p>
            <p class="text-[11px] text-[#626f86]">Gastado</p>
          </div>
          <div class="rounded-lg bg-[#fafafa] px-2 py-2">
            <p class="text-sm font-bold text-[#10b981]">{{ formatMoney(dashboard.finance.balance, currency) }}</p>
            <p class="text-[11px] text-[#626f86]">Saldo</p>
          </div>
        </div>
        <p v-else class="text-sm text-[#626f86]">Sin presupuesto configurado.</p>
      </div>
    </div>

    <div v-if="widgets.ops" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="link in shortcuts"
        :key="link.tab"
        type="button"
        class="dash-shortcut dash-shortcut--compact"
        @click="goToTab(link.tab)"
      >
        <div class="dash-shortcut__icon" :style="{ background: link.color + '18', color: link.color }">
          <component :is="link.icon" :size="18" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <p class="dash-shortcut__value">{{ link.value }}</p>
          <p class="dash-shortcut__label">{{ link.label }}</p>
        </div>
        <ArrowRight :size="14" class="text-[#c7c7cc]" />
      </button>
    </div>

    <!-- Feed -->
    <div
      v-if="widgets.activity || widgets.files"
      class="grid gap-4 lg:grid-cols-2"
    >
      <div v-if="widgets.activity" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Activity :size="18" class="text-[#5bbce4]" />
            Actividad reciente
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('activity')">Ver todo</button>
        </div>
        <ul v-if="dashboard.recentActivity.length" class="divide-y divide-[#ebebed]">
          <li
            v-for="act in dashboard.recentActivity"
            :key="act.id"
            class="flex gap-3 py-3 text-sm first:pt-0 last:pb-0"
          >
            <RelativeTime :iso="act.createdAt" class="w-24 shrink-0 text-xs text-[#626f86]" />
            <div class="min-w-0 flex-1">
              <ActivityLine :activity="act" :user-name="userName(act.userId)" class="text-sm" />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">Sin actividad registrada.</p>
      </div>

      <div v-if="widgets.files" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <FolderOpen :size="18" class="text-[#5bbce4]" />
            Archivos recientes
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('files')">Abrir Drive</button>
        </div>
        <div v-if="recentFiles.length" class="drive-grid drive-grid--recent">
          <div
            v-for="file in recentFiles"
            :key="`${file.sourceId}-${file.id}`"
            class="drive-file-card"
          >
            <Paperclip :size="24" class="text-[#f4845f]" />
            <p class="drive-file-card__name">{{ file.name }}</p>
            <p class="drive-file-card__meta">{{ file.source }} · <RelativeTime :iso="file.uploadedAt" /></p>
          </div>
        </div>
        <p v-else class="text-sm text-[#626f86]">Aún no hay archivos en este proyecto.</p>
      </div>
    </div>
  </div>
</template>
