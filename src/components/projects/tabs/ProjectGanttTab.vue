<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Calendar, Flag } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import { calendarDateToUtcMs, todayCalendarDate } from '@/utils/datetime'
import TaskStatusBadge from '@/components/projects/shared/TaskStatusBadge.vue'
import ProjectTaskDrawer from '@/components/projects/ProjectTaskDrawer.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import ScheduleItemModal from '@/components/projects/shared/ScheduleItemModal.vue'
import { TASK_STATUS_LABELS } from '@/utils/projectStats'
import type { ProjectMilestone, ProjectTask } from '@/types/projects'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.getProject(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))

const selectedTask = ref<ProjectTask | null>(null)
const selectedMilestone = ref<ProjectMilestone | null>(null)
const editingTaskId = ref<string | null>(null)

const showQuickAdd = ref(false)
const saving = ref(false)
const quickForm = ref({ title: '', startDate: todayISO(), dueDate: todayISO() })

const scheduledTasks = computed(() => tasks.value.filter((t) => t.startDate || t.dueDate))

const range = computed(() => {
  const projectDates = [project.value?.startDate, project.value?.dueDate].filter(Boolean) as string[]
  const taskDates = scheduledTasks.value.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[])
  const msDates = milestones.value.flatMap((m) => [m.startDate, m.dueDate].filter(Boolean) as string[])
  const dates = [...projectDates, ...taskDates, ...msDates]
  if (!dates.length) return null
  const msValues = dates.map((d) => calendarDateToUtcMs(d))
  const minMs = Math.min(...msValues)
  const maxMs = Math.max(...msValues)
  const span = maxMs - minMs || 1
  return { minMs, maxMs, span }
})

const todayPercent = computed(() => {
  if (!range.value) return null
  const todayMs = calendarDateToUtcMs(todayCalendarDate())
  const pct = ((todayMs - range.value.minMs) / range.value.span) * 100
  if (pct < 0 || pct > 100) return null
  return pct
})

const monthLabels = computed(() => {
  if (!range.value) return []
  const labels: { left: string; text: string }[] = []
  const minDate = new Date(range.value.minMs)
  const maxDate = new Date(range.value.maxMs)
  const start = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1))
  const maxUtc = Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), maxDate.getUTCDate())

  while (start.getTime() <= maxUtc) {
    const left = ((start.getTime() - range.value.minMs) / range.value.span) * 100
    labels.push({
      left: `${left}%`,
      text: new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        month: 'short',
        year: '2-digit',
      }).format(start),
    })
    start.setUTCMonth(start.getUTCMonth() + 1)
  }
  return labels
})

function barStyle(startDate: string | null, dueDate: string | null) {
  if (!range.value) return {}
  const start = startDate ? calendarDateToUtcMs(startDate) : range.value.minMs
  const end = dueDate ? calendarDateToUtcMs(dueDate) : start + range.value.span * 0.08
  const left = ((start - range.value.minMs) / range.value.span) * 100
  const width = Math.max(2, ((end - start) / range.value.span) * 100)
  return { left: `${left}%`, width: `${width}%` }
}

function barColor(status: string) {
  if (status === 'done') return 'bg-[#10b981]'
  if (status === 'blocked') return 'bg-[#f4845f]'
  if (status === 'in_progress') return 'bg-[#5bbce4]'
  if (status === 'review') return 'bg-[#6554c0]'
  return 'bg-[#c7c7cc]'
}

function openTaskDetail(task: ProjectTask) {
  selectedMilestone.value = null
  selectedTask.value = task
}

function openMilestoneDetail(ms: ProjectMilestone) {
  selectedTask.value = null
  selectedMilestone.value = ms
}

function closeDetail() {
  selectedTask.value = null
  selectedMilestone.value = null
}

function editFromDetail() {
  if (selectedTask.value) {
    editingTaskId.value = selectedTask.value.id
    closeDetail()
  }
}

function openQuickAdd() {
  quickForm.value = { title: '', startDate: todayISO(), dueDate: todayISO() }
  showQuickAdd.value = true
}

