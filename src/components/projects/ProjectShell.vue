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
  ChevronRight,
  Menu,
  X,
} from '@lucide/vue'
import type { ProjectDetailTab } from '@/types/projects'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectStatusBadge from './shared/ProjectStatusBadge.vue'
import ProjectProgressRing from './shared/ProjectProgressRing.vue'
import UserAvatar from './shared/UserAvatar.vue'
import { calcProjectProgress } from '@/utils/projectStats'

const props = defineProps<{
  projectId: string
}>()

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const auth = useAuthStore()

const mobileNavOpen = ref(false)

const project = computed(() => projectsStore.getProject(props.projectId))
const progress = computed(() =>
  calcProjectProgress(projectsStore.getProjectTasks(props.projectId)),
)
const userId = computed(() => auth.currentUser?.id ?? '')

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

const activeTab = computed(() => (route.query.tab as ProjectDetailTab) || 'dashboard')
const activeTabLabel = computed(
  () => tabGroups.flatMap((g) => g.tabs).find((t) => t.id === activeTab.value)?.label ?? 'Dashboard',
)

function setTab(tab: ProjectDetailTab) {
  mobileNavOpen.value = false
  router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <div v-if="project" class="project-detail flex h-full min-h-0 flex-col overflow-hidden">
    <header class="project-chrome project-chrome--light">
      <div class="project-chrome__bar">
        <button
          type="button"
          class="project-chrome__menu-btn md:hidden"
          aria-label="Menú"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          <Menu v-if="!mobileNavOpen" :size="20" />
          <X v-else :size="20" />
        </button>

        <nav class="project-breadcrumb hidden items-center gap-1.5 text-sm md:flex">
          <button type="button" class="project-breadcrumb__link" @click="router.push('/app/projects')">
            Proyectos
          </button>
          <ChevronRight :size="14" class="text-[#c7c7cc]" />
          <span class="font-medium text-[#172b4d]">{{ project.name }}</span>
        </nav>

        <h1 class="project-chrome__title md:hidden">{{ project.name }}</h1>

        <div class="project-chrome__actions">
          <ProjectStatusBadge :status="project.status" />
          <ProjectProgressRing :percent="progress" :size="44" :stroke="4" />
          <button type="button" class="shrink-0" title="Ir al inicio" @click="router.push('/app')">
            <UserAvatar v-if="userId" :user-id="userId" size="md" />
          </button>
        </div>
      </div>

      <div
        v-if="activeTab !== 'tasks'"
        class="project-chrome__sub hidden border-t border-[#0000000a] px-6 py-2 md:block"
      >
        <p class="text-sm text-[#626f86]">
          Sección actual: <span class="font-medium text-[#172b4d]">{{ activeTabLabel }}</span>
        </p>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <div
        v-if="mobileNavOpen"
        class="fixed inset-0 z-40 bg-black/30 md:hidden"
        @click="mobileNavOpen = false"
      />

      <aside
        class="project-sidebar"
        :class="{ 'project-sidebar--open': mobileNavOpen }"
      >
        <nav class="project-sidebar__nav scroll-thin">
          <div v-for="group in tabGroups" :key="group.label" class="mb-4">
            <p class="project-sidebar__group-label">{{ group.label }}</p>
            <div class="space-y-1">
              <button
                v-for="tab in group.tabs"
                :key="tab.id"
                type="button"
                class="project-nav-item"
                :class="{ 'project-nav-item--active': activeTab === tab.id }"
                @click="setTab(tab.id)"
              >
                <component :is="tab.icon" :size="18" />
                {{ tab.label }}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <div
        class="project-content scroll-thin"
        :class="{ 'project-content--board': activeTab === 'tasks' }"
      >
        <div
          class="project-content__inner"
          :class="{ 'project-content__inner--board': activeTab === 'tasks' }"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex h-full items-center justify-center px-6">
    <div class="text-center">
      <p class="text-base text-[#626f86]">Proyecto no encontrado.</p>
      <button type="button" class="ql-btn ql-btn--ghost mt-4" @click="router.push('/app/projects')">
        Volver a proyectos
      </button>
    </div>
  </div>
</template>
