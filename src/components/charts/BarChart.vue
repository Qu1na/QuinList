<script setup lang="ts">
import { computed } from 'vue'
import type { ChartBar } from '@/utils/workspaceStats'

const props = withDefaults(
  defineProps<{
    items: ChartBar[]
    maxValue?: number
    unit?: string
    horizontal?: boolean
  }>(),
  { unit: '', horizontal: true },
)

const max = computed(() => {
  if (props.maxValue != null) return props.maxValue
  const peak = Math.max(...props.items.map((i) => i.value), 0)
  return peak || 1
})
</script>

<template>
  <div v-if="items.length" class="space-y-3">
    <div v-for="item in items" :key="item.label" class="group">
      <div class="mb-1 flex items-center justify-between text-sm">
        <span class="truncate font-medium text-[#172b4d]">{{ item.label }}</span>
        <span class="shrink-0 text-[#626f86]">{{ item.value }}{{ unit }}</span>
      </div>
      <div class="h-2.5 overflow-hidden rounded-full bg-[#091e420f]">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
            background: item.color,
          }"
        />
      </div>
    </div>
  </div>
  <p v-else class="py-8 text-center text-sm text-[#626f86]">Sin datos para mostrar</p>
</template>
