<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Plus, Search, FolderKanban, TrendingUp, Clock, AlertCircle } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { canEdit } from '@/utils/permissions'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import PriorityBadge from '@/components/projects/shared/PriorityBadge.vue'
import ProjectProgressRing from '@/components/projects/shared/ProjectProgressRing.vue'
import {
  calcFinanceSummary,
  calcProjectProgress,
  isProjectOverdue,
  daysUntil,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'
import { CURRENCIES, DEFAULT_CURRENCY, formatMoney } from '@/utils/currency'
import CurrencyInput from '@/components/projects/shared/CurrencyInput.vue'
import type { ProjectStatus } from '@/types/projects'
import { PROJECT_CREATION_ENABLED, PROJECTS_MODULE_ENABLED } from '@/config/features'

const store = useQuinListStore()
const projectsStore = useProjectsStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!projectsStore.isReady) void projectsStore.init()
})

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
const creating = ref(false)
const budgetError = ref('')
const search = ref('')
const statusFilter = ref<ProjectStatus | 'all'>('all')

const canCreate = computed(
  () =>
    PROJECTS_MODULE_ENABLED &&
    PROJECT_CREATION_ENABLED &&
    canEdit(store.getUserRole(store.currentWorkspaceId)),
)

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
  budgetError.value = ''
  showCreate.value = true
}

function nextStep() {
  if (!newName.value.trim()) return
  budgetError.value = ''
  createStep.value = 2
}

