<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Plus, Search, FolderKanban, TrendingUp, Clock, AlertCircle, LayoutGrid, FolderPlus, RefreshCw, Home, LayoutDashboard } from '@lucide/vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { canEdit } from '@/utils/permissions'
import {
  calcFinanceSummary,
  calcProjectProgress,
  isProjectOverdue,
  daysUntil,
  PROJECT_STATUS_LABELS,
} from '@/utils/projectStats'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/utils/currency'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import ProjectFolderIcon from '@/components/projects/shared/ProjectFolderIcon.vue'
import AppliesToggle from '@/components/projects/shared/AppliesToggle.vue'
import PriorityPicker from '@/components/projects/shared/PriorityPicker.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import DesktopContextMenu from '@/components/workspace/DesktopContextMenu.vue'
import AppWindow from '@/components/ui/AppWindow.vue'
import type { DesktopMenuItem } from '@/components/workspace/DesktopContextMenu.vue'
import type { ProjectStatus } from '@/types/projects'
import { PROJECT_CREATION_ENABLED, PROJECTS_MODULE_ENABLED } from '@/config/features'
import { useUiStore } from '@/stores/ui'

const store = useQuinListStore()
const projectsStore = useProjectsStore()
const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const showCreate = ref(false)
const createStep = ref(1)
const newName = ref('')
const newClient = ref('')
const newDescription = ref('')
const newBudget = ref(0)
const newProfitability = ref<number | ''>('')
const newStartDate = ref('')
const newDueDate = ref('')
const newPriority = ref<'baja' | 'media' | 'alta'>('media')
const newCategory = ref('')
const newCurrency = ref(DEFAULT_CURRENCY)
const clientApplies = ref(false)
const budgetApplies = ref(false)
const creating = ref(false)
const budgetError = ref('')
const search = ref('')
const statusFilter = ref<ProjectStatus | 'all'>('all')
const selectedProjectId = ref<string | null>(null)
const contextMenu = ref<{ x: number; y: number } | null>(null)

const canCreate = computed(
  () =>
    PROJECTS_MODULE_ENABLED &&
    PROJECT_CREATION_ENABLED &&
    canEdit(store.getUserRole(store.currentWorkspaceId)),
)

const contextMenuItems = computed((): DesktopMenuItem[] => [
  {
    id: 'new-project',
    label: 'Nuevo proyecto',
    icon: FolderPlus,
    disabled: !canCreate.value,
  },
  {
    id: 'new-board',
    label: 'Nuevo tablero',
    icon: LayoutGrid,
    disabled: !canCreate.value,
  },
  { id: 'refresh', label: 'Actualizar', icon: RefreshCw },
  { id: 'home', label: 'Ir al inicio', icon: Home },
  { id: 'boards', label: 'Ver tableros', icon: LayoutDashboard },
])

const allItems = computed(() => {
  const wsId = store.currentWorkspaceId
  return projectsStore.workspaceProjects(wsId).map((project) => {
    const tasks = projectsStore.getProjectTasks(project.id)
    const costs = projectsStore.getProjectCosts(project.id)
    const finance = calcFinanceSummary(project, costs)
    return {
      project,
      progress: calcProjectProgress(tasks),
      pending: tasks.filter((t) => t.status !== 'done').length,
      total: tasks.length,
      finance,
      overdue: isProjectOverdue(project),
      daysLeft: daysUntil(project.dueDate),
      responsible: project.responsibleId ? auth.getUserById(project.responsibleId) : null,
    }
  })
})

const stats = computed(() => {
  const items = allItems.value
  const active = items.filter((i) => i.project.status === 'active').length
  const avgProgress = items.length
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length)
    : 0
  const overdue = items.filter((i) => i.overdue).length
  return { total: items.length, active, avgProgress, overdue }
})

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allItems.value.filter(({ project }) => {
    if (statusFilter.value !== 'all' && project.status !== statusFilter.value) return false
    if (!q) return true
    return (
      project.name.toLowerCase().includes(q) ||
      project.client.toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q) ||
      project.tags.some((t) => t.toLowerCase().includes(q))
    )
  })
})

function openCreate() {
  createStep.value = 1
  newName.value = ''
  newClient.value = ''
  newDescription.value = ''
  newBudget.value = 0
  newProfitability.value = ''
  newStartDate.value = ''
  newDueDate.value = ''
  newPriority.value = 'media'
  newCategory.value = ''
  newCurrency.value = DEFAULT_CURRENCY
  clientApplies.value = false
  budgetApplies.value = false
  budgetError.value = ''
  showCreate.value = true
}

async function createProject() {
  budgetError.value = ''
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const project = await projectsStore.createProject({
      workspaceId: store.currentWorkspaceId,
      name: newName.value.trim(),
      client: clientApplies.value ? newClient.value.trim() : '',
      description: newDescription.value.trim(),
      budget: budgetApplies.value && newBudget.value > 0 ? newBudget.value : 0,
      profitabilityTarget:
        budgetApplies.value && typeof newProfitability.value === 'number'
          ? newProfitability.value
          : null,
      startDate: newStartDate.value || null,
      dueDate: newDueDate.value || null,
      priority: newPriority.value,
      category: newCategory.value.trim(),
      currency: newCurrency.value,
    })
    showCreate.value = false
    if (project) router.push(`/app/projects/${project.id}`)
  } finally {
    creating.value = false
  }
}

