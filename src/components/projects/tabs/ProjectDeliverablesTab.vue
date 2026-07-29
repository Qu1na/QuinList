<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Package, Trash2, CheckCircle2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import type { DeliverableStatus } from '@/types/projects'
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

const statusLabels: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  delivered: 'Entregado',
  approved: 'Aprobado',
}

const statusClass: Record<DeliverableStatus, string> = {
  pending: 'text-[#626f86]',
  in_progress: 'text-[#2d7eb8]',
  delivered: 'text-[#5bbce4]',
  approved: 'text-[#2d7eb8]',
}

const detail = computed(() => deliverables.value.find((d) => d.id === detailId.value) ?? null)

const approvedCount = computed(() => deliverables.value.filter((d) => d.status === 'approved').length)
const pendingCount = computed(() =>
  deliverables.value.filter((d) => d.status === 'pending' || d.status === 'in_progress').length,
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
        <CheckCircle2 :size="20" class="mb-2 text-[#2d7eb8]" />
        <p class="project-kpi__value">{{ approvedCount }}</p>
        <p class="project-kpi__label">Aprobados</p>
      </div>
      <div class="project-card project-kpi">
        <p class="project-kpi__value">{{ pendingCount }}</p>
        <p class="project-kpi__label">Pendientes</p>
      </div>
    </div>

    <div class="ql-table-wrap">
      <table class="ql-table">
        <thead>
          <tr>
            <th>Entregable</th>
            <th>Responsable</th>
            <th>Vence</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="d in deliverables"
            :key="d.id"
            class="cursor-pointer"
            @click="detailId = d.id"
          >
            <td>
              <p class="font-medium text-[#172b4d]">{{ d.title }}</p>
              <p v-if="d.description" class="mt-0.5 text-sm text-[#626f86]">{{ d.description }}</p>
            </td>
            <td>
              <div v-if="d.assigneeId" class="flex items-center gap-2">
                <UserAvatar :user-id="d.assigneeId" size="sm" />
                <span class="text-sm text-[#626f86]">{{ userName(d.assigneeId) }}</span>
              </div>
              <span v-else class="text-sm text-[#626f86]">—</span>
            </td>
            <td class="text-sm text-[#626f86]">{{ formatDate(d.dueDate) }}</td>
            <td @click.stop>
              <select
                :value="d.status"
                class="ql-input w-auto py-1.5 text-sm"
                :class="statusClass[d.status]"
                @change="projectsStore.updateDeliverable(d.id, { status: ($event.target as HTMLSelectElement).value as DeliverableStatus }, { optimistic: true })"
              >
                <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </td>
            <td @click.stop>
              <button
                type="button"
                class="rounded-lg p-2 text-[#626f86] hover:bg-[#f5f5f7] hover:text-red-600"
                @click="projectsStore.deleteDeliverable(d.id)"
              >
                <Trash2 :size="18" />
              </button>
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
        <textarea v-model="form.description" rows="2" placeholder="Descripción" class="ql-input" />
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
