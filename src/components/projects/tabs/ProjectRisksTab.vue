<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, AlertTriangle, ShieldAlert, Pencil, Trash2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import type { RiskSeverity, RiskType, RiskStatus, RiskProbability } from '@/types/projects'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const risks = computed(() => projectsStore.getProjectRisks(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))

const showModal = ref(false)
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

const inputClass = 'w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]'

const severityLabels: Record<RiskSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
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
  }
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
    description: risk.description,
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
  if (editingId.value) {
    await projectsStore.updateRisk(editingId.value, payload)
  } else {
    await projectsStore.addRisk(props.projectId, payload)
  }
  showModal.value = false
}

function userName(id: string | null) {
  if (!id) return '—'
  return auth.getUserById(id)?.name ?? 'Usuario'
}
</script>

<template>
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <AlertTriangle :size="16" class="text-[#0c66e4]" />
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ matrixScore.open }}</p>
        <p class="text-xs text-[#626f86]">Abiertos</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <ShieldAlert :size="16" class="text-[#44546f]" />
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ matrixScore.critical }}</p>
        <p class="text-xs text-[#626f86]">Alta / Crítica</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-2xl font-bold text-[#172b4d]">{{ matrixScore.total }}</p>
        <p class="text-xs text-[#626f86]">Total registrados</p>
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold text-[#172b4d]">Matriz de riesgos</h2>
        <button
          class="flex items-center gap-1.5 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0055cc]"
          @click="openCreate"
        >
          <Plus :size="15" />
          Registrar riesgo
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="risk in risks"
          :key="risk.id"
          class="rounded-lg border border-[#091e4214] p-4 transition hover:border-[#0c66e4]/20"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <AlertTriangle :size="16" class="shrink-0 text-[#0c66e4]" />
              <p class="font-medium text-[#172b4d]">{{ risk.title }}</p>
            </div>
            <div class="flex gap-1">
              <button class="rounded p-1 text-[#626f86] hover:bg-[#091e420a]" @click="openEdit(risk)">
                <Pencil :size="13" />
              </button>
              <button class="rounded p-1 text-[#626f86] hover:bg-[#091e420a]" @click="projectsStore.deleteRisk(risk.id)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
          <div class="mb-2 flex flex-wrap gap-1.5">
            <span class="rounded-full bg-[#091e420f] px-2 py-0.5 text-[10px] text-[#44546f]">
              {{ severityLabels[risk.severity] }}
            </span>
            <span class="rounded-full bg-[#091e420f] px-2 py-0.5 text-[10px] text-[#44546f]">
              {{ risk.type === 'risk' ? 'Riesgo' : 'Incidencia' }}
            </span>
            <span class="rounded-full bg-[#091e420f] px-2 py-0.5 text-[10px] text-[#44546f]">
              Prob. {{ risk.probability }}
            </span>
          </div>
          <p v-if="risk.description" class="text-sm text-[#626f86]">{{ risk.description }}</p>
          <p v-if="risk.mitigationPlan" class="mt-2 text-xs text-[#44546f]">
            Mitigación: {{ risk.mitigationPlan }}
          </p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-xs text-[#626f86]">{{ userName(risk.ownerId) }}</span>
            <select
              :value="risk.status"
              class="rounded-lg border border-[#091e4229] px-2 py-1 text-xs"
              @change="projectsStore.updateRisk(risk.id, { status: ($event.target as HTMLSelectElement).value as RiskStatus })"
            >
              <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
        </div>
      </div>
      <p v-if="!risks.length" class="text-sm text-[#626f86]">Sin riesgos registrados.</p>
    </div>

    <ProjectModal
      v-if="showModal"
      :title="editingId ? 'Editar riesgo' : 'Nuevo riesgo o incidencia'"
      size="lg"
      @close="showModal = false"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="form.title" placeholder="Título *" :class="inputClass + ' sm:col-span-2'" />
        <textarea v-model="form.description" rows="2" placeholder="Descripción" :class="inputClass + ' sm:col-span-2'" />
        <select v-model="form.type" :class="inputClass">
          <option value="risk">Riesgo</option>
          <option value="incident">Incidencia</option>
        </select>
        <select v-model="form.severity" :class="inputClass">
          <option v-for="(label, key) in severityLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="form.probability" :class="inputClass">
          <option value="low">Probabilidad baja</option>
          <option value="medium">Probabilidad media</option>
          <option value="high">Probabilidad alta</option>
        </select>
        <select v-model="form.ownerId" :class="inputClass">
          <option value="">Sin responsable</option>
          <option v-for="m in members" :key="m.id" :value="m.userId">
            {{ auth.getUserById(m.userId)?.name }}
          </option>
        </select>
        <textarea v-model="form.mitigationPlan" rows="2" placeholder="Plan de mitigación" :class="inputClass + ' sm:col-span-2'" />
      </div>
      <template #footer>
        <button class="px-3 py-1.5 text-sm" @click="showModal = false">Cancelar</button>
        <button class="rounded-lg bg-[#0c66e4] px-4 py-1.5 text-sm text-white" @click="save">Guardar</button>
      </template>
    </ProjectModal>
  </div>
</template>
