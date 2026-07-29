<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Calendar } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { formatDate } from '@/utils/permissions'
import { todayISO } from '@/utils/dates'
import TaskStatusBadge from '@/components/projects/shared/TaskStatusBadge.vue'
import ProjectTaskDrawer from '@/components/projects/ProjectTaskDrawer.vue'
import DateInput from '@/components/projects/shared/DateInput.vue'
import { TASK_STATUS_LABELS } from '@/utils/projectStats'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.getProject(props.projectId))
const tasks = computed(() => projectsStore.getProjectTasks(props.projectId))
const milestones = computed(() => projectsStore.getProjectMilestones(props.projectId))
const selectedTaskId = ref<string | null>(null)

const showQuickAdd = ref(false)
const quickForm = ref({ title: '', startDate: todayISO(), dueDate: todayISO() })

const scheduledTasks = computed(() => tasks.value.filter((t) => t.startDate || t.dueDate))

const range = computed(() => {
  const projectDates = [project.value?.startDate, project.value?.dueDate].filter(Boolean) as string[]
  const taskDates = scheduledTasks.value.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[])
  const msDates = milestones.value.flatMap((m) => [m.startDate, m.dueDate].filter(Boolean) as string[])
  const dates = [...projectDates, ...taskDates, ...msDates]
  if (!dates.length) return null
  const min = new Date(Math.min(...dates.map((d) => new Date(d).getTime())))
  const max = new Date(Math.max(...dates.map((d) => new Date(d).getTime())))
  const span = max.getTime() - min.getTime() || 1
  return { min, max, span }
})

const todayPercent = computed(() => {
  if (!range.value) return null
  const now = new Date(new Date().toDateString()).getTime()
  const pct = ((now - range.value.min.getTime()) / range.value.span) * 100
  if (pct < 0 || pct > 100) return null
  return pct
})

const monthLabels = computed(() => {
  if (!range.value) return []
  const labels: { left: string; text: string }[] = []
  const { min, max } = range.value
  const start = new Date(min.getFullYear(), min.getMonth(), 1)
  while (start <= max) {
    const left = ((start.getTime() - min.getTime()) / range.value!.span) * 100
    labels.push({
      left: `${left}%`,
      text: start.toLocaleDateString('es', { month: 'short', year: '2-digit' }),
    })
    start.setMonth(start.getMonth() + 1)
  }
  return labels
})

function barStyle(startDate: string | null, dueDate: string | null) {
  if (!range.value) return {}
  const start = startDate ? new Date(startDate).getTime() : range.value.min.getTime()
  const end = dueDate ? new Date(dueDate).getTime() : start + range.value.span * 0.08
  const left = ((start - range.value.min.getTime()) / range.value.span) * 100
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

async function quickAdd() {
  if (!quickForm.value.title.trim()) return
  const task = await projectsStore.createTask(props.projectId, quickForm.value.title)
  if (task) {
    await projectsStore.updateTask(task.id, {
      startDate: quickForm.value.startDate,
      dueDate: quickForm.value.dueDate,
    })
  }
  showQuickAdd.value = false
  quickForm.value = { title: '', startDate: todayISO(), dueDate: todayISO() }
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
      <button type="button" class="ql-btn ql-btn--primary" @click="showQuickAdd = !showQuickAdd">
        <Plus :size="18" />
        Añadir al cronograma
      </button>
    </div>

    <div v-if="showQuickAdd" class="project-card project-card--lg">
      <div class="grid gap-4 sm:grid-cols-3">
        <input
          v-model="quickForm.title"
          placeholder="Nombre de la tarea *"
          class="ql-input"
        />
        <DateInput v-model="quickForm.startDate" label="Inicio" />
        <DateInput v-model="quickForm.dueDate" label="Fin" />
      </div>
      <button type="button" class="ql-btn ql-btn--accent mt-4" @click="quickAdd">Crear en cronograma</button>
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

      <div v-for="ms in milestones" :key="ms.id" class="gantt-row">
        <div class="gantt-row__label">
          <p class="truncate font-medium text-[#6554c0]">◆ {{ ms.title }}</p>
        </div>
        <div class="gantt-row__track gantt-row__track--milestone">
          <div class="gantt-bar gantt-bar--milestone" :style="barStyle(ms.startDate, ms.dueDate)" />
        </div>
      </div>

      <div
        v-for="task in scheduledTasks"
        :key="task.id"
        class="gantt-row gantt-row--clickable"
        @click="selectedTaskId = task.id"
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
    </div>

    <ProjectTaskDrawer :task-id="selectedTaskId" @close="selectedTaskId = null" />
  </div>
</template>
