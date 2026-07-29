<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus, AlertTriangle, ShieldAlert, Pencil, Trash2, RefreshCw } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useProjectUsers } from '@/composables/useProjectUsers'
import type { RiskSeverity, RiskType, RiskStatus, RiskProbability } from '@/types/projects'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import { isAutoRisk, stripAutoMarker } from '@/utils/projectRiskDetection'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const { resolveUser } = useProjectUsers()
const risks = computed(() => projectsStore.getProjectRisks(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))

const showModal = ref(false)
const syncing = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  title: '',
  description: '',
  type: 'risk' as RiskType,
  severity: 'medium' as RiskSeverity,
  probability: 'medium' as RiskProbability,
  mitigationPlan: '',
  ownerId: '',
})

const severityLabels: Record<RiskSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const severityClass: Record<RiskSeverity, string> = {
  low: 'bg-[#eef6fc] text-[#2d7eb8]',
  medium: 'bg-[#eef6fc] text-[#5bbce4]',
  high: 'bg-[#fef3ef] text-[#f4845f]',
  critical: 'bg-[#fef0ec] text-[#e8754f]',
}

const statusLabels: Record<RiskStatus, string> = {
  open: 'Abierto',
  mitigated: 'Mitigado',
  closed: 'Cerrado',
}

const matrixScore = computed(() => {
  const open = risks.value.filter((r) => r.status === 'open')
  return {
    total: risks.value.length,
    open: open.length,
    critical: open.filter((r) => r.severity === 'critical' || r.severity === 'high').length,
    auto: open.filter((r) => isAutoRisk(r)).length,
  }
})

async function runAutoSync() {
  syncing.value = true
  try {
    await projectsStore.syncAutoRisks(props.projectId)
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  void runAutoSync()
})

watch([tasks, milestones], () => {
  void runAutoSync()
})

function openCreate() {
  editingId.value = null
  form.value = {
    title: '',
    description: '',
    type: 'risk',
    severity: 'medium',
    probability: 'medium',
    mitigationPlan: '',
    ownerId: auth.currentUserId ?? '',
  }
  showModal.value = true
}

function openEdit(risk: typeof risks.value[0]) {
  editingId.value = risk.id
  form.value = {
    title: risk.title,
    description: stripAutoMarker(risk.description),
    type: risk.type,
    severity: risk.severity,
    probability: risk.probability,
    mitigationPlan: risk.mitigationPlan,
    ownerId: risk.ownerId ?? '',
  }
  showModal.value = true
}

async function save() {
  if (!form.value.title.trim()) return
  const payload = {
    ...form.value,
    ownerId: form.value.ownerId || null,
  }
  const isEdit = !!editingId.value
  const editId = editingId.value

  showModal.value = false

  try {
    if (isEdit && editId) {
      await projectsStore.updateRisk(editId, payload)
    } else {
      await projectsStore.addRisk(props.projectId, payload)
    }
  } catch (err) {
    console.error(err)
  }
}

function userName(id: string | null) {
  if (!id) return '—'
  return resolveUser(id)?.name ?? 'Usuario'
}

