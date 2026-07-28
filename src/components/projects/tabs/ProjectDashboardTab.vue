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
} from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import BudgetProgressBar from '@/components/projects/shared/BudgetProgressBar.vue'
import { DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/permissions'
import type { ProjectDetailTab } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const project = computed(() => projectsStore.getProject(props.projectId))
const currency = computed(() => project.value?.currency ?? DEFAULT_CURRENCY)
const dashboard = computed(() => projectsStore.getProjectDashboard(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const teamCount = computed(() => projectsStore.getProjectMembers(props.projectId).length)
const deliverableCount = computed(() => projectsStore.getProjectDeliverables(props.projectId).length)
const openRisks = computed(() =>
  projectsStore.getProjectRisks(props.projectId).filter((r) => r.status === 'open').length,
)
const completedMilestones = computed(() => milestones.value.filter((m) => m.completed).length)

function userName(id: string) {
  return auth.getUserById(id)?.name ?? 'Usuario'
}

function goToTab(tab: ProjectDetailTab) {
  router.replace({ path: route.path, query: { tab } })
}

const kpis = computed(() => [
  {
    icon: TrendingUp,
    label: 'Avance del proyecto',
    value: `${dashboard.value.progress}%`,
    sub: `${dashboard.value.completed} de ${dashboard.value.completed + dashboard.value.pending} tareas`,
    color: 'text-[#0c66e4]',
    bg: 'bg-[#0c66e4]/8',
  },
  {
    icon: CheckCircle2,
    label: 'Completadas',
    value: String(dashboard.value.completed),
    sub: 'tareas finalizadas',
    color: 'text-[#172b4d]',
    bg: 'bg-[#091e420f]',
  },
  {
    icon: Clock,
    label: 'Pendientes',
    value: String(dashboard.value.pending),
    sub: 'por completar',
    color: 'text-[#172b4d]',
    bg: 'bg-[#091e420f]',
  },
  {
    icon: Wallet,
    label: 'Presupuesto usado',
    value: dashboard.value.finance ? `${dashboard.value.finance.usagePercent}%` : '—',
    sub: dashboard.value.finance
      ? formatMoney(dashboard.value.finance.spent, currency.value)
      : 'Sin datos',
    color: 'text-[#172b4d]',
    bg: 'bg-[#091e420f]',
  },
])
</script>

<template>
  <div v-if="project" class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-xl border border-[#091e4214] bg-white p-4"
      >
        <div class="mb-3 flex items-center gap-2">
          <div class="rounded-lg p-2" :class="kpi.bg">
            <component :is="kpi.icon" :size="18" :class="kpi.color" />
          </div>
          <p class="text-xs font-medium text-[#626f86]">{{ kpi.label }}</p>
        </div>
        <p class="text-2xl font-bold text-[#172b4d]">{{ kpi.value }}</p>
        <p class="mt-0.5 text-xs text-[#626f86]">{{ kpi.sub }}</p>
        <div v-if="kpi.label === 'Avance del proyecto'" class="mt-2 h-1 overflow-hidden rounded-full bg-[#091e4214]">
          <div class="h-full rounded-full bg-[#0c66e4]" :style="{ width: `${dashboard.progress}%` }" />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ProjectStatusBadge :status="project.status" />
      <span class="text-xs text-[#626f86]">Estado actual del proyecto</span>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <button
        v-for="link in [
          { tab: 'milestones' as const, icon: Flag, label: 'Hitos', value: `${completedMilestones}/${milestones.length}` },
          { tab: 'risks' as const, icon: AlertTriangle, label: 'Riesgos abiertos', value: String(openRisks) },
          { tab: 'tasks' as const, icon: ListTodo, label: 'Total tareas', value: String(dashboard.pending + dashboard.completed) },
          { tab: 'team' as const, icon: Users, label: 'Equipo', value: String(teamCount) },
          { tab: 'deliverables' as const, icon: Package, label: 'Entregables', value: String(deliverableCount) },
        ]"
        :key="link.tab"
        class="flex items-center justify-between rounded-xl border border-[#091e4214] bg-white p-3 text-left transition-colors hover:bg-[#091e420a]"
        @click="goToTab(link.tab)"
      >
        <div class="flex items-center gap-2">
          <component :is="link.icon" :size="16" class="text-[#0c66e4]" />
          <div>
            <p class="text-lg font-bold text-[#172b4d]">{{ link.value }}</p>
            <p class="text-[10px] text-[#626f86]">{{ link.label }}</p>
          </div>
        </div>
        <ArrowRight :size="14" class="text-[#626f86]" />
      </button>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 font-semibold text-[#172b4d]">
            <Calendar :size="18" class="text-[#0c66e4]" />
            Próximos vencimientos
          </h3>
          <button class="text-xs text-[#0c66e4] hover:underline" @click="goToTab('tasks')">Ver tareas</button>
        </div>
        <ul v-if="dashboard.upcoming.length" class="space-y-2">
          <li
            v-for="task in dashboard.upcoming"
            :key="task.id"
            class="flex items-center justify-between rounded-lg bg-[#091e420a] px-3 py-2 text-sm"
          >
            <span class="text-[#172b4d]">{{ task.title }}</span>
            <span class="text-xs text-[#626f86]">{{ formatDate(task.dueDate) }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#626f86]">No hay vencimientos próximos.</p>
      </div>

      <div class="rounded-xl border border-[#091e4214] bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 font-semibold text-[#172b4d]">
            <Wallet :size="18" class="text-[#0c66e4]" />
            Presupuesto
          </h3>
          <button class="text-xs text-[#0c66e4] hover:underline" @click="goToTab('finance')">Ver finanzas</button>
        </div>
        <BudgetProgressBar
          v-if="dashboard.finance"
          :percent="dashboard.finance.usagePercent"
          :spent="dashboard.finance.spent"
          :budget="dashboard.finance.budget"
          :currency="currency"
        />
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 font-semibold text-[#172b4d]">
          <Activity :size="18" class="text-[#0c66e4]" />
          Actividad reciente
          <span class="text-xs font-normal text-[#626f86]">(últimos 7)</span>
        </h3>
        <button class="text-xs text-[#0c66e4] hover:underline" @click="goToTab('activity')">Ver todo</button>
      </div>
      <ul v-if="dashboard.recentActivity.length" class="divide-y divide-[#091e4214]">
        <li
          v-for="act in dashboard.recentActivity"
          :key="act.id"
          class="flex gap-3 py-3 text-sm first:pt-0 last:pb-0"
        >
          <span class="w-28 shrink-0 text-xs text-[#626f86]">{{ formatDateTime(act.createdAt) }}</span>
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
