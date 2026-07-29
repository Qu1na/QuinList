<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FolderKanban, Clock, CheckCircle2, ListTodo } from '@lucide/vue'
import { ProjectShareError, resolveProjectShareToken } from '@/services/projectShare'
import { loadSingleProject, isProjectsMatuEnabled } from '@/services/projectMatuData'
import { loadProjectsLocal } from '@/services/projectData'
import type { Project, ProjectTask } from '@/types/projects'
import ProjectStatusBadge from '@/components/projects/shared/ProjectStatusBadge.vue'
import ProjectProgressRing from '@/components/projects/shared/ProjectProgressRing.vue'
import { calcProjectProgress } from '@/utils/projectStats'
import { formatDate } from '@/utils/permissions'
import AppLogo from '@/components/brand/AppLogo.vue'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const project = ref<Project | null>(null)
const tasks = ref<ProjectTask[]>([])
const loggedMinutes = ref(0)

const progress = computed(() => calcProjectProgress(tasks.value))
const doneTasks = computed(() => tasks.value.filter((t) => t.status === 'done').length)

onMounted(async () => {
  const token = route.params.token as string
  try {
    const link = await resolveProjectShareToken(token)
    let data

    if (isProjectsMatuEnabled()) {
      data = await loadSingleProject(link.projectId)
    } else {
      const local = loadProjectsLocal()
      const p = local.projects.find((x) => x.id === link.projectId)
      if (!p) throw new ProjectShareError('Proyecto no encontrado', 'not_found')
      data = {
        ...local,
        projects: [p],
        tasks: local.tasks.filter((t) => t.projectId === link.projectId),
        timeEntries: local.timeEntries?.filter((e) => e.projectId === link.projectId) ?? [],
      }
    }

    if (!data?.projects[0]) throw new ProjectShareError('Proyecto no encontrado', 'not_found')
    project.value = data.projects[0]!
    tasks.value = data.tasks
    loggedMinutes.value = (data.timeEntries ?? []).reduce((s, e) => s + e.minutes, 0)
  } catch (e) {
    error.value =
      e instanceof ProjectShareError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'No se pudo cargar el proyecto'
  } finally {
    loading.value = false
  }
})

function formatMinutes(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  if (h === 0) return `${min} min`
  return `${h}h ${min}m`
}
</script>

<template>
  <div class="projects-page min-h-screen">
    <header class="border-b border-[#091e4214] bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div class="flex items-center gap-3">
          <AppLogo size="sm" />
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-[#626f86]">Vista compartida</p>
            <h1 class="text-lg font-semibold text-[#172b4d]">{{ project?.name ?? 'Proyecto' }}</h1>
          </div>
        </div>
        <ProjectStatusBadge v-if="project" :status="project.status" />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <div v-if="loading" class="text-center text-[#626f86]">Cargando proyecto...</div>

      <div v-else-if="error" class="project-card rounded-xl p-8 text-center">
        <p class="text-[#172b4d] font-medium">{{ error }}</p>
        <p class="mt-2 text-sm text-[#626f86]">El enlace puede haber expirado o fue revocado.</p>
      </div>

      <template v-else-if="project">
        <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="project-card rounded-xl p-4">
            <p class="text-xs font-medium uppercase text-[#626f86]">Avance</p>
            <div class="mt-2 flex items-center gap-3">
              <ProjectProgressRing :percent="progress" :size="48" />
              <p class="text-2xl font-bold text-[#172b4d]">{{ progress }}%</p>
            </div>
          </div>
          <div class="project-card rounded-xl p-4">
            <ListTodo :size="18" class="text-[#0c66e4]" />
            <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ doneTasks }}/{{ tasks.length }}</p>
            <p class="text-xs text-[#626f86]">Tareas completadas</p>
          </div>
          <div class="project-card rounded-xl p-4">
            <Clock :size="18" class="text-emerald-600" />
            <p class="mt-2 text-2xl font-bold text-[#172b4d]">{{ formatMinutes(loggedMinutes) }}</p>
            <p class="text-xs text-[#626f86]">Tiempo registrado</p>
          </div>
          <div class="project-card rounded-xl p-4">
            <CheckCircle2 :size="18" class="text-violet-600" />
            <p class="mt-2 text-sm font-medium text-[#172b4d]">
              {{ project.dueDate ? formatDate(project.dueDate) : 'Sin fecha límite' }}
            </p>
            <p class="text-xs text-[#626f86]">Fecha objetivo</p>
          </div>
        </div>

        <div class="project-card rounded-xl p-6">
          <h2 class="mb-1 flex items-center gap-2 text-base font-semibold text-[#172b4d]">
            <FolderKanban :size="18" class="text-[#0c66e4]" />
            Seguimiento de tareas
          </h2>
          <p v-if="project.description" class="mb-4 text-sm text-[#626f86]">{{ project.description }}</p>

          <div v-if="tasks.length" class="divide-y divide-[#091e4214]">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p
                  class="text-sm font-medium"
                  :class="task.status === 'done' ? 'text-[#626f86] line-through' : 'text-[#172b4d]'"
                >
                  {{ task.title }}
                </p>
                <p v-if="task.loggedMinutes" class="text-xs text-[#626f86]">
                  {{ formatMinutes(task.loggedMinutes) }} registrados
                </p>
              </div>
              <span class="rounded-full bg-[#091e420f] px-2.5 py-0.5 text-xs capitalize text-[#44546f]">
                {{ task.status.replace('_', ' ') }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-[#626f86]">Sin tareas registradas aún.</p>
        </div>
      </template>
    </main>
  </div>
</template>
