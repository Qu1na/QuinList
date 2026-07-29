<script setup lang="ts">
import { computed } from 'vue'
import type { ChartPoint } from '@/utils/workspaceStats'

const props = defineProps<{
  points: ChartPoint[]
  height?: number
}>()

const h = computed(() => props.height ?? 160)
const pad = { t: 16, r: 16, b: 32, l: 36 }
const w = 480

const maxY = computed(() => {
  const peak = Math.max(...props.points.map((p) => p.value), 0)
  if (peak === 0) return 4
  const step = peak <= 5 ? 1 : peak <= 10 ? 2 : 5
  return Math.ceil(peak / step) * step
})

const hasData = computed(() => props.points.some((p) => p.value > 0))

const coords = computed(() => {
  const innerW = w - pad.l - pad.r
  const innerH = h.value - pad.t - pad.b
  const step = props.points.length > 1 ? innerW / (props.points.length - 1) : innerW

  return props.points.map((p, i) => ({
    x: pad.l + i * step,
    y: pad.t + innerH - (p.value / maxY.value) * innerH,
    value: p.value,
    label: p.label,
  }))
})

const gridLines = computed(() => {
  const innerH = h.value - pad.t - pad.b
  const lines = 4
  return Array.from({ length: lines + 1 }, (_, i) => {
    const y = pad.t + (innerH / lines) * i
    const val = Math.round(maxY.value - (maxY.value / lines) * i)
    return { y, val }
  })
})

const linePath = computed(() => {
  if (!coords.value.length) return ''
  return coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
})

const areaPath = computed(() => {
  if (!coords.value.length) return ''
  const bottom = h.value - pad.b
  const first = coords.value[0]!
  const last = coords.value[coords.value.length - 1]!
  return `${linePath.value} L ${last.x.toFixed(1)} ${bottom} L ${first.x.toFixed(1)} ${bottom} Z`
})
</script>

<template>
  <div class="line-chart">
    <svg
      :viewBox="`0 0 ${w} ${h}`"
      class="line-chart__svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="lineFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5bbce4" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#5bbce4" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <g v-for="(line, i) in gridLines" :key="i">
        <line
          :x1="pad.l"
          :y1="line.y"
          :x2="w - pad.r"
          :y2="line.y"
          stroke="#091e4212"
          stroke-width="1"
        />
        <text :x="pad.l - 8" :y="line.y + 4" text-anchor="end" fill="#8e8e93" font-size="10">
          {{ line.val }}
        </text>
      </g>

      <template v-if="hasData">
        <path v-if="areaPath" :d="areaPath" fill="url(#lineFillGrad)" />
        <path
          v-if="linePath"
          :d="linePath"
          fill="none"
          stroke="#5bbce4"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          v-for="(c, i) in coords"
          :key="i"
          :cx="c.x"
          :cy="c.y"
          r="4.5"
          fill="#fff"
          stroke="#5bbce4"
          stroke-width="2.5"
        />
      </template>

      <text
        v-for="(c, i) in coords"
        :key="`l-${i}`"
        :x="c.x"
        :y="h - 10"
        text-anchor="middle"
        fill="#626f86"
        font-size="11"
        font-weight="500"
      >
        {{ c.label }}
      </text>
    </svg>

    <p v-if="!hasData" class="line-chart__empty">
      Aún no hay tareas completadas en los últimos 7 días
    </p>
  </div>
</template>

<style scoped>
.line-chart {
  position: relative;
  width: 100%;
}

.line-chart__svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 160px;
  max-height: 220px;
}

.line-chart__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #626f86;
  background: linear-gradient(180deg, transparent 0%, rgba(250, 250, 250, 0.9) 40%);
  pointer-events: none;
}
</style>
