<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number
    size?: number
    stroke?: number
  }>(),
  { size: 56, stroke: 5 },
)

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value - (props.percent / 100) * circumference.value)

const color = computed(() => {
  if (props.percent >= 100) return '#10b981'
  if (props.percent >= 60) return '#0c66e4'
  if (props.percent >= 30) return '#f59e0b'
  return '#94a3b8'
})
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="#091e4214"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        class="transition-all duration-500"
      />
    </svg>
    <span class="absolute text-xs font-bold text-[#172b4d]">{{ percent }}%</span>
  </div>
</template>
