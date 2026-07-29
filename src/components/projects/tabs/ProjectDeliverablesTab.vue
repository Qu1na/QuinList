<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Package, Trash2, Paperclip, MessageSquare, CheckCircle2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatDateTime } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import type { DeliverableStatus } from '@/types/projects'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import { openAttachment } from '@/services/storage'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const deliverables = computed(() => projectsStore.getProjectDeliverables(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const members = computed(() => projectsStore.getProjectMembers(props.projectId))

const showAdd = ref(false)
const detailId = ref<string | null>(null)
const logText = ref('')
const uploading = ref(false)
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
  const d = await projectsStore.addDeliverable(props.projectId, form.value.title, form.value.dueDate)
  if (d) {
    await projectsStore.updateDeliverable(d.id, {
      description: form.value.description,
      dueDate: form.value.dueDate,
      assigneeId: form.value.assigneeId || null,
      milestoneId: form.value.milestoneId || null,
    })
  }
  showAdd.value = false
  form.value = { title: '', description: '', dueDate: todayISO(), assigneeId: '', milestoneId: '' }
}

function userName(id: string | null) {
  if (!id) return '—'
  return auth.getUserById(id)?.name ?? 'Usuario'
}

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !detail.value) return
  uploading.value = true
  try {
    await projectsStore.addDeliverableAttachment(detail.value.id, file)
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function addLogEntry() {
  if (!detail.value || !logText.value.trim()) return
  await projectsStore.addDeliverableLog(detail.value.id, logText.value.trim())
  logText.value = ''
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
                @change="projectsStore.updateDeliverable(d.id, { status: ($event.target as HTMLSelectElement).value as DeliverableStatus })"
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
      <div class="space-y-4">
        <div class="flex gap-2">
          <input
            v-model="logText"
            placeholder="Añadir nota a la bitácora..."
            class="ql-input"
            @keyup.enter="addLogEntry"
          />
          <button type="button" class="ql-btn ql-btn--primary shrink-0" @click="addLogEntry">
            <MessageSquare :size="18" />
          </button>
          <label class="ql-btn ql-btn--ghost shrink-0 cursor-pointer">
            <Paperclip :size="18" />
            <input type="file" class="hidden" :disabled="uploading" @change="onFileUpload" />
          </label>
        </div>
        <ul class="max-h-72 space-y-2 overflow-y-auto scroll-thin">
          <li
            v-for="entry in detail.log ?? []"
            :key="entry.id"
            class="rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm"
          >
            <p class="text-[#172b4d]">{{ entry.text }}</p>
            <p class="mt-1.5 text-xs text-[#626f86]">
              {{ userName(entry.uploadedBy) }} · {{ formatDateTime(entry.createdAt) }}
            </p>
            <button
              v-if="entry.attachment"
              type="button"
              class="project-link-btn mt-1 text-xs"
              @click="openAttachment(entry.attachment!)"
            >
              Ver {{ entry.attachment.name }}
            </button>
          </li>
        </ul>
        <p v-if="!(detail.log?.length)" class="text-sm text-[#626f86]">Sin entradas en la bitácora.</p>
      </div>
    </ProjectModal>

    <ProjectModal v-if="showAdd" title="Nuevo entregable" @close="showAdd = false">
      <div class="space-y-3">
        <input v-model="form.title" placeholder="Título *" class="ql-input" />
        <textarea v-model="form.description" rows="2" placeholder="Descripción" class="ql-input" />
        <DateInput v-model="form.dueDate" label="Fecha de entrega" required />
        <select v-model="form.assigneeId" class="ql-input">
          <option value="">Sin responsable</option>
          <option v-for="m in members" :key="m.id" :value="m.userId">
            {{ auth.getUserById(m.userId)?.name }}
          </option>
        </select>
        <select v-model="form.milestoneId" class="ql-input">
          <option value="">Sin hito vinculado</option>
          <option v-for="m in milestones" :key="m.id" :value="m.id">{{ m.title }}</option>
        </select>
      </div>
      <template #footer>
        <button type="button" class="ql-btn ql-btn--ghost" @click="showAdd = false">Cancelar</button>
        <button type="button" class="ql-btn ql-btn--primary" @click="add">Crear</button>
      </template>
    </ProjectModal>
  </div>
</template>
