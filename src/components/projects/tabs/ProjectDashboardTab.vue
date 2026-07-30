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
  Target,
  Zap,
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import BudgetProgressBar from '@/components/projects/shared/BudgetProgressBar.vue'
import ProjectDonutChart from '@/components/projects/shared/ProjectDonutChart.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import RelativeTime from '@/components/ui/RelativeTime.vue'
import { formatDate } from '@/utils/permissions'
import {
  calendarTimeElapsedPercent,
  formatRemainingDaysLabel,
  lastCalendarDays,
} from '@/utils/datetime'
import ActivityLine from '@/components/projects/shared/ActivityLine.vue'
import { useProjectHealthConfig } from '@/composables/useProjectHealthConfig'
import { calculateProjectHealth } from '@/utils/projectHealth'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'
import { KANBAN_COLUMNS, TASK_STATUS_LABELS, isTaskOverdue, isProjectOverdue, completedOnCalendarDay } from '@/utils/projectStats'
import type { ProjectDetailTab } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const WIDGETS_KEY = 'ql-dashboard-widgets'

type WidgetId =
  | 'kpis'
  | 'chart'
  | 'workload'
  | 'shortcuts'
  | 'upcoming'
  | 'budget'
  | 'files'
  | 'activity'

const defaultWidgets: Record<WidgetId, boolean> = {
  kpis: true,
  chart: true,
  workload: true,
  shortcuts: true,
  upcoming: true,
  budget: true,
  files: true,
  activity: true,
}

