<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSegment } from '@/utils/workspaceStats'

const props = withDefaults(
  defineProps<{
    segments: ChartSegment[]
    size?: number
    stroke?: number
  }>(),
  { size: 160, stroke: 28 },
)

const total = computed(() => props.segments.reduce((s, x) => s + x.value, 0))

const arcs = computed(() => {
  const r = (props.size - props.stroke) / 2
  const cx = props.size / 2
  const cy = props.size / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  if (!total.value) {
    return [
      {
        color: '#e4e6ea',
        dasharray: `${circ} ${circ}`,
        dashoffset: 0,
        cx,
        cy,
        r,
      },
    ]
  }

  return props.segments.map((seg) => {
    const len = (seg.value / total.value) * circ
    const arc = {
      color: seg.color,
      dasharray: `${len} ${circ - len}`,
      dashoffset: -offset,
      cx,
      cy,
      r,
    }
    offset += len
    return arc
  })
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" class="-rotate-90">
        <circle
          v-for="(arc, i) in arcs"
          :key="i"
          :cx="arc.cx"
          :cy="arc.cy"
          :r="arc.r"
          fill="none"
          :stroke="arc.color"
          :stroke-width="stroke"
          :stroke-dasharray="arc.dasharray"
          :stroke-dashoffset="arc.dashoffset"
          stroke-linecap="round"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-[#172b4d]">{{ total }}</span>
        <span class="text-xs text-[#626f86]">tareas</span>
      </div>
    </div>
    <ul class="flex flex-col gap-2">
      <li
        v-for="seg in segments"
        :key="seg.label"
        class="flex items-center gap-2 text-sm text-[#44546f]"
      >
        <span class="h-3 w-3 shrink-0 rounded-full" :style="{ background: seg.color }" />
        <span class="flex-1">{{ seg.label }}</span>
        <span class="font-semibold text-[#172b4d]">{{ seg.value }}</span>
      </li>
      <li v-if="!segments.length" class="text-sm text-[#626f86]">Sin datos</li>
    </ul>
  </div>
</template>
