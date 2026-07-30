<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Package, Trash2, CheckCircle2, ChevronRight, Clock } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import { isCalendarOverdue } from '@/utils/datetime'
import type { DeliverableStatus } from '@/types/projects'
import { DELIVERABLE_STATUS_COLORS, DELIVERABLE_STATUS_LABELS } from '@/utils/projectReports'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import DeliverableCommentsPanel from '@/components/projects/shared/DeliverableCommentsPanel.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const { resolveUser } = useProjectUsers()
const deliverables = computed(() => projectsStore.getProjectDeliverables(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))

const showAdd = ref(false)
const detailId = ref<string | null>(null)
const form = ref({ title: '', description: '', dueDate: todayISO(), assigneeId: '', milestoneId: '' })

const statusBadgeClass: Record<DeliverableStatus, string> = {
  pending: 'deliverable-status--pending',
  in_progress: 'deliverable-status--progress',
  delivered: 'deliverable-status--delivered',
  approved: 'deliverable-status--approved',
}

const detail = computed(() => deliverables.value.find((d) => d.id === detailId.value) ?? null)

const approvedCount = computed(() => deliverables.value.filter((d) => d.status === 'approved').length)
const pendingCount = computed(() =>
  deliverables.value.filter((d) => d.status === 'pending' || d.status === 'in_progress').length,
)
const progressPct = computed(() =>
  deliverables.value.length ? Math.round((approvedCount.value / deliverables.value.length) * 100) : 0,
)

async function add() {
  if (!form.value.title.trim()) return
  const formCopy = { ...form.value }
  showAdd.value = false
  form.value = { title: '', description: '', dueDate: todayISO(), assigneeId: '', milestoneId: '' }

  try {
    const d = await projectsStore.addDeliverable(props.projectId, formCopy.title, formCopy.dueDate)
    if (d) {
      await projectsStore.updateDeliverable(d.id, {
        description: formCopy.description,
        dueDate: formCopy.dueDate,
        assigneeId: formCopy.assigneeId || null,
        milestoneId: formCopy.milestoneId || null,
      })
    }
  } catch (err) {
    console.error(err)
  }
}

function userName(id: string | null) {
  if (!id) return '—'
  return resolveUser(id)?.name ?? 'Usuario'
}

function isOverdue(dueDate: string | null, status: DeliverableStatus) {
  if (!dueDate || status === 'approved') return false
  return isCalendarOverdue(dueDate)
}