function nextStep() {
  if (!newName.value.trim()) return
  budgetError.value = ''
  createStep.value = 2
}

function openProject(id: string) {
  router.push(`/app/projects/${id}`)
}

function onProjectClick(id: string) {
  selectedProjectId.value = id
}

function onProjectDblClick(id: string) {
  openProject(id)
}

function onDesktopContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  const maxX = window.innerWidth - 220
  const maxY = window.innerHeight - 160
  contextMenu.value = {
    x: Math.min(e.clientX, maxX),
    y: Math.min(e.clientY, maxY),
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

async function onContextMenuSelect(id: string) {
  if (id === 'new-project') openCreate()
  else if (id === 'new-board') ui.openCreateBoard()
  else if (id === 'refresh') await projectsStore.reloadForWorkspace(store.currentWorkspaceId)
  else if (id === 'home') await router.push('/app')
  else if (id === 'boards') await router.push('/app')
}

function onDesktopClick() {
  selectedProjectId.value = null
  closeContextMenu()
}

onMounted(() => {
  void projectsStore.init()
  if (route.query.create === '1') {
    openCreate()
    void router.replace({ query: {} })
  }
})

onUnmounted(() => {
  closeContextMenu()
})
</script>

<template>
  <div class="workspace-desktop projects-page flex min-h-full w-full flex-col">
    <!-- Barra superior -->
    <header class="shrink-0 border-b border-[#091e4214] bg-white px-6 py-4 lg:px-10">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <FolderKanban :size="22" class="text-brand-coral" />
            <h1 class="text-xl font-semibold text-[#172b4d]">Proyectos</h1>
          </div>
          <p class="mt-0.5 text-sm text-[#626f86]">
            {{ store.currentWorkspace?.name }} · Escritorio de gestión
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div v-if="allItems.length" class="relative min-w-[220px]">
            <Search :size="15" class="absolute top-2.5 left-3 text-[#626f86]" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar proyectos..."
              class="w-full rounded-lg border border-[#091e4229] bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-[#5bbce4] focus:ring-2 focus:ring-[#5bbce4]/20"
            />
          </div>
          <select
            v-if="allItems.length"
            v-model="statusFilter"
            class="rounded-lg border border-[#091e4229] bg-white px-3 py-2 text-sm text-[#44546f]"
          >
            <option value="all">Todos</option>
            <option v-for="(label, key) in PROJECT_STATUS_LABELS" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
          <button
            v-if="canCreate"
            class="btn-brand"
            @click="openCreate"
          >
            <Plus :size="16" />
            Nuevo proyecto
          </button>
        </div>
      </div>

      <div v-if="stats.total" class="mt-4 flex flex-wrap gap-6 text-sm">
        <div class="flex items-center gap-2 text-[#44546f]">
          <span class="font-semibold text-[#172b4d]">{{ stats.total }}</span> proyectos
        </div>
        <div class="flex items-center gap-1.5 text-[#44546f]">
          <TrendingUp :size="14" class="text-brand-sky" />
          <span class="font-semibold text-[#172b4d]">{{ stats.avgProgress }}%</span> avance
        </div>
        <div class="flex items-center gap-1.5 text-[#44546f]">
          <Clock :size="14" class="text-emerald-600" />
          <span class="font-semibold text-[#172b4d]">{{ stats.active }}</span> activos
        </div>
        <div v-if="stats.overdue" class="flex items-center gap-1.5 text-red-600">
          <AlertCircle :size="14" />
          <span class="font-semibold">{{ stats.overdue }}</span> vencidos
        </div>
      </div>
    </header>

    <!-- Escritorio -->
    <div
      class="workspace-desktop__canvas min-h-0 flex-1 overflow-auto px-6 py-8 lg:px-10"
      @click="onDesktopClick"
      @contextmenu="onDesktopContextMenu"
    >
      <div v-if="items.length" class="workspace-desktop__grid">
        <button
          v-for="{ project, progress } in items"
          :key="project.id"
          type="button"
          class="workspace-desktop__item"
          :class="{ 'workspace-desktop__item--selected': selectedProjectId === project.id }"
          @click.stop="onProjectClick(project.id)"
          @dblclick.stop="onProjectDblClick(project.id)"
          @contextmenu.stop="onDesktopContextMenu"
        >
          <ProjectFolderIcon
            :name="project.name"
            :status="project.status"
            :progress="progress"
            :selected="selectedProjectId === project.id"
          />
        </button>

        <button
          v-if="canCreate"
          type="button"
          class="workspace-desktop__item workspace-desktop__item--new"
          @click.stop="openCreate"
        >
          <div class="project-folder project-folder--new">
            <div class="project-folder__icon-wrap project-folder__icon-wrap--new">
              <Plus :size="28" class="text-brand-coral" />
            </div>
            <p class="project-folder__label">Nuevo proyecto</p>
          </div>
        </button>
      </div>

      <div
        v-else-if="allItems.length && !items.length"
        class="flex h-full min-h-[320px] flex-col items-center justify-center text-center"
      >
        <p class="text-[#626f86]">No hay proyectos que coincidan con tu búsqueda.</p>
      </div>

      <div
        v-else
        class="flex h-full min-h-[360px] flex-col items-center justify-center text-center"
      >
        <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-[#091e4229] bg-[#fafbfc]">
          <FolderKanban :size="36" class="text-[#f4845f]/40" />
        </div>
        <p class="text-base font-medium text-[#172b4d]">Tu escritorio de proyectos está vacío</p>
        <p class="mt-1 max-w-sm text-sm text-[#626f86]">
          Clic derecho para crear un proyecto o tablero, o usa el botón de arriba.
        </p>
        <button
          v-if="canCreate"
          class="btn-brand mt-5 px-5 py-2.5"
          @click.stop="openCreate"
        >
          Crear primer proyecto
        </button>
      </div>

      <p class="mt-8 text-center text-xs text-[#94a3b8]">
        Clic derecho en el escritorio para más opciones · Doble clic en una carpeta para abrir
      </p>
    </div>

    <DesktopContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenuItems"
      @select="onContextMenuSelect"
      @close="closeContextMenu"
    />

    <Teleport to="body">
      <div
        v-if="showCreate"
        class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
        @click.self="showCreate = false"
      >
        <AppWindow
          :title="createStep === 1 ? 'Nuevo proyecto' : 'Planificación'"
          :subtitle="`Paso ${createStep} de 2`"
          class="app-window--wide"
          @close="showCreate = false"
        >
          <div class="mb-4 flex items-center gap-1.5">
            <span
              v-for="s in 2"
              :key="s"
              class="app-step-bar"
              :class="{ 'app-step-bar--active': createStep >= s }"
            />
          </div>

          <div v-if="createStep === 1" class="app-window-form-row app-window-form-row--2">
            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Nombre *</label>
              <input
                v-model="newName"
                type="text"
                class="project-create-modal__input"
                placeholder="Ej. App móvil"
              />
            </div>

            <div>
              <label class="project-create-modal__label">Categoría</label>
              <input
                v-model="newCategory"
                type="text"
                class="project-create-modal__input"
                placeholder="Desarrollo, producto..."
              />
            </div>

            <div class="space-y-2">
              <AppliesToggle v-model="clientApplies" label="Cliente externo" hint="Proyecto propio si está off" />
              <input
                v-if="clientApplies"
                v-model="newClient"
                type="text"
                class="project-create-modal__input"
                placeholder="Nombre del cliente"
              />
            </div>

            <div class="app-window-form-span-full">
              <label class="project-create-modal__label">Descripción</label>
              <textarea
                v-model="newDescription"
                rows="2"
                class="project-create-modal__input resize-none"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div v-else class="app-window-form-row app-window-form-row--2">
            <div class="app-window-form-span-full space-y-2">
              <AppliesToggle v-model="budgetApplies" label="Control de presupuesto" hint="Finanzas del proyecto" />
              <div v-if="budgetApplies" class="app-window-form-row app-window-form-row--3">
                <div class="app-window-form-span-2">
                  <label class="project-create-modal__label">Presupuesto</label>
                  <CurrencyInput v-model="newBudget" :currency="newCurrency" placeholder="0" />
                  <p v-if="budgetError" class="mt-1 text-xs text-red-600">{{ budgetError }}</p>
                </div>
                <div>
                  <label class="project-create-modal__label">Moneda</label>
                  <select v-model="newCurrency" class="project-create-modal__input">
                    <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="project-create-modal__label">Rentabilidad %</label>
                  <input
                    v-model.number="newProfitability"
                    type="number"
                    min="0"
                    max="100"
                    class="project-create-modal__input"
                    placeholder="Opc."
                  />
                </div>
              </div>
            </div>

            <DateInput v-model="newStartDate" label="Inicio" :default-today="false" />
            <DateInput v-model="newDueDate" label="Fin estimado" :default-today="false" :min="newStartDate || undefined" />

            <div class="app-window-form-span-full">
              <PriorityPicker v-model="newPriority">Prioridad</PriorityPicker>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between">
              <button
                v-if="createStep === 2"
                type="button"
                class="btn-brand-ghost"
                @click="createStep = 1"
              >
                Atrás
              </button>
              <span v-else />
              <div class="flex gap-2">
                <button type="button" class="btn-brand-ghost" @click="showCreate = false">Cancelar</button>
                <button
                  v-if="createStep === 1"
                  type="button"
                  class="btn-brand"
                  :disabled="!newName.trim()"
                  @click="nextStep"
                >
                  Siguiente
                </button>
                <button
                  v-else
                  type="button"
                  class="btn-brand"
                  :disabled="creating"
                  @click="createProject"
                >
                  Crear proyecto
                </button>
              </div>
            </div>
          </template>
        </AppWindow>
      </div>
    </Teleport>
  </div>
</template>
