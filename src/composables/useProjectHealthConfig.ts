import { computed, ref, watch, type Ref } from 'vue'
import type { Project } from '@/types/projects'
import {
  HEALTH_FACTOR_LABELS,
  deriveHealthFactorAvailability,
  loadSavedHealthFactors,
  resolveHealthFactors,
  saveHealthFactors,
  type ProjectHealthFactors,
} from '@/utils/projectHealth'

export function useProjectHealthConfig(
  projectId: Ref<string> | string,
  project: Ref<Project | null | undefined>,
  counts: Ref<{ tasks: number; milestones: number }>,
) {
  const pid = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const availability = computed(() => {
    const p = project.value
    if (!p) {
      return deriveHealthFactorAvailability(
        { budget: 0, dueDate: null } as Project,
        { tasks: 0, milestones: 0 },
      )
    }
    return deriveHealthFactorAvailability(p, counts.value)
  })

  const factors = ref<ProjectHealthFactors>(
    resolveHealthFactors(
      project.value ?? ({ budget: 0, dueDate: null } as Project),
      counts.value,
      loadSavedHealthFactors(pid.value),
    ),
  )

  function reload() {
    const p = project.value
    if (!p) return
    factors.value = resolveHealthFactors(p, counts.value, loadSavedHealthFactors(pid.value))
  }

  watch([pid, project, counts], reload, { deep: true, immediate: true })

  function setFactor(key: keyof ProjectHealthFactors, enabled: boolean) {
    if (!availability.value[key]) return
    factors.value = { ...factors.value, [key]: enabled }
    saveHealthFactors(pid.value, factors.value)
  }

  function resetToDefaults() {
    const p = project.value
    if (!p) return
    factors.value = resolveHealthFactors(p, counts.value, null)
    saveHealthFactors(pid.value, factors.value)
  }

  const factorOptions = computed(() =>
    (Object.keys(HEALTH_FACTOR_LABELS) as (keyof ProjectHealthFactors)[]).map((id) => ({
      id,
      label: HEALTH_FACTOR_LABELS[id],
      enabled: factors.value[id],
      available: availability.value[id],
      unavailableReason:
        id === 'finance' && !availability.value.finance
          ? 'Activa el control de presupuesto para incluir finanzas.'
          : id === 'milestones' && !availability.value.milestones
            ? 'No hay hitos en este proyecto.'
            : id === 'projectSchedule' && !availability.value.projectSchedule
              ? 'El proyecto no tiene fecha de fin.'
              : (id === 'taskProgress' || id === 'overdueTasks' || id === 'blockedTasks') &&
                  !availability.value.taskProgress
                ? 'No hay tareas en este proyecto.'
                : null,
    })),
  )

  return { factors, availability, factorOptions, setFactor, resetToDefaults }
}
