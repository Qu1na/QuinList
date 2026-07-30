<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Info,
  ListTodo,
  GanttChart,
  DollarSign,
  Flag,
  StickyNote,
  Users,
  Package,
  AlertTriangle,
  FileText,
  FolderOpen,
  History,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronRight,
  Menu,
  X,
} from '@lucide/vue'
import type { ProjectDetailTab } from '@/types/projects'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useProjectAccess } from '@/utils/projectAccess'
import ProjectStatusBadge from './shared/ProjectStatusBadge.vue'
import ProjectProgressRing from './shared/ProjectProgressRing.vue'
import UserAvatar from './shared/UserAvatar.vue'
import { calcProjectProgress } from '@/utils/projectStats'
import { isProjectFinanceEnabled } from '@/utils/projectFinance'
import { provideProjectUsers } from '@/composables/useProjectUsers'
import { useProjectChatStore } from '@/stores/projectChat'

const props = defineProps<{
  projectId: string
}>()

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const auth = useAuthStore()
const access = useProjectAccess(props.projectId)
const projectChat = useProjectChatStore()
const { teamUsers, visibleTeamUsers, extraTeamCount, onlineCount } = provideProjectUsers(toRef(props, 'projectId'))

watch(
  () => props.projectId,
  (id) => {
    if (id) void projectChat.ensureMounted(id)
  },
  { immediate: true },
)

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
      { id: 'notes', label: 'Bitácora', icon: StickyNote },
    ],
  },
  {
    label: 'Recursos',
    tabs: [
      { id: 'finance', label: 'Finanzas', icon: DollarSign },
      { id: 'team', label: 'Equipo', icon: Users },
      { id: 'messages', label: 'Mensajes', icon: MessageSquare },
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

function tabAllowed(tabId: ProjectDetailTab): boolean {
  if (tabId === 'finance') {
    return (
      access.canViewFinance.value &&
      Boolean(project.value && isProjectFinanceEnabled(project.value))
    )
  }
  if (tabId === 'team') return access.hasAccess.value
  if (tabId === 'settings') return access.canEditProject.value && !access.isSharedOnly.value
  return access.hasAccess.value
}

const visibleTabGroups = computed(() =>
  tabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => tabAllowed(tab.id)),
    }))
    .filter((group) => group.tabs.length > 0),
)

const activeTab = computed(() => (route.query.tab as ProjectDetailTab) || 'dashboard')
const activeTabLabel = computed(
  () =>
    visibleTabGroups.value.flatMap((g) => g.tabs).find((t) => t.id === activeTab.value)?.label ??
    'Dashboard',
)

const tabBadges = computed((): Partial<Record<ProjectDetailTab, number>> => {
  const pid = props.projectId
  const tasks = projectsStore.getProjectTasks(pid)
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length
  const milestones = projectsStore.getProjectMilestones(pid)
  const pendingMilestones = milestones.filter((m) => !m.completed).length
  const deliverables = projectsStore.getProjectDeliverables(pid)
  const pendingDeliverables = deliverables.filter((d) => !d.completed).length
  const openRisks = projectsStore.getProjectRisks(pid).filter((r) => r.status === 'open').length
  const noteCount = projectsStore.getProjectNotes(pid).length
  const docs = projectsStore.getProjectDocuments(pid).length
  const files = projectsStore.getProjectFiles(pid).length
  const team = projectsStore.getProjectMembers(pid).length
  const scheduled = tasks.filter((t) => t.startDate || t.dueDate).length

  return {
    tasks: pendingTasks || undefined,
    messages: projectChat.unreadCount || undefined,
    gantt: scheduled || undefined,
    milestones: pendingMilestones || undefined,
    deliverables: pendingDeliverables || undefined,
    notes: noteCount || undefined,
    risks: openRisks || undefined,
    documents: docs || undefined,
    files: files || undefined,
    team: team || undefined,
  }
})

function badgeFor(tabId: ProjectDetailTab): number | undefined {
  const n = tabBadges.value[tabId]
  return n && n > 0 ? n : undefined
}

function badgeLabel(n: number): string {
  return n > 99 ? '99+' : String(n)
}

function setTab(tab: ProjectDetailTab) {
  mobileNavOpen.value = false
  router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <div v-if="project && access.hasAccess.value" class="project-detail flex h-full min-h-0 flex-col overflow-hidden">
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
          <button
            v-if="!access.isSharedOnly.value"
            type="button"
            class="project-breadcrumb__link"
            @click="router.push('/app/projects')"
          >
            Proyectos
          </button>
          <template v-if="!access.isSharedOnly.value">
            <ChevronRight :size="14" class="text-[#c7c7cc]" />
          </template>
          <span v-if="access.isSharedOnly.value" class="text-[#626f86]">Proyecto compartido</span>
          <ChevronRight v-if="access.isSharedOnly.value" :size="14" class="text-[#c7c7cc]" />
          <span class="font-medium text-[#172b4d]">{{ project.name }}</span>
        </nav>

        <h1 class="project-chrome__title md:hidden">{{ project.name }}</h1>

        <div class="project-chrome__actions">
          <button
            v-if="teamUsers.length"
            type="button"
            class="project-chrome__team"
            :title="`${onlineCount} en línea · ${teamUsers.length} en el equipo`"
            @click="setTab('team')"
          >
            <span
              v-for="(user, index) in visibleTeamUsers"
              :key="user.id"
              class="project-chrome__team-avatar"
              :class="{ 'project-chrome__team-avatar--online': true }"
              :style="{ zIndex: 10 - index }"
            >
              <UserAvatar :user-id="user.id" size="sm" />
            </span>
            <span v-if="extraTeamCount > 0" class="project-chrome__team-more">
              +{{ extraTeamCount }}
            </span>
            <span v-if="onlineCount > 1" class="project-chrome__online-badge">{{ onlineCount }}</span>
          </button>
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

    <div class="project-detail__body flex min-h-0 flex-1 overflow-hidden">
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
          <div v-for="group in visibleTabGroups" :key="group.label" class="mb-4">
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
                <component :is="tab.icon" :size="20" />
                <span class="project-nav-item__label">{{ tab.label }}</span>
                <span
                  v-if="badgeFor(tab.id)"
                  class="project-nav-badge"
                  :class="{ 'project-nav-badge--active': activeTab === tab.id }"
                >
                  {{ badgeLabel(badgeFor(tab.id)!) }}
                </span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <div
        class="project-content scroll-thin min-w-0 flex-1"
        :class="{
          'project-content--board': activeTab === 'tasks',
          'project-content--chat': activeTab === 'messages',
        }"
      >
        <div
          class="project-content__inner"
          :class="{
            'project-content__inner--board': activeTab === 'tasks',
            'project-content__inner--chat': activeTab === 'messages',
          }"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="project && !access.hasAccess.value" class="flex h-full items-center justify-center px-6">
    <div class="text-center">
      <p class="text-base text-[#626f86]">No tienes acceso a este proyecto.</p>
      <button type="button" class="ql-btn ql-btn--ghost mt-4" @click="router.push('/app/projects')">
        Volver a proyectos
      </button>
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
