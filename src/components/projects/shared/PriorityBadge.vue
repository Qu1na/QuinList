<script setup lang="ts">
import type { Priority } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/projectStats'

defineProps<{ priority: Priority; compact?: boolean }>()
</script>

<template>
  <span
    class="rounded-full font-medium"
    :class="[PRIORITY_COLORS[priority], compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs']"
  >
    {{ PRIORITY_LABELS[priority] }}
  </span>
</template>
