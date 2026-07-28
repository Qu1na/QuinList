<script setup lang="ts">
import type { ProjectStatus } from '@/types/projects'
import { PROJECT_STATUS_LABELS } from '@/utils/projectStats'

defineProps<{ status: ProjectStatus }>()

const colors: Record<ProjectStatus, string> = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
}
</script>

<template>
  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="colors[status]">
    {{ PROJECT_STATUS_LABELS[status] }}
  </span>
</template>
