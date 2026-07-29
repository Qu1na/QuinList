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
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import BudgetProgressBar from '@/components/projects/shared/BudgetProgressBar.vue'
import ProjectDonutChart from '@/components/projects/shared/ProjectDonutChart.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/permissions'
import { KANBAN_COLUMNS, TASK_STATUS_LABELS } from '@/utils/projectStats'
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
const router = useRouter()
const route = useRoute()

const showWidgetPanel = ref(false)
const widgets = ref<Record<WidgetId, boolean>>({ ...defaultWidgets })

function loadWidgets() {
  try {
    const raw = localStorage.getItem(`${WIDGETS_KEY}-${props.projectId}`)
    if (raw) widgets.value = { ...defaultWidgets, ...JSON.parse(raw) }
  } catch {
    widgets.value = { ...defaultWidgets }
  }
}

watch(
  () => props.projectId,
  () => loadWidgets(),
  { immediate: true },
)

watch(
  widgets,
  (v) => {
    localStorage.setItem(`${WIDGETS_KEY}-${props.projectId}`, JSON.stringify(v))
  },
  { deep: true },
)

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const dashboard = computed(() => projectsStore.getProjectDashboard(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const teamCount = computed(() => projectsStore.getProjectMembers(props.projectId).length)
const deliverableCount = computed(() => projectsStore.getProjectDeliverables(props.projectId).length)
const openRisks = computed(() =>
  projectsStore.getProjectRisks(props.projectId).filter((r) => r.status === 'open').length,
)
const completedMilestones = computed(() => milestones.value.filter((m) => m.completed).length)
const recentFiles = computed(() => projectsStore.getProjectFiles(props.projectId).slice(0, 4))

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

const progressChart = computed(() => {
  const days = 7
  const points = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('es', { weekday: 'short' })
    const value = tasks.value.filter((t) => t.completedAt?.slice(0, 10) === key).length
    points.push({ label, value })
  }
  return points
})

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

function userName(id: string) {
  return auth.getUserById(id)?.name ?? 'Usuario'
}

function goToTab(tab: ProjectDetailTab) {
  router.replace({ path: route.path, query: { tab } })
}

const widgetOptions: { id: WidgetId; label: string }[] = [
  { id: 'kpis', label: 'Métricas principales' },
  { id: 'chart', label: 'Gráfico de progreso' },
  { id: 'workload', label: 'Carga del equipo' },
  { id: 'shortcuts', label: 'Accesos rápidos' },
  { id: 'upcoming', label: 'Próximos vencimientos' },
  { id: 'budget', label: 'Presupuesto' },
  { id: 'files', label: 'Archivos recientes' },
  { id: 'activity', label: 'Actividad reciente' },
]
</script>

<template>
  <div v-if="project" class="space-y-7">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Panel del proyecto</h2>
        <p class="project-page-sub">
          Vista general de {{ project.name }} ·
          <ProjectStatusBadge :status="project.status" />
        </p>
      </div>
      <button type="button" class="ql-btn ql-btn--ghost" @click="showWidgetPanel = !showWidgetPanel">
        <Settings2 :size="18" />
        Personalizar
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

    <div v-if="widgets.kpis" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="project-card project-kpi">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded-xl bg-[#5bbce4]/15 p-2.5 text-[#2d7eb8]">
            <TrendingUp :size="22" />
          </div>
          <p class="project-kpi__label">Avance del proyecto</p>
        </div>
        <p class="project-kpi__value">{{ dashboard.progress }}%</p>
        <p class="mt-1 text-sm text-[#626f86]">
          {{ dashboard.completed }} de {{ dashboard.completed + dashboard.pending }} tareas
        </p>
        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebebed]">
          <div class="h-full rounded-full bg-[#5bbce4]" :style="{ width: `${dashboard.progress}%` }" />
        </div>
      </div>

      <div class="project-card project-kpi">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded-xl bg-[#f4845f]/15 p-2.5 text-[#f4845f]">
            <CheckCircle2 :size="22" />
          </div>
          <p class="project-kpi__label">Completadas</p>
        </div>
        <p class="project-kpi__value">{{ dashboard.completed }}</p>
        <p class="mt-1 text-sm text-[#626f86]">tareas finalizadas</p>
      </div>

      <div class="project-card project-kpi">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded-xl bg-[#5bbce4]/15 p-2.5 text-[#2d7eb8]">
            <Clock :size="22" />
          </div>
          <p class="project-kpi__label">Pendientes</p>
        </div>
        <p class="project-kpi__value">{{ dashboard.pending }}</p>
        <p class="mt-1 text-sm text-[#626f86]">por completar</p>
      </div>

      <div class="project-card project-kpi">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded-xl bg-[#091e420f] p-2.5 text-[#172b4d]">
            <Wallet :size="22" />
          </div>
          <p class="project-kpi__label">Presupuesto usado</p>
        </div>
        <p class="project-kpi__value">
          {{ dashboard.finance ? `${dashboard.finance.usagePercent}%` : '—' }}
        </p>
        <p class="mt-1 text-sm text-[#626f86]">
          {{ dashboard.finance ? formatMoney(dashboard.finance.spent, currency) : 'Sin datos' }}
        </p>
      </div>
    </div>

    <div v-if="widgets.chart || widgets.workload" class="grid gap-5 xl:grid-cols-3">
      <div v-if="widgets.chart" class="project-card project-card--lg xl:col-span-2">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-[#172b4d]">Tareas completadas</h3>
            <p class="text-sm text-[#626f86]">Últimos 7 días vs. planificado</p>
          </div>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver tareas</button>
        </div>
        <LineChart :points="progressChart" :height="180" />
      </div>

      <div v-if="widgets.workload" class="project-card project-card--lg">
        <h3 class="mb-1 text-base font-semibold text-[#172b4d]">Carga del equipo</h3>
        <p class="mb-4 text-sm text-[#626f86]">Tareas activas por persona</p>
        <ul v-if="teamWorkload.length" class="space-y-3">
          <li v-for="item in teamWorkload" :key="item.userId" class="flex items-center gap-3">
            <UserAvatar v-if="item.userId !== '__unassigned__'" :user-id="item.userId" size="sm" />
            <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebebed] text-[10px] font-bold text-[#626f86]">?</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-[#172b4d]">
                {{ item.userId === '__unassigned__' ? 'Sin asignar' : userName(item.userId) }}
              </p>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-[#ebebed]">
                <div
                  class="h-full rounded-full bg-[#f4845f]"
                  :style="{ width: `${(item.count / maxWorkload) * 100}%` }"
                />
              </div>
            </div>
            <span class="text-sm font-semibold text-[#172b4d]">{{ item.count }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay tareas activas asignadas.</p>
        <button type="button" class="project-link-btn mt-4" @click="goToTab('team')">Ver equipo</button>
      </div>
    </div>

    <div v-if="widgets.chart" class="project-card project-card--lg">
      <h3 class="mb-4 text-base font-semibold text-[#172b4d]">Distribución por estado</h3>
      <ProjectDonutChart :segments="donutSegments" />
    </div>

    <div v-if="widgets.shortcuts" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <button
        v-for="link in [
          { tab: 'milestones' as const, icon: Flag, label: 'Hitos', value: `${completedMilestones}/${milestones.length}` },
          { tab: 'risks' as const, icon: AlertTriangle, label: 'Riesgos abiertos', value: String(openRisks) },
          { tab: 'tasks' as const, icon: ListTodo, label: 'Total tareas', value: String(dashboard.pending + dashboard.completed) },
          { tab: 'team' as const, icon: Users, label: 'Equipo', value: String(teamCount) },
          { tab: 'deliverables' as const, icon: Package, label: 'Entregables', value: String(deliverableCount) },
        ]"
        :key="link.tab"
        type="button"
        class="project-stat-btn"
        @click="goToTab(link.tab)"
      >
        <div class="flex items-center gap-3">
          <component :is="link.icon" :size="20" class="text-[#f4845f]" />
          <div>
            <p class="text-xl font-bold text-[#172b4d]">{{ link.value }}</p>
            <p class="text-sm text-[#626f86]">{{ link.label }}</p>
          </div>
        </div>
        <ArrowRight :size="16" class="text-[#c7c7cc]" />
      </button>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <div v-if="widgets.upcoming" class="project-card project-card--lg">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <Calendar :size="20" class="text-[#5bbce4]" />
            Tareas prioritarias
          </h3>
          <button type="button" class="project-link-btn" @click="goToTab('tasks')">Ver todas</button>
        </div>
        <ul v-if="priorityTasks.length" class="space-y-2">
          <li
            v-for="task in priorityTasks"
            :key="task.id"
            class="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-3"
          >
            <span class="font-medium text-[#172b4d]">{{ task.title }}</span>
            <span class="text-sm text-[#626f86]">{{ formatDate(task.dueDate) }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay tareas pendientes.</p>
      </div>

      <div v-if="widgets.budget" class="project-card project-card--lg">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <Wallet :size="20" class="text-[#f4845f]" />
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
        <p v-else class="text-sm text-[#626f86]">Sin presupuesto configurado.</p>
      </div>
    </div>

    <div v-if="widgets.files" class="project-card project-card--lg">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <FolderOpen :size="20" class="text-[#5bbce4]" />
          Archivos recientes
        </h3>
        <button type="button" class="project-link-btn" @click="goToTab('files')">Abrir Drive</button>
      </div>
      <div v-if="recentFiles.length" class="drive-grid">
        <div v-for="file in recentFiles" :key="file.id" class="drive-file-card">
          <Paperclip :size="28" class="text-[#f4845f]" />
          <p class="drive-file-card__name">{{ file.name }}</p>
          <p class="drive-file-card__meta">{{ file.source }} · {{ formatDateTime(file.uploadedAt) }}</p>
        </div>
      </div>
      <p v-else class="text-sm text-[#626f86]">Aún no hay archivos en este proyecto.</p>
    </div>

    <div v-if="widgets.activity" class="project-card project-card--lg">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-base font-semibold text-[#172b4d]">
          <Activity :size="20" class="text-[#5bbce4]" />
          Actividad reciente
        </h3>
        <button type="button" class="project-link-btn" @click="goToTab('activity')">Ver todo</button>
      </div>
      <ul v-if="dashboard.recentActivity.length" class="divide-y divide-[#ebebed]">
        <li
          v-for="act in dashboard.recentActivity"
          :key="act.id"
          class="flex gap-4 py-4 text-sm first:pt-0 last:pb-0"
        >
          <span class="w-32 shrink-0 text-sm text-[#626f86]">{{ formatDateTime(act.createdAt) }}</span>
          <div>
            <span class="font-medium text-[#172b4d]">{{ userName(act.userId) }}</span>
            <span class="text-[#626f86]"> — {{ act.action }}: {{ act.details }}</span>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-[#626f86]">Sin actividad registrada.</p>
    </div>
  </div>
</template>
