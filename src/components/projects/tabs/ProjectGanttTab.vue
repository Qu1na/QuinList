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
  if (status === 'done') return 'bg-[#44546f]'
  if (status === 'blocked') return 'bg-[#626f86]'
  if (status === 'in_progress') return 'bg-[#0c66e4]'
  if (status === 'review') return 'bg-[#6554c0]'
  return 'bg-[#091e4240]'
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
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#091e4214] bg-white p-4">
      <div>
        <h2 class="font-semibold text-[#172b4d]">Cronograma</h2>
        <p v-if="project?.startDate && project?.dueDate" class="text-xs text-[#626f86]">
          Proyecto: {{ formatDate(project.startDate) }} — {{ formatDate(project.dueDate) }}
        </p>
      </div>
      <button
        class="flex items-center gap-1 rounded-lg bg-[#0c66e4] px-3 py-2 text-sm text-white"
        @click="showQuickAdd = !showQuickAdd"
      >
        <Plus :size="14" />
        Añadir al cronograma
      </button>
    </div>

    <div v-if="showQuickAdd" class="rounded-xl border border-[#091e4214] bg-white p-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <input
          v-model="quickForm.title"
          placeholder="Nombre de la tarea *"
          class="rounded-lg border border-[#091e4229] px-3 py-2 text-sm"
        />
        <DateInput v-model="quickForm.startDate" label="Inicio" />
        <DateInput v-model="quickForm.dueDate" label="Fin" />
      </div>
      <button class="mt-3 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm text-white" @click="quickAdd">
        Crear en cronograma
      </button>
    </div>

    <div v-if="range" class="rounded-xl border border-[#091e4214] bg-white p-5">
      <div class="relative mb-3 h-6 border-b border-[#091e4214]">
        <span
          v-for="label in monthLabels"
          :key="label.left"
          class="absolute bottom-0 text-[10px] text-[#626f86]"
          :style="{ left: label.left }"
        >
          {{ label.text }}
        </span>
        <div
          v-if="todayPercent != null"
          class="absolute top-0 bottom-0 w-px bg-[#0c66e4]/50"
          :style="{ left: `${todayPercent}%` }"
          title="Hoy"
        />
      </div>

      <!-- Hitos -->
      <div v-for="ms in milestones" :key="ms.id" class="mb-2 flex items-center gap-3">
        <div class="w-40 shrink-0">
          <p class="truncate text-xs font-medium text-[#6554c0]">◆ {{ ms.title }}</p>
        </div>
        <div class="relative h-6 flex-1 rounded bg-[#6554c0]/5">
          <div
            class="absolute top-1 h-4 rounded border border-[#6554c0]/30 bg-[#6554c0]/20"
            :style="barStyle(ms.startDate, ms.dueDate)"
          />
        </div>
      </div>

      <!-- Tareas -->
      <div
        v-for="task in scheduledTasks"
        :key="task.id"
        class="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-1 hover:bg-[#091e420a]"
        @click="selectedTaskId = task.id"
      >
        <div class="w-40 shrink-0">
          <p class="truncate text-sm font-medium text-[#172b4d]">{{ task.title }}</p>
          <TaskStatusBadge :status="task.status" compact />
        </div>
        <div class="relative h-8 flex-1 rounded bg-[#091e420a]">
          <div
            v-if="todayPercent != null"
            class="absolute top-0 bottom-0 w-px bg-[#0c66e4]/30"
            :style="{ left: `${todayPercent}%` }"
          />
          <div
            class="absolute top-1.5 h-5 rounded shadow-sm"
            :class="barColor(task.status)"
            :style="barStyle(task.startDate, task.dueDate)"
          />
        </div>
        <div class="hidden w-28 shrink-0 text-[10px] text-[#626f86] sm:block">
          <Calendar :size="10" class="inline" />
          {{ formatDate(task.startDate) }} — {{ formatDate(task.dueDate) }}
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 text-xs text-[#626f86]">
        <span v-for="col in ['todo', 'in_progress', 'review', 'done', 'blocked']" :key="col" class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full" :class="barColor(col)" />
          {{ TASK_STATUS_LABELS[col as keyof typeof TASK_STATUS_LABELS] }}
        </span>
        <span class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-[#6554c0]/40" />
          Hitos
        </span>
      </div>
    </div>

    <p v-else class="rounded-xl border border-dashed border-[#091e4229] p-8 text-center text-sm text-[#626f86]">
      Añade tareas con fechas o crea hitos para visualizar el cronograma.
    </p>

    <ProjectTaskDrawer :task-id="selectedTaskId" @close="selectedTaskId = null" />
  </div>
</template>
