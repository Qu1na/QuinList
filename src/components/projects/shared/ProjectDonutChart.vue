<script setup lang="ts">
import { computed } from 'vue'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[]
    size?: number
    stroke?: number
  }>(),
  { size: 160, stroke: 22 },
)

const total = computed(() => props.segments.reduce((s, seg) => s + seg.value, 0) || 1)
const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const arcs = computed(() => {
  let cumulative = 0
  return props.segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const pct = seg.value / total.value
      const length = pct * circumference.value
      const dashoffset = -cumulative * circumference.value
      cumulative += pct
      return { ...seg, pct, length, dashoffset }
    })
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
    <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" class="-rotate-90">
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          stroke="#f0f0f5"
          :stroke-width="stroke"
        />
        <circle
          v-for="(arc, i) in arcs"
          :key="i"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="arc.color"
          :stroke-width="stroke"
          stroke-linecap="round"
          :stroke-dasharray="`${arc.length} ${circumference}`"
          :stroke-dashoffset="arc.dashoffset"
          class="transition-all duration-500"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-[#172b4d]">{{ total }}</span>
        <span class="text-xs text-[#626f86]">tareas</span>
      </div>
    </div>
    <ul class="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col">
      <li v-for="seg in segments" :key="seg.label" class="flex items-center gap-2 text-sm">
        <span class="h-2.5 w-2.5 rounded-full" :style="{ background: seg.color }" />
        <span class="text-[#44546f]">{{ seg.label }}</span>
        <span class="font-semibold text-[#172b4d]">{{ seg.value }}</span>
      </li>
    </ul>
  </div>
</template>
