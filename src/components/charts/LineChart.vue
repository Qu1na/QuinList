<script setup lang="ts">
import { computed } from 'vue'
import type { ChartPoint } from '@/utils/workspaceStats'

const props = defineProps<{
  points: ChartPoint[]
  height?: number
}>()

const h = computed(() => props.height ?? 140)
const pad = { t: 12, r: 8, b: 28, l: 8 }
const w = 400

const maxY = computed(() => Math.max(...props.points.map((p) => p.value), 1))

const coords = computed(() => {
  const innerW = w - pad.l - pad.r
  const innerH = h.value - pad.t - pad.b
  const step = props.points.length > 1 ? innerW / (props.points.length - 1) : 0

  return props.points.map((p, i) => ({
    x: pad.l + i * step,
    y: pad.t + innerH - (p.value / maxY.value) * innerH,
    value: p.value,
    label: p.label,
  }))
})

const linePath = computed(() => {
  if (!coords.value.length) return ''
  return coords.value
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (!coords.value.length) return ''
  const bottom = h.value - pad.b
  const first = coords.value[0]!
  const last = coords.value[coords.value.length - 1]!
  return `${linePath.value} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`
})
</script>

<template>
  <div class="w-full">
    <svg
      :viewBox="`0 0 ${w} ${h}`"
      class="w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0c66e4" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#0c66e4" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path v-if="areaPath" :d="areaPath" fill="url(#lineFill)" />
      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        stroke="#0c66e4"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(c, i) in coords"
        :key="i"
        :cx="c.x"
        :cy="c.y"
        r="4"
        fill="#0c66e4"
        stroke="white"
        stroke-width="2"
      />
      <text
        v-for="(c, i) in coords"
        :key="`l-${i}`"
        :x="c.x"
        :y="h - 6"
        text-anchor="middle"
        class="fill-[#626f86] text-[10px]"
      >
        {{ c.label }}
      </text>
    </svg>
    <p v-if="!points.some((p) => p.value > 0)" class="mt-2 text-center text-xs text-[#626f86]">
      Aún no hay tareas completadas en los últimos 7 días
    </p>
  </div>
</template>
