<script setup lang="ts">
import { computed } from 'vue'
import {
  Calendar,
  Flag,
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from '@lucide/vue'
import type { ProjectMilestone, ProjectTask } from '@/types/projects'
import ProjectModal from '@/components/projects/shared/ProjectModal.vue'
import TaskStatusBadge from '@/components/projects/shared/TaskStatusBadge.vue'
import { formatDate } from '@/utils/permissions'
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/utils/projectStats'
import {
  calendarDurationDays,
  formatDueLabel,
} from '@/utils/datetime'

const props = defineProps<{
  task?: ProjectTask | null
  milestone?: ProjectMilestone | null
}>()

const emit = defineEmits<{
  close: []
  edit: []
}>()

const isTask = computed(() => !!props.task)
const isMilestone = computed(() => !!props.milestone)

const title = computed(() => props.task?.title ?? props.milestone?.title ?? '')
const subtitle = computed(() =>
  isTask.value ? 'Detalle de la tarea' : 'Detalle del hito',
)

const durationDays = computed(() => {
  const start = props.task?.startDate ?? props.milestone?.startDate
  const end = props.task?.dueDate ?? props.milestone?.dueDate
  if (!start || !end) return null
  return calendarDurationDays(start, end)
})

const dueInfo = computed(() => {
  if (!props.task?.dueDate) return null
  return formatDueLabel(props.task.dueDate, { completed: props.task.status === 'done' })
})
</script>

<template>
  <ProjectModal
    v-if="task || milestone"
    :title="title"
    :subtitle="subtitle"
    size="md"
    @close="emit('close')"
  >
    <div class="schedule-detail">
      <div class="schedule-detail__badge-row">
        <span v-if="isMilestone" class="schedule-detail__type schedule-detail__type--milestone">
          <Flag :size="14" />
          Hito
        </span>
        <span v-else class="schedule-detail__type schedule-detail__type--task">
          <ListTodo :size="14" />
          Tarea
        </span>
        <TaskStatusBadge v-if="task" :status="task.status" />
        <span
          v-if="milestone"
          class="schedule-detail__status"
          :class="milestone.completed ? 'schedule-detail__status--done' : 'schedule-detail__status--pending'"
        >
          <CheckCircle2 v-if="milestone.completed" :size="14" />
          <Clock v-else :size="14" />
          {{ milestone.completed ? 'Completado' : 'Pendiente' }}
        </span>
      </div>

      <p v-if="task?.description || milestone?.description" class="schedule-detail__desc">
        {{ task?.description || milestone?.description }}
      </p>
      <p v-else class="schedule-detail__desc schedule-detail__desc--empty">Sin descripción</p>

      <div class="schedule-detail__grid">
        <div class="schedule-detail__cell">
          <Calendar :size="16" class="text-[#5bbce4]" />
          <div>
            <p class="schedule-detail__label">Inicio</p>
            <p class="schedule-detail__value">
              {{ formatDate(task?.startDate ?? milestone?.startDate ?? null) }}
            </p>
          </div>
        </div>
        <div class="schedule-detail__cell">
          <Calendar :size="16" class="text-[#f4845f]" />
          <div>
            <p class="schedule-detail__label">Fin</p>
            <p class="schedule-detail__value">
              {{ formatDate(task?.dueDate ?? milestone?.dueDate ?? null) }}
            </p>
          </div>
        </div>
        <div v-if="durationDays" class="schedule-detail__cell">
          <Clock :size="16" class="text-[#6554c0]" />
          <div>
            <p class="schedule-detail__label">Duración</p>
            <p class="schedule-detail__value">{{ durationDays }} día{{ durationDays === 1 ? '' : 's' }}</p>
          </div>
        </div>
        <div v-if="task" class="schedule-detail__cell">
          <AlertTriangle :size="16" class="text-[#f4845f]" />
          <div>
            <p class="schedule-detail__label">Prioridad</p>
            <p class="schedule-detail__value">{{ PRIORITY_LABELS[task.priority] }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="dueInfo"
        class="schedule-detail__alert"
        :class="{
          'schedule-detail__alert--danger': dueInfo.tone === 'danger',
          'schedule-detail__alert--warn': dueInfo.tone === 'warn',
          'schedule-detail__alert--ok': dueInfo.tone === 'ok',
        }"
      >
        {{ dueInfo.text }}
      </div>

      <div v-if="task" class="schedule-detail__meta">
        <span class="schedule-detail__meta-item">
          Estado: <strong>{{ TASK_STATUS_LABELS[task.status] }}</strong>
        </span>
        <span v-if="task.loggedMinutes" class="schedule-detail__meta-item">
          Tiempo: <strong>{{ Math.round(task.loggedMinutes / 60 * 10) / 10 }}h</strong>
        </span>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn-brand-ghost" @click="emit('close')">Cerrar</button>
      <button type="button" class="btn-brand flex items-center gap-2" @click="emit('edit')">
        <Pencil :size="15" />
        Editar
      </button>
    </template>
  </ProjectModal>
</template>

<style scoped>
.schedule-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-detail__badge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.schedule-detail__type {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-detail__type--milestone {
  background: #f3f0ff;
  color: #6554c0;
}

.schedule-detail__type--task {
  background: #eef6fc;
  color: #2d7eb8;
}

.schedule-detail__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-detail__status--done {
  background: #ecfdf5;
  color: #10b981;
}

.schedule-detail__status--pending {
  background: #f5f5f7;
  color: #626f86;
}

.schedule-detail__desc {
  font-size: 0.875rem;
  line-height: 1.55;
  color: #44546f;
}

.schedule-detail__desc--empty {
  color: #aeaeb2;
  font-style: italic;
}

.schedule-detail__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.schedule-detail__cell {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border-radius: 0.75rem;
  border: 1px solid #091e4214;
  background: #fafafa;
  padding: 0.75rem;
}

.schedule-detail__label {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8e8e93;
}

.schedule-detail__value {
  margin-top: 0.15rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #172b4d;
}

.schedule-detail__alert {
  border-radius: 0.625rem;
  padding: 0.65rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.schedule-detail__alert--danger {
  background: #fef0ec;
  color: #e8754f;
}

.schedule-detail__alert--warn {
  background: #fff8ec;
  color: #d97706;
}

.schedule-detail__alert--ok {
  background: #eef6fc;
  color: #2d7eb8;
}

.schedule-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #626f86;
}

.schedule-detail__meta-item strong {
  color: #172b4d;
}
</style>