const projectsStore = useProjectsStore()
const auth = useAuthStore()
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
watch(widgets, (v) => localStorage.setItem(`${WIDGETS_KEY}-${props.projectId}`, JSON.stringify(v)), { deep: true })

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const dashboard = computed(() => projectsStore.getProjectDashboard(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const teamCount = computed(() => projectsStore.getProjectMembers(props.projectId).length)
const deliverableCount = computed(() => projectsStore.getProjectDeliverables(props.projectId).length)
const openRisks = computed(() => projectsStore.getProjectRisks(props.projectId).filter((r) => r.status === 'open').length)
const completedMilestones = computed(() => milestones.value.filter((m) => m.completed).length)
const MAX_RECENT_FILES = 4

const recentFiles = computed(() =>
  projectsStore.getProjectFiles(props.projectId).slice(0, MAX_RECENT_FILES),
)
const overdueTasks = computed(() => tasks.value.filter((t) => isTaskOverdue(t)).length)
const blockedTasks = computed(() => tasks.value.filter((t) => t.status === 'blocked').length)
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
    openRisks: openRisks.value,
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

const statusBars = computed(() =>
  donutSegments.value.map((s) => ({ label: s.label, value: s.value, color: s.color })),
)

const progressChart = computed(() => {
  return lastCalendarDays(7).map(({ key, label }) => ({
    label,
    value: tasks.value.filter((t) => completedOnCalendarDay(t.completedAt, key)).length,
  }))
})

const progressChartMax = computed(() =>
  Math.max(...progressChart.value.map((p) => p.value), 1),
)

const healthCircumference = 2 * Math.PI * 38

const teamWorkload = computed(() => {
  const map = new Map<string, number>()
  for (const t of tasks.value) {
    if (t.status === 'done') continue
    const ids = t.assigneeIds.length ? t.assigneeIds : ['__unassigned__']
    for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
})

const maxWorkload = computed(() => Math.max(...teamWorkload.value.map((w) => w.count), 1))

const priorityTasks = computed(() =>
  [...tasks.value]
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const p = { alta: 0, media: 1, baja: 2 }
      return p[a.priority] - p[b.priority]
    })
    .slice(0, 5),
)

const milestoneProgress = computed(() =>
  milestones.value.length ? Math.round((completedMilestones.value / milestones.value.length) * 100) : 0,
)

const remainingDaysLabel = computed(() => {
  if (!project.value?.dueDate) return null
  return formatRemainingDaysLabel(project.value.dueDate, {
    completed: project.value.status === 'completed',
    cancelled: project.value.status === 'cancelled',
  })
})

const timeElapsedPercent = computed(() => {
  if (!project.value) return null
  return calendarTimeElapsedPercent(project.value.startDate, project.value.dueDate)
})

function userName(id: string) {
  return resolveUser(id)?.name ?? 'Usuario'
}

function goToTab(tab: ProjectDetailTab) {
  router.replace({ path: route.path, query: { tab } })
}

const widgetOptions = computed(() => {
  const options: { id: WidgetId; label: string }[] = [
    { id: 'kpis', label: 'Métricas principales' },
    { id: 'chart', label: 'Gráficos' },
    { id: 'workload', label: 'Carga del equipo' },
    { id: 'shortcuts', label: 'Accesos rápidos' },
    { id: 'upcoming', label: 'Próximos vencimientos' },
    { id: 'budget', label: 'Presupuesto' },
    { id: 'files', label: 'Archivos recientes' },
    { id: 'activity', label: 'Actividad reciente' },
  ]
  return financeEnabled.value ? options : options.filter((o) => o.id !== 'budget')
})
</script>

<template>
  <div v-if="project" class="dash">
    <!-- Hero -->
    <div class="dash-hero">
      <div class="dash-hero__content">
        <p class="dash-hero__eyebrow">Panel del proyecto</p>
        <h2 class="dash-hero__title">{{ project.name }}</h2>
        <div class="dash-hero__meta">
          <ProjectStatusBadge :status="project.status" />
          <span v-if="project.startDate && project.dueDate" class="dash-hero__dates">
            <Calendar :size="14" />
            {{ formatDate(project.startDate) }} — {{ formatDate(project.dueDate) }}
          </span>
          <span v-if="remainingDaysLabel" class="dash-hero__dates" :class="isProjectOverdue(project) ? 'text-[#f4845f]' : ''">
            <Clock :size="14" />
            {{ remainingDaysLabel }}
            <template v-if="timeElapsedPercent != null"> · {{ timeElapsedPercent }}% del plazo</template>
          </span>
        </div>
      </div>
      <div class="dash-hero__health">
        <div class="dash-health-ring">
          <svg viewBox="0 0 88 88">
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
        <p class="dash-hero__health-caption">Salud del proyecto</p>
        <p v-if="health.breakdown.length" class="dash-hero__health-caption mt-1 text-[0.6875rem] opacity-80" :title="health.breakdown.map((b) => `${b.detail} (${b.impact >= 0 ? '+' : ''}${b.impact})`).join('\n')">
          Según {{ health.breakdown.length }} factor{{ health.breakdown.length === 1 ? '' : 'es' }} activo{{ health.breakdown.length === 1 ? '' : 's' }}
        </p>
      </div>
      <button type="button" class="dash-hero__settings" @click="showWidgetPanel = !showWidgetPanel">
        <Settings2 :size="18" />
      </button>
    </div>

    <div v-if="showWidgetPanel" class="project-card project-card--lg">
      <p class="mb-3 text-sm font-medium text-[#172b4d]">Mostrar en el dashboard</p>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
    <div v-if="widgets.kpis" class="dash-kpis">
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--blue"><TrendingUp :size="20" /></div>
        <div>
          <p class="dash-kpi__value">{{ dashboard.progress }}%</p>
          <p class="dash-kpi__label">Avance</p>
          <div class="dash-kpi__bar"><div :style="{ width: `${dashboard.progress}%` }" /></div>
        </div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--green"><CheckCircle2 :size="20" /></div>
        <div>
          <p class="dash-kpi__value">{{ dashboard.completed }}</p>
          <p class="dash-kpi__label">Completadas</p>
        </div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--amber"><Clock :size="20" /></div>
        <div>
          <p class="dash-kpi__value">{{ dashboard.pending }}</p>
          <p class="dash-kpi__label">Pendientes</p>
        </div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--red"><AlertTriangle :size="20" /></div>
        <div>
          <p class="dash-kpi__value">{{ overdueTasks }}</p>
          <p class="dash-kpi__label">Vencidas</p>
        </div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--purple"><Flag :size="20" /></div>
        <div>
          <p class="dash-kpi__value">{{ milestoneProgress }}%</p>
          <p class="dash-kpi__label">Hitos ({{ completedMilestones }}/{{ milestones.length }})</p>
        </div>
      </div>
      <div v-if="financeEnabled" class="dash-kpi">
        <div class="dash-kpi__icon dash-kpi__icon--coral"><Wallet :size="20" /></div>
        <div>
          <p class="dash-kpi__value">
            {{ dashboard.finance ? `${dashboard.finance.usagePercent}%` : '—' }}
          </p>
          <p class="dash-kpi__label">Presupuesto usado</p>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div v-if="widgets.chart" class="grid gap-5 xl:grid-cols-3">
      <div class="dash-chart-card xl:col-span-2">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="dash-section-title">Velocidad de entrega</h3>
            <p class="dash-section-sub">Tareas completadas · últimos 7 días</p>
          </div>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver tareas</button>
        </div>
        <div class="dash-bars">
          <div v-for="point in progressChart" :key="point.label" class="dash-bars__col">
            <span class="dash-bars__value">{{ point.value }}</span>
            <div class="dash-bars__track">
              <div
                class="dash-bars__fill"
                :style="{ height: `${(point.value / progressChartMax) * 100}%` }"
              />
            </div>
            <span class="dash-bars__label">{{ point.label }}</span>
          </div>
        </div>
      </div>

      <div class="dash-chart-card">
        <h3 class="dash-section-title">Distribución por estado</h3>
        <p class="dash-section-sub mb-5">Tareas del proyecto</p>
        <ProjectDonutChart :segments="donutSegments" :size="148" />
      </div>
    </div>

    <div v-if="widgets.chart" class="dash-chart-card">
      <h3 class="dash-section-title">Desglose de estados</h3>
      <p class="dash-section-sub mb-4">Comparativa visual</p>
      <BarChart :items="statusBars" />
    </div>

    <!-- Workload + shortcuts -->
    <div class="grid gap-5 lg:grid-cols-3">
      <div v-if="widgets.workload" class="dash-chart-card lg:col-span-1">
        <h3 class="dash-section-title">Carga del equipo</h3>
        <p class="dash-section-sub mb-4">Tareas activas por persona</p>
        <ul v-if="teamWorkload.length" class="space-y-3">
          <li v-for="item in teamWorkload" :key="item.userId" class="flex items-center gap-3">
            <UserAvatar v-if="item.userId !== '__unassigned__'" :user-id="item.userId" size="sm" />
            <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebebed] text-[10px] font-bold text-[#626f86]">?</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[#172b4d]">
                {{ item.userId === '__unassigned__' ? 'Sin asignar' : userName(item.userId) }}
              </p>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-[#ebebed]">
                <div class="h-full rounded-full bg-[#f4845f]" :style="{ width: `${(item.count / maxWorkload) * 100}%` }" />
              </div>
            </div>
            <span class="text-sm font-semibold text-[#172b4d]">{{ item.count }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay tareas activas asignadas.</p>
      </div>

      <div v-if="widgets.shortcuts" class="lg:col-span-2">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="link in [
              { tab: 'milestones' as const, icon: Flag, label: 'Hitos', value: `${completedMilestones}/${milestones.length}`, color: '#6554c0' },
              { tab: 'risks' as const, icon: AlertTriangle, label: 'Riesgos abiertos', value: String(openRisks), color: '#f4845f' },
              { tab: 'tasks' as const, icon: ListTodo, label: 'Total tareas', value: String(dashboard.pending + dashboard.completed), color: '#5bbce4' },
              { tab: 'team' as const, icon: Users, label: 'Equipo', value: String(teamCount), color: '#2d7eb8' },
              { tab: 'deliverables' as const, icon: Package, label: 'Entregables', value: String(deliverableCount), color: '#10b981' },
              { tab: 'gantt' as const, icon: Target, label: 'Cronograma', value: String(tasks.filter(t => t.startDate || t.dueDate).length), color: '#f59e0b' },
            ]"
            :key="link.tab"
            type="button"
            class="dash-shortcut"
            @click="goToTab(link.tab)"
          >
            <div class="dash-shortcut__icon" :style="{ background: link.color + '18', color: link.color }">
              <component :is="link.icon" :size="20" />
            </div>
            <div class="min-w-0 flex-1 text-left">
              <p class="dash-shortcut__value">{{ link.value }}</p>
              <p class="dash-shortcut__label">{{ link.label }}</p>
            </div>
            <ArrowRight :size="16" class="text-[#c7c7cc]" />
          </button>
        </div>
      </div>
    </div>

    <!-- Upcoming + Budget -->
    <div class="grid gap-5 lg:grid-cols-2">
      <div v-if="widgets.upcoming" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Zap :size="18" class="text-[#f4845f]" />
            Tareas prioritarias
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver todas</button>
        </div>
        <ul v-if="priorityTasks.length" class="space-y-2">
          <li
            v-for="task in priorityTasks"
            :key="task.id"
            class="flex items-center justify-between rounded-xl border border-[#091e4214] bg-[#fafafa] px-4 py-3"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-[#172b4d]">{{ task.title }}</p>
              <p class="text-xs text-[#626f86] capitalize">{{ task.priority }} prioridad</p>
            </div>
            <span
              class="shrink-0 text-sm"
              :class="isTaskOverdue(task) ? 'font-semibold text-[#f4845f]' : 'text-[#626f86]'"
            >
              {{ formatDate(task.dueDate) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay tareas pendientes.</p>
      </div>

      <div v-if="widgets.budget && financeEnabled" class="dash-chart-card">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="dash-section-title flex items-center gap-2">
            <Wallet :size="18" class="text-[#f4845f]" />
            Presupuesto
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('finance')">Ver finanzas</button>
        </div>
        <BudgetProgressBar
          v-if="dashboard.finance"
          :percent="dashboard.finance.usagePercent"
          :spent="dashboard.finance.spent"
          :budget="dashboard.finance.budget"
          :currency="currency"
        />
        <div v-if="dashboard.finance" class="mt-4 grid grid-cols-3 gap-3 text-center">
          <div class="rounded-lg bg-[#fafafa] px-3 py-2">
            <p class="text-sm font-bold text-[#172b4d]">{{ formatMoney(dashboard.finance.budget, currency) }}</p>
            <p class="text-xs text-[#626f86]">Presupuesto</p>
          </div>
          <div class="rounded-lg bg-[#fafafa] px-3 py-2">
            <p class="text-sm font-bold text-[#f4845f]">{{ formatMoney(dashboard.finance.spent, currency) }}</p>
            <p class="text-xs text-[#626f86]">Gastado</p>
          </div>
          <div class="rounded-lg bg-[#fafafa] px-3 py-2">
            <p class="text-sm font-bold text-[#10b981]">{{ formatMoney(dashboard.finance.balance, currency) }}</p>
            <p class="text-xs text-[#626f86]">Saldo</p>
          </div>
        </div>
        <p v-else class="text-sm text-[#626f86]">Sin presupuesto configurado.</p>
      </div>
    </div>

    <!-- Files + Activity -->
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
          <Paperclip :size="28" class="text-[#f4845f]" />
          <p class="drive-file-card__name">{{ file.name }}</p>
          <p class="drive-file-card__meta">{{ file.source }} · <RelativeTime :iso="file.uploadedAt" /></p>
        </div>
      </div>
      <p v-else class="text-sm text-[#626f86]">Aún no hay archivos en este proyecto.</p>
    </div>

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
          class="flex gap-4 py-3.5 text-sm first:pt-0 last:pb-0"
        >
          <RelativeTime :iso="act.createdAt" class="w-28 shrink-0 text-xs text-[#626f86]" />
          <div class="min-w-0 flex-1">
            <ActivityLine :activity="act" :user-name="userName(act.userId)" class="text-sm" />
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-[#626f86]">Sin actividad registrada.</p>
    </div>
  </div>
</template>