function previewDescription(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Entregables</h2>
        <p class="project-page-sub">Seguimiento de entregas, bitácora y archivos</p>
      </div>
      <button type="button" class="ql-btn ql-btn--primary" @click="showAdd = true">
        <Plus :size="18" />
        Nuevo entregable
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="project-card project-kpi">
        <Package :size="20" class="mb-2 text-[#5bbce4]" />
        <p class="project-kpi__value">{{ deliverables.length }}</p>
        <p class="project-kpi__label">Total entregables</p>
      </div>
      <div class="project-card project-kpi">
        <CheckCircle2 :size="20" class="mb-2 text-[#10b981]" />
        <p class="project-kpi__value">{{ approvedCount }}</p>
        <p class="project-kpi__label">Aprobados</p>
      </div>
      <div class="project-card project-kpi">
        <Clock :size="20" class="mb-2 text-[#f4845f]" />
        <p class="project-kpi__value">{{ pendingCount }}</p>
        <p class="project-kpi__label">Pendientes</p>
      </div>
    </div>

    <div v-if="deliverables.length" class="project-card px-5 py-4">
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="font-medium text-[#44546f]">Progreso de aprobación</span>
        <span class="font-semibold text-[#172b4d]">{{ progressPct }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-[#091e420f]">
        <div
          class="h-full rounded-full bg-[#10b981] transition-all duration-500"
          :style="{ width: `${progressPct}%` }"
        />
      </div>
    </div>

    <div class="ql-table-wrap deliverables-table">
      <table class="ql-table">
        <thead>
          <tr>
            <th class="deliverables-table__col-title">Entregable</th>
            <th class="deliverables-table__col-user">Responsable</th>
            <th class="deliverables-table__col-date">Vence</th>
            <th class="deliverables-table__col-status">Estado</th>
            <th class="deliverables-table__col-actions" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="d in deliverables"
            :key="d.id"
            class="cursor-pointer"
            @click="detailId = d.id"
          >
            <td class="deliverables-table__col-title">
              <p class="font-semibold text-[#172b4d]">{{ d.title }}</p>
              <p v-if="d.description" class="deliverables-table__desc">
                {{ previewDescription(d.description) }}
              </p>
            </td>
            <td class="deliverables-table__col-user">
              <div v-if="d.assigneeId" class="flex items-center gap-2">
                <UserAvatar :user-id="d.assigneeId" size="sm" />
                <span class="truncate text-sm text-[#44546f]">{{ userName(d.assigneeId) }}</span>
              </div>
              <span v-else class="text-sm text-[#94a3b8]">Sin asignar</span>
            </td>
            <td class="deliverables-table__col-date">
              <span
                class="text-sm"
                :class="isOverdue(d.dueDate, d.status) ? 'font-semibold text-[#ef4444]' : 'text-[#626f86]'"
              >
                {{ formatDate(d.dueDate) }}
              </span>
            </td>
            <td class="deliverables-table__col-status" @click.stop>
              <div class="deliverable-status-wrap">
                <span
                  class="deliverable-status-dot"
                  :style="{ background: DELIVERABLE_STATUS_COLORS[d.status] }"
                />
                <select
                  :value="d.status"
                  class="deliverable-status-select"
                  :class="statusBadgeClass[d.status]"
                  @change="projectsStore.updateDeliverable(d.id, { status: ($event.target as HTMLSelectElement).value as DeliverableStatus }, { optimistic: true })"
                >
                  <option v-for="(label, key) in DELIVERABLE_STATUS_LABELS" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
            </td>
            <td class="deliverables-table__col-actions" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7] hover:text-[#2d7eb8]"
                  title="Ver detalle"
                  @click="detailId = d.id"
                >
                  <ChevronRight :size="18" />
                </button>
                <button
                  type="button"
                  class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7] hover:text-red-600"
                  title="Eliminar"
                  @click="projectsStore.deleteDeliverable(d.id)"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!deliverables.length" class="px-5 py-10 text-center text-sm text-[#626f86]">
        Sin entregables registrados.
      </p>
    </div>

    <ProjectModal
      v-if="detail"
      :title="detail.title"
      subtitle="Bitácora y archivos del entregable"
      size="lg"
      @close="detailId = null"
    >
      <DeliverableCommentsPanel v-if="detail" :deliverable-id="detail.id" />
    </ProjectModal>

    <ProjectModal v-if="showAdd" title="Nuevo entregable" @close="showAdd = false">
      <div class="space-y-3">
        <input v-model="form.title" placeholder="Título *" class="ql-input" />
        <textarea v-model="form.description" rows="3" placeholder="Descripción" class="ql-input" />
        <DateInput v-model="form.dueDate" label="Fecha de entrega" required />
        <select v-model="form.assigneeId" class="ql-input">
          <option value="">Sin responsable</option>
          <option v-for="m in members" :key="m.id" :value="m.userId">
            {{ resolveUser(m.userId)?.name }}
          </option>
        </select>
        <select v-model="form.milestoneId" class="ql-input">
          <option value="">Sin hito vinculado</option>
          <option v-for="m in milestones" :key="m.id" :value="m.id">{{ m.title }}</option>
        </select>
      </div>
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showAdd = false">Cancelar</button>
        <button type="button" class="btn-brand" @click="add">Crear</button>
      </template>
    </ProjectModal>
  </div>
</template>

<style scoped>
.deliverables-table {
  overflow-x: auto;
}

.deliverables-table__col-title {
  width: 42%;
  min-width: 220px;
}

.deliverables-table__col-user {
  width: 18%;
  min-width: 140px;
}

.deliverables-table__col-date {
  width: 14%;
  min-width: 110px;
  white-space: nowrap;
}

.deliverables-table__col-status {
  width: 16%;
  min-width: 150px;
}

.deliverables-table__col-actions {
  width: 10%;
  min-width: 88px;
}

.deliverables-table__desc {
  margin-top: 0.35rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #626f86;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deliverable-status-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.deliverable-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.deliverable-status-select {
  width: 100%;
  min-width: 8.5rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23626f86' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.55rem center;
  padding-right: 1.75rem;
}

.deliverable-status--pending {
  background-color: #f1f5f9;
  color: #475569;
}

.deliverable-status--progress {
  background-color: #eef6fc;
  color: #2d7eb8;
}

.deliverable-status--delivered {
  background-color: #e8f6fc;
  color: #1a6fa8;
}

.deliverable-status--approved {
  background-color: #ecfdf5;
  color: #047857;
}
</style>