function riskDescription(risk: typeof risks.value[0]) {
  return stripAutoMarker(risk.description)
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Riesgos</h2>
        <p class="project-page-sub">
          Matriz de riesgos e incidencias · detección automática por fechas y bloqueos
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="ql-btn ql-btn--ghost"
          :disabled="syncing"
          @click="runAutoSync"
        >
          <RefreshCw :size="16" :class="syncing && 'animate-spin'" />
          Actualizar detección
        </button>
        <button type="button" class="ql-btn ql-btn--primary" @click="openCreate">
          <Plus :size="18" />
          Registrar riesgo
        </button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-4">
      <div class="project-card project-kpi">
        <AlertTriangle :size="20" class="mb-2 text-[#f4845f]" />
        <p class="project-kpi__value">{{ matrixScore.open }}</p>
        <p class="project-kpi__label">Abiertos</p>
      </div>
      <div class="project-card project-kpi">
        <ShieldAlert :size="20" class="mb-2 text-[#e8754f]" />
        <p class="project-kpi__value">{{ matrixScore.critical }}</p>
        <p class="project-kpi__label">Alta / Crítica</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__value">{{ matrixScore.auto }}</p>
        <p class="project-kpi__label">Detectados auto</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__value">{{ matrixScore.total }}</p>
        <p class="project-kpi__label">Total registrados</p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="risk in risks"
        :key="risk.id"
        class="project-card project-card--lg transition hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between gap-2">
          <div class="flex min-w-0 items-start gap-2">
            <AlertTriangle :size="18" class="mt-0.5 shrink-0 text-[#f4845f]" />
            <p class="font-semibold text-[#172b4d]">{{ risk.title }}</p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7]"
              @click="openEdit(risk)"
            >
              <Pencil :size="16" />
            </button>
            <button
              v-if="!isAutoRisk(risk)"
              type="button"
              class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7] hover:text-red-600"
              @click="projectsStore.deleteRisk(risk.id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <div class="mb-3 flex flex-wrap gap-2">
          <span
            v-if="isAutoRisk(risk)"
            class="rounded-full bg-[#eef6fc] px-2.5 py-0.5 text-xs font-medium text-[#2d7eb8]"
          >
            Detectado automáticamente
          </span>
          <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="severityClass[risk.severity]">
            {{ severityLabels[risk.severity] }}
          </span>
          <span class="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs font-medium text-[#44546f]">
            {{ risk.type === 'risk' ? 'Riesgo' : 'Incidencia' }}
          </span>
          <span class="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs font-medium text-[#44546f]">
            Prob. {{ risk.probability }}
          </span>
        </div>

        <p v-if="riskDescription(risk)" class="text-sm text-[#626f86]">{{ riskDescription(risk) }}</p>
        <p v-if="risk.mitigationPlan" class="mt-2 rounded-lg bg-[#fafafa] px-3 py-2 text-xs text-[#44546f]">
          <span class="font-medium">Mitigación:</span> {{ risk.mitigationPlan }}
        </p>

        <div class="mt-4 flex items-center justify-between gap-3 border-t border-[#ebebed] pt-4">
          <div v-if="risk.ownerId" class="flex items-center gap-2">
            <UserAvatar :user-id="risk.ownerId" size="sm" />
            <span class="text-sm text-[#626f86]">{{ userName(risk.ownerId) }}</span>
          </div>
          <span v-else class="text-sm text-[#626f86]">Sin responsable</span>
          <select
            :value="risk.status"
            class="project-create-modal__input w-auto py-1.5 text-sm"
            @change="projectsStore.updateRisk(risk.id, { status: ($event.target as HTMLSelectElement).value as RiskStatus })"
          >
            <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="!risks.length" class="py-12 text-center text-sm text-[#626f86]">
      Sin riesgos registrados. Se detectarán automáticamente tareas vencidas, bloqueadas o próximas a vencer.
    </p>

    <ProjectModal
      v-if="showModal"
      :title="editingId ? 'Editar riesgo' : 'Nuevo riesgo o incidencia'"
      size="lg"
      @close="showModal = false"
    >
      <div class="app-window-form-row app-window-form-row--2">
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Título *</label>
          <input v-model="form.title" class="project-create-modal__input" placeholder="Título del riesgo" />
        </div>
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Descripción</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="project-create-modal__input resize-none"
            placeholder="Opcional"
          />
        </div>
        <div>
          <label class="project-create-modal__label">Tipo</label>
          <select v-model="form.type" class="project-create-modal__input">
            <option value="risk">Riesgo</option>
            <option value="incident">Incidencia</option>
          </select>
        </div>
        <div>
          <label class="project-create-modal__label">Severidad</label>
          <select v-model="form.severity" class="project-create-modal__input">
            <option v-for="(label, key) in severityLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="project-create-modal__label">Probabilidad</label>
          <select v-model="form.probability" class="project-create-modal__input">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label class="project-create-modal__label">Responsable</label>
          <select v-model="form.ownerId" class="project-create-modal__input">
            <option value="">Sin responsable</option>
            <option v-for="m in members" :key="m.id" :value="m.userId">
              {{ resolveUser(m.userId)?.name }}
            </option>
          </select>
        </div>
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Plan de mitigación</label>
          <textarea
            v-model="form.mitigationPlan"
            rows="2"
            class="project-create-modal__input resize-none"
            placeholder="Opcional"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showModal = false">Cancelar</button>
        <button type="button" class="btn-brand" @click="save">Guardar</button>
      </template>
    </ProjectModal>
  </div>
</template>
