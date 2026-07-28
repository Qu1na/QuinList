<script setup lang="ts">
import type { ProjectTaskStatus } from '@/types/projects'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/utils/projectStats'

defineProps<{ status: ProjectTaskStatus; compact?: boolean }>()
</script>

<template>
  <span
    class="rounded-full font-medium"
    :class="[TASK_STATUS_COLORS[status], compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs']"
  >
    {{ TASK_STATUS_LABELS[status] }}
  </span>
</template>