async function quickAdd() {
  if (!quickForm.value.title.trim()) return
  const payload = { ...quickForm.value }
  saving.value = true
  showQuickAdd.value = false
  try {
    await projectsStore.createTask(props.projectId, payload.title, {
      startDate: payload.startDate,
      dueDate: payload.dueDate,
    })
    quickForm.value = { title: '', startDate: todayISO(), dueDate: todayISO() }
    await projectsStore.syncAutoRisks(props.projectId)
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="project-page-title">Cronograma</h2>
        <p v-if="project?.startDate && project?.dueDate" class="project-page-sub">
          {{ formatDate(project.startDate) }} — {{ formatDate(project.dueDate) }}
        </p>
        <p v-else class="project-page-sub">Vista temporal de tareas e hitos del proyecto</p>
      </div>
      <button type="button" class="ql-btn ql-btn--primary" @click="openQuickAdd">
        <Plus :size="18" />
        Añadir al cronograma
      </button>
    </div>

    <div v-if="range" class="project-card project-card--lg gantt-chart">
      <div class="gantt-chart__header">
        <span
          v-for="label in monthLabels"
          :key="label.left"
          class="gantt-chart__month"
          :style="{ left: label.left }"
        >
          {{ label.text }}
        </span>
        <div
          v-if="todayPercent != null"
          class="gantt-chart__today"
          :style="{ left: `${todayPercent}%` }"
          title="Hoy"
        />
      </div>

      <div
        v-for="ms in milestones"
        :key="ms.id"
        class="gantt-row gantt-row--clickable"
        @click="openMilestoneDetail(ms)"
      >
        <div class="gantt-row__label">
          <p class="flex items-center gap-1.5 truncate font-medium text-[#6554c0]">
            <Flag :size="14" class="shrink-0" />
            {{ ms.title }}
          </p>
          <span
            class="mt-0.5 inline-block rounded-full px-2 py-0 text-[10px] font-medium"
            :class="ms.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f3f0ff] text-[#6554c0]'"
          >
            {{ ms.completed ? 'Completado' : 'Hito' }}
          </span>
        </div>
        <div class="gantt-row__track gantt-row__track--milestone">
          <div class="gantt-bar gantt-bar--milestone" :style="barStyle(ms.startDate, ms.dueDate)" />
        </div>
        <div class="gantt-row__dates hidden lg:block">
          <Calendar :size="14" class="inline text-[#8e8e93]" />
          {{ formatDate(ms.startDate) }} — {{ formatDate(ms.dueDate) }}
        </div>
      </div>

      <div
        v-for="task in scheduledTasks"
        :key="task.id"
        class="gantt-row gantt-row--clickable"
        @click="openTaskDetail(task)"
      >
        <div class="gantt-row__label">
          <p class="truncate text-base font-medium text-[#172b4d]">{{ task.title }}</p>
          <TaskStatusBadge :status="task.status" compact />
        </div>
        <div class="gantt-row__track">
          <div
            v-if="todayPercent != null"
            class="gantt-chart__today gantt-chart__today--inner"
            :style="{ left: `${todayPercent}%` }"
          />
          <div class="gantt-bar" :class="barColor(task.status)" :style="barStyle(task.startDate, task.dueDate)" />
        </div>
        <div class="gantt-row__dates hidden lg:block">
          <Calendar :size="14" class="inline text-[#8e8e93]" />
          {{ formatDate(task.startDate) }} — {{ formatDate(task.dueDate) }}
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-4 text-sm text-[#626f86]">
        <span v-for="col in ['todo', 'in_progress', 'review', 'done', 'blocked']" :key="col" class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" :class="barColor(col)" />
          {{ TASK_STATUS_LABELS[col as keyof typeof TASK_STATUS_LABELS] }}
        </span>
        <span class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-[#6554c0]/50" />
          Hitos
        </span>
      </div>
    </div>

    <div v-else class="project-card flex flex-col items-center justify-center py-16 text-center">
      <Calendar :size="48" class="mb-4 text-[#c7c7cc]" />
      <p class="text-base font-medium text-[#172b4d]">Sin fechas programadas</p>
      <p class="mt-1 max-w-md text-sm text-[#626f86]">
        Añade tareas con fechas o crea hitos para visualizar el cronograma.
      </p>
      <button type="button" class="ql-btn ql-btn--primary mt-5" @click="openQuickAdd">
        <Plus :size="18" />
        Añadir al cronograma
      </button>
    </div>

    <ScheduleItemModal
      :task="selectedTask"
      :milestone="selectedMilestone"
      @close="closeDetail"
      @edit="editFromDetail"
    />

    <ProjectModal
      v-if="showQuickAdd"
      title="Añadir al cronograma"
      subtitle="Nueva tarea con fechas"
      size="md"
      @close="showQuickAdd = false"
    >
      <div class="app-window-form-row app-window-form-row--2">
        <div class="app-window-form-span-full">
          <label class="project-create-modal__label">Nombre de la tarea *</label>
          <input
            v-model="quickForm.title"
            type="text"
            class="project-create-modal__input"
            placeholder="Ej. Diseño de interfaz"
            @keyup.enter="quickAdd"
          />
        </div>
        <DateInput v-model="quickForm.startDate" label="Fecha inicio" required variant="modal" />
        <DateInput
          v-model="quickForm.dueDate"
          label="Fecha fin"
          required
          variant="modal"
          :min="quickForm.startDate"
        />
      </div>
      <template #footer>
        <button type="button" class="btn-brand-ghost" @click="showQuickAdd = false">Cancelar</button>
        <button type="button" class="btn-brand" :disabled="saving || !quickForm.title.trim()" @click="quickAdd">
          Crear en cronograma
        </button>
      </template>
    </ProjectModal>

    <ProjectTaskDrawer :task-id="editingTaskId" @close="editingTaskId = null" />
  </div>
</template>