async function createProject() {
  budgetError.value = ''
  const budget = newBudget.value
  if (!newName.value.trim()) return
  if (!budget || budget <= 0) {
    budgetError.value = 'El presupuesto inicial es obligatorio y debe ser mayor a 0'
    createStep.value = 2
    return
  }
  creating.value = true
  try {
    const project = await projectsStore.createProject({
      workspaceId: store.currentWorkspaceId,
      name: newName.value.trim(),
      client: newClient.value.trim(),
      description: newDescription.value.trim(),
      budget,
      profitabilityTarget: typeof newProfitability.value === 'number' ? newProfitability.value : null,
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
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 md:px-6">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <FolderKanban :size="24" class="text-[#0c66e4]" />
          <h1 class="text-2xl font-semibold text-[#172b4d]">Gestión de Proyectos</h1>
        </div>
        <p class="text-sm text-[#626f86]">
          Planificación, seguimiento y control en {{ store.currentWorkspace?.name }}
        </p>
      </div>
      <button
        v-if="canCreate"
        class="flex items-center gap-1.5 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0055cc]"
        @click="openCreate"
      >
        <Plus :size="16" />
        Nuevo proyecto
      </button>
    </div>

    <div v-if="stats.total" class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-xs font-medium text-[#626f86] uppercase">Proyectos</p>
        <p class="mt-1 text-2xl font-bold text-[#172b4d]">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <TrendingUp :size="16" class="text-[#0c66e4]" />
        <p class="mt-1 text-2xl font-bold text-[#172b4d]">{{ stats.avgProgress }}%</p>
        <p class="text-xs text-[#626f86]">Avance promedio</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <Clock :size="16" class="text-emerald-500" />
        <p class="mt-1 text-2xl font-bold text-[#172b4d]">{{ stats.active }}</p>
        <p class="text-xs text-[#626f86]">Activos</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <AlertCircle :size="16" class="text-red-500" />
        <p class="mt-1 text-2xl font-bold text-[#172b4d]">{{ stats.overdue }}</p>
        <p class="text-xs text-[#626f86]">Vencidos</p>
      </div>
    </div>

    <div v-if="allItems.length" class="mb-4 flex flex-wrap gap-3">
      <div class="relative min-w-[200px] flex-1">
        <Search :size="16" class="absolute top-2.5 left-3 text-[#626f86]" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, cliente o etiqueta..."
          class="w-full rounded-lg border border-[#091e4229] py-2 pr-3 pl-9 text-sm outline-none focus:border-[#0c66e4]"
        />
      </div>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-[#091e4229] px-3 py-2 text-sm text-[#44546f]"
      >
        <option value="all">Todos los estados</option>
        <option v-for="(label, key) in PROJECT_STATUS_LABELS" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
    </div>

    <div v-if="items.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="{ project, progress, pending, total, finance, overdue, daysLeft, responsible } in items"
        :key="project.id"
        :to="`/app/projects/${project.id}`"
        class="group relative overflow-hidden rounded-xl border border-[#091e4214] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div
          class="absolute top-0 left-0 h-1 w-full"
          :style="{ background: PROJECT_STATUS_COLORS[project.status] }"
        />
        <div class="p-5">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-semibold text-[#172b4d] group-hover:text-[#0c66e4]">
                {{ project.name }}
              </h2>
              <p v-if="project.client" class="mt-0.5 truncate text-sm text-[#626f86]">
                {{ project.client }}
              </p>
            </div>
            <ProjectProgressRing :percent="progress" :size="48" :stroke="4" />
          </div>

          <div class="mb-3 flex flex-wrap items-center gap-2">
            <ProjectStatusBadge :status="project.status" />
            <PriorityBadge :priority="project.priority" compact />
            <span
              v-if="overdue"
              class="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600"
            >
              Vencido
            </span>
            <span
              v-else-if="daysLeft != null && daysLeft <= 7 && daysLeft >= 0"
              class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
            >
              {{ daysLeft }}d restantes
            </span>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#626f86]">
            <span>{{ pending }}/{{ total }} tareas pendientes</span>
            <span v-if="project.dueDate">Vence {{ formatDate(project.dueDate) }}</span>
            <span v-if="responsible">{{ responsible.name }}</span>
          </div>

          <div v-if="project.budget" class="mt-3">
            <div class="mb-1 flex justify-between text-[10px] text-[#626f86]">
              <span>{{ formatMoney(project.budget, project.currency) }}</span>
              <span>{{ finance.usagePercent }}%</span>
            </div>
            <div class="h-1 overflow-hidden rounded-full bg-[#091e4214]">
              <div
                class="h-full rounded-full transition-all bg-[#0c66e4]"
                :class="finance.usagePercent >= 90 ? 'opacity-70' : ''"
                :style="{ width: `${Math.min(100, finance.usagePercent)}%` }"
              />
            </div>
          </div>
        </div>
      </RouterLink>
    </div>

    <div
      v-else-if="allItems.length && !items.length"
      class="rounded-xl border border-dashed border-[#091e4229] bg-white px-6 py-12 text-center"
    >
      <p class="text-[#626f86]">No hay proyectos que coincidan con tu búsqueda.</p>
    </div>

    <div
      v-else
      class="rounded-xl border border-dashed border-[#091e4229] bg-white px-6 py-16 text-center"
    >
      <FolderKanban :size="40" class="mx-auto mb-3 text-[#091e4229]" />
      <p class="text-[#626f86]">No hay proyectos en este espacio de trabajo.</p>
      <button
        v-if="canCreate"
        class="mt-4 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
        @click="openCreate"
      >
        Crear primer proyecto
      </button>
      <p v-else class="mt-3 text-xs text-[#626f86]">
        La creación de proyectos estará disponible próximamente.
      </p>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
        @click.self="showCreate = false"
      >
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-4 flex items-center gap-2">
            <span
              v-for="s in 2"
              :key="s"
              class="h-1.5 flex-1 rounded-full"
              :class="createStep >= s ? 'bg-[#0c66e4]' : 'bg-[#091e4214]'"
            />
          </div>
          <h2 class="text-lg font-semibold text-[#172b4d]">
            {{ createStep === 1 ? 'Información del proyecto' : 'Presupuesto y planificación' }}
          </h2>
          <p class="mt-1 text-sm text-[#626f86]">
            {{ createStep === 1 ? 'Paso 1 de 2 — Datos generales' : 'Paso 2 de 2 — Define el presupuesto inicial (obligatorio)' }}
          </p>

          <div v-if="createStep === 1" class="mt-4 space-y-3">
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Nombre del proyecto *</label>
              <input v-model="newName" type="text" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]" placeholder="Ej. Rediseño App Móvil" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Cliente</label>
              <input v-model="newClient" type="text" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Descripción</label>
              <textarea v-model="newDescription" rows="3" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Categoría</label>
              <input v-model="newCategory" type="text" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]" placeholder="Producto, Desarrollo..." />
            </div>
          </div>

          <div v-else class="mt-4 space-y-3">
            <div class="rounded-lg border border-[#0c66e4]/30 bg-blue-50 p-3 text-sm text-[#0747a6]">
              El presupuesto inicial define la base financiera del proyecto. Podrás registrar ingresos y egresos después en el módulo de Finanzas.
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#44546f]">Presupuesto inicial *</label>
              <CurrencyInput v-model="newBudget" :currency="newCurrency" placeholder="Ej. 50.000.000" />
              <p v-if="budgetError" class="mt-1 text-xs text-red-600">{{ budgetError }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Moneda</label>
              <select v-model="newCurrency" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Meta de rentabilidad (%)</label>
              <input v-model.number="newProfitability" type="number" min="0" max="100" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm" placeholder="Opcional" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm text-[#44546f]">Fecha inicio</label>
                <input v-model="newStartDate" type="date" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm text-[#44546f]">Fecha fin estimada</label>
                <input v-model="newDueDate" type="date" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm text-[#44546f]">Prioridad</label>
              <select v-model="newPriority" class="w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-between">
            <button
              v-if="createStep === 2"
              class="rounded-lg px-4 py-2 text-sm text-[#626f86] hover:bg-slate-50"
              @click="createStep = 1"
            >
              Atrás
            </button>
            <span v-else />
            <div class="flex gap-2">
              <button class="rounded-lg px-4 py-2 text-sm text-[#626f86] hover:bg-slate-50" @click="showCreate = false">Cancelar</button>
              <button
                v-if="createStep === 1"
                class="rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-50"
                :disabled="!newName.trim()"
                @click="nextStep"
              >
                Siguiente
              </button>
              <button
                v-else
                class="rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-50"
                :disabled="creating"
                @click="createProject"
              >
                Crear proyecto
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
