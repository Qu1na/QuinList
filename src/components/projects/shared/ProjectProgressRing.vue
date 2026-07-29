<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number
    size?: number
    stroke?: number
    theme?: 'default' | 'on-dark'
  }>(),
  { size: 56, stroke: 5, theme: 'default' },
)

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value - (props.percent / 100) * circumference.value)

const trackColor = computed(() => (props.theme === 'on-dark' ? 'rgba(255,255,255,0.28)' : '#091e4214'))

const color = computed(() => {
  if (props.theme === 'on-dark') return '#ffffff'
  if (props.percent >= 100) return '#10b981'
  if (props.percent >= 60) return '#5bbce4'
  if (props.percent >= 30) return '#f4845f'
  return '#94a3b8'
})

const labelClass = computed(() =>
  props.theme === 'on-dark' ? 'text-white' : 'text-[#172b4d]',
)
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
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
    <span class="absolute text-[10px] font-bold" :class="labelClass">{{ percent }}%</span>
  </div>
</template>
