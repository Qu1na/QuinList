<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Info,
  ListTodo,
  GanttChart,
  DollarSign,
  Flag,
  Users,
  Package,
  AlertTriangle,
  FileText,
  FolderOpen,
  History,
  BarChart3,
  Settings,
  ArrowLeft,
  Calendar,
  User,
} from '@lucide/vue'
import type { ProjectDetailTab } from '@/types/projects'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectStatusBadge from './shared/ProjectStatusBadge.vue'
import PriorityBadge from './shared/PriorityBadge.vue'
import ProjectProgressRing from './shared/ProjectProgressRing.vue'
import { calcProjectProgress, daysUntil, isProjectOverdue } from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'

const props = defineProps<{
  projectId: string
}>()

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const auth = useAuthStore()

const project = computed(() => projectsStore.getProject(props.projectId))
const progress = computed(() =>
  calcProjectProgress(projectsStore.getProjectTasks(props.projectId)),
)
const responsible = computed(() =>
  project.value?.responsibleId ? auth.getUserById(project.value.responsibleId) : null,
)
const daysLeft = computed(() => (project.value ? daysUntil(project.value.dueDate) : null))
const overdue = computed(() => (project.value ? isProjectOverdue(project.value) : false))

const tabGroups: { label: string; tabs: { id: ProjectDetailTab; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'General',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'info', label: 'Información', icon: Info },
    ],
  },
  {
    label: 'Gestión',
    tabs: [
      { id: 'tasks', label: 'Tareas', icon: ListTodo },
      { id: 'gantt', label: 'Cronograma', icon: GanttChart },
      { id: 'milestones', label: 'Hitos', icon: Flag },
      { id: 'deliverables', label: 'Entregables', icon: Package },
    ],
  },
  {
    label: 'Recursos',
    tabs: [
      { id: 'finance', label: 'Finanzas', icon: DollarSign },
      { id: 'team', label: 'Equipo', icon: Users },
      { id: 'risks', label: 'Riesgos', icon: AlertTriangle },
      { id: 'documents', label: 'Documentación', icon: FileText },
      { id: 'files', label: 'Archivos', icon: FolderOpen },
    ],
  },
  {
    label: 'Análisis',
    tabs: [
      { id: 'activity', label: 'Actividad', icon: History },
      { id: 'reports', label: 'Reportes', icon: BarChart3 },
      { id: 'settings', label: 'Configuración', icon: Settings },
    ],
  },
]

const allTabs = computed(() => tabGroups.flatMap((g) => g.tabs))
const activeTab = computed(() => (route.query.tab as ProjectDetailTab) || 'dashboard')
const heroCollapsed = ref(false)

function setTab(tab: ProjectDetailTab) {
  router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <div v-if="project" class="flex h-full min-h-0 flex-col">
    <!-- Sub-header fijo del proyecto -->
    <div class="shrink-0 border-b border-[#091e4214] bg-white">
      <div class="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <button
          class="mb-2 flex items-center gap-1.5 text-xs text-[#626f86] hover:text-[#172b4d]"
          @click="router.push('/projects')"
        >
          <ArrowLeft :size="14" />
          Proyectos
        </button>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="truncate text-xl font-semibold text-[#172b4d]">{{ project.name }}</h1>
              <ProjectStatusBadge :status="project.status" />
              <PriorityBadge :priority="project.priority" />
              <span
                v-if="overdue"
                class="rounded-full bg-[#091e420f] px-2 py-0.5 text-xs font-medium text-[#44546f]"
              >
                Vencido
              </span>
            </div>
            <div v-if="!heroCollapsed" class="mt-1.5 flex flex-wrap gap-3 text-xs text-[#626f86]">
              <span v-if="project.client" class="flex items-center gap-1">
                <User :size="12" />
                {{ project.client }}
              </span>
              <span v-if="responsible">Responsable: {{ responsible.name }}</span>
              <span v-if="project.startDate || project.dueDate" class="flex items-center gap-1">
                <Calendar :size="12" />
                {{ formatDate(project.startDate) }} — {{ formatDate(project.dueDate) }}
                <span v-if="daysLeft != null && !overdue && daysLeft <= 14">({{ daysLeft }}d)</span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <ProjectProgressRing :percent="progress" :size="52" :stroke="5" />
            <button
              class="hidden text-xs text-[#626f86] hover:text-[#172b4d] md:block"
              @click="heroCollapsed = !heroCollapsed"
            >
              {{ heroCollapsed ? 'Más info' : 'Menos' }}
            </button>
          </div>
        </div>

        <!-- Tabs móvil -->
        <nav class="mt-3 flex gap-1 overflow-x-auto border-t border-[#091e4214] pt-2 md:hidden">
          <button
            v-for="tab in allTabs"
            :key="tab.id"
            class="shrink-0 rounded-md px-2.5 py-1.5 text-xs transition-colors"
            :class="
              activeTab === tab.id
                ? 'bg-[#091e420f] font-medium text-[#172b4d]'
                : 'text-[#626f86]'
            "
            @click="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Cuerpo con scroll -->
    <div class="flex min-h-0 flex-1">
      <aside class="hidden w-52 shrink-0 overflow-y-auto border-r border-[#091e4214] bg-[#f9fafc] md:block">
        <nav v-for="group in tabGroups" :key="group.label" class="px-2 py-3">
          <p class="mb-1 px-2 text-[10px] font-semibold tracking-wide text-[#626f86] uppercase">
            {{ group.label }}
          </p>
          <div class="space-y-0.5">
            <button
              v-for="tab in group.tabs"
              :key="tab.id"
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
              :class="
                activeTab === tab.id
                  ? 'bg-white font-medium text-[#172b4d] shadow-sm'
                  : 'text-[#44546f] hover:bg-white/60'
              "
              @click="setTab(tab.id)"
            >
              <component :is="tab.icon" :size="15" />
              {{ tab.label }}
            </button>
          </div>
        </nav>
      </aside>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <slot />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="mx-auto max-w-6xl px-6 py-12 text-center">
    <p class="text-[#626f86]">Proyecto no encontrado.</p>
    <button class="mt-4 text-sm text-[#0c66e4] hover:underline" @click="router.push('/projects')">
      Volver a proyectos
    </button>
  </div>
</template>
