<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Package, Trash2, Paperclip, MessageSquare } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatDateTime } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import type { DeliverableStatus } from '@/types/projects'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
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
const inputClass = 'w-full rounded-lg border border-[#091e4229] px-3 py-2 text-sm outline-none focus:border-[#0c66e4]'

const statusLabels: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  delivered: 'Entregado',
  approved: 'Aprobado',
}

const detail = computed(() => deliverables.value.find((d) => d.id === detailId.value) ?? null)

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
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <Package :size="16" class="text-[#0c66e4]" />
        <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ deliverables.length }}</p>
        <p class="text-xs text-[#626f86]">Total entregables</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-2xl font-bold text-[#172b4d]">
          {{ deliverables.filter((d) => d.status === 'approved').length }}
        </p>
        <p class="text-xs text-[#626f86]">Aprobados</p>
      </div>
      <div class="rounded-xl border border-[#091e4214] bg-white p-4">
        <p class="text-2xl font-bold text-[#172b4d]">
          {{ deliverables.filter((d) => d.status === 'pending' || d.status === 'in_progress').length }}
        </p>
        <p class="text-xs text-[#626f86]">Pendientes</p>
      </div>
    </div>

    <div class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold text-[#172b4d]">Entregables</h2>
        <button
          class="flex items-center gap-1 rounded-lg bg-[#0c66e4] px-3 py-2 text-sm text-white"
          @click="showAdd = true"
        >
          <Plus :size="14" /> Nuevo entregable
        </button>
      </div>

      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-xs text-[#626f86]">
            <th class="pb-2">Entregable</th>
            <th class="pb-2">Responsable</th>
            <th class="pb-2">Vence</th>
            <th class="pb-2">Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="d in deliverables"
            :key="d.id"
            class="cursor-pointer border-b border-[#091e4214] last:border-0 hover:bg-[#091e420a]"
            @click="detailId = d.id"
          >
            <td class="py-3">
              <p class="font-medium text-[#172b4d]">{{ d.title }}</p>
              <p v-if="d.description" class="text-xs text-[#626f86]">{{ d.description }}</p>
            </td>
            <td class="py-3 text-[#626f86]">{{ userName(d.assigneeId) }}</td>
            <td class="py-3 text-[#626f86]">{{ formatDate(d.dueDate) }}</td>
            <td class="py-3" @click.stop>
              <select
                :value="d.status"
                class="rounded-lg border border-[#091e4229] px-2 py-1 text-xs"
                @change="projectsStore.updateDeliverable(d.id, { status: ($event.target as HTMLSelectElement).value as DeliverableStatus })"
              >
                <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </td>
            <td class="py-3" @click.stop>
              <button class="text-[#626f86]" @click="projectsStore.deleteDeliverable(d.id)">
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panel bitácora -->
    <ProjectModal
      v-if="detail"
      :title="detail.title"
      subtitle="Bitácora y archivos del entregable"
      size="lg"
      @close="detailId = null"
    >
      <div class="space-y-4">
        <div class="flex gap-2">
          <input v-model="logText" placeholder="Añadir nota a la bitácora..." :class="inputClass" @keyup.enter="addLogEntry" />
          <button class="shrink-0 rounded-lg bg-[#0c66e4] px-3 py-2 text-sm text-white" @click="addLogEntry">
            <MessageSquare :size="14" />
          </button>
          <label class="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#091e4229] px-3 py-2 text-sm text-[#626f86]">
            <Paperclip :size="14" />
            <input type="file" class="hidden" :disabled="uploading" @change="onFileUpload" />
          </label>
        </div>
        <ul class="max-h-64 space-y-2 overflow-y-auto">
          <li
            v-for="entry in detail.log ?? []"
            :key="entry.id"
            class="rounded-lg bg-[#091e420a] px-3 py-2 text-sm"
          >
            <p class="text-[#172b4d]">{{ entry.text }}</p>
            <p class="mt-1 text-[10px] text-[#626f86]">
              {{ userName(entry.uploadedBy) }} · {{ formatDateTime(entry.createdAt) }}
            </p>
            <button
              v-if="entry.attachment"
              class="mt-1 text-xs text-[#0c66e4] hover:underline"
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
        <input v-model="form.title" placeholder="Título *" :class="inputClass" />
        <textarea v-model="form.description" rows="2" placeholder="Descripción" :class="inputClass" />
        <DateInput v-model="form.dueDate" label="Fecha de entrega" required />
        <select v-model="form.assigneeId" :class="inputClass">
          <option value="">Sin responsable</option>
          <option v-for="m in members" :key="m.id" :value="m.userId">
            {{ auth.getUserById(m.userId)?.name }}
          </option>
        </select>
        <select v-model="form.milestoneId" :class="inputClass">
          <option value="">Sin hito vinculado</option>
          <option v-for="m in milestones" :key="m.id" :value="m.id">{{ m.title }}</option>
        </select>
      </div>
      <template #footer>
        <button class="px-3 py-1.5 text-sm" @click="showAdd = false">Cancelar</button>
        <button class="rounded-lg bg-[#0c66e4] px-4 py-1.5 text-sm text-white" @click="add">Crear</button>
      </template>
    </ProjectModal>
  </div>
</template>
