<script setup lang="ts">
import { computed } from 'vue'
import type { ChartPoint } from '@/utils/workspaceStats'

const props = withDefaults(
  defineProps<{
    points: ChartPoint[]
    height?: number
    color?: string
    unit?: string
  }>(),
  { height: 180, color: '#5bbce4', unit: '' },
)

const maxY = computed(() => {
  const peak = Math.max(...props.points.map((p) => p.value), 0)
  return peak || 1
})

const hasData = computed(() => props.points.some((p) => p.value > 0))
</script>

<template>
  <div class="column-chart" :style="{ height: `${height}px` }">
    <div v-if="hasData" class="column-chart__bars">
      <div v-for="(point, i) in points" :key="i" class="column-chart__col">
        <span class="column-chart__value">{{ point.value }}{{ unit }}</span>
        <div class="column-chart__track">
          <div
            class="column-chart__bar"
            :style="{
              height: `${Math.max((point.value / maxY) * 100, point.value > 0 ? 8 : 0)}%`,
              background: color,
            }"
          />
        </div>
        <span class="column-chart__label">{{ point.label }}</span>
      </div>
    </div>
    <p v-else class="column-chart__empty">Sin actividad en este periodo</p>
  </div>
</template>

<style scoped>
.column-chart {
  display: flex;
  align-items: flex-end;
}

.column-chart__bars {
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  width: 100%;
  height: 100%;
  padding-top: 1.25rem;
}

.column-chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.column-chart__value {
  font-size: 0.65rem;
  font-weight: 600;
  color: #626f86;
  margin-bottom: 0.25rem;
  min-height: 1rem;
}

.column-chart__track {
  flex: 1;
  width: 100%;
  max-width: 2.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.column-chart__bar {
  width: 100%;
  border-radius: 6px 6px 2px 2px;
  transition: height 0.4s ease;
  min-height: 0;
}

.column-chart__label {
  margin-top: 0.4rem;
  font-size: 0.65rem;
  font-weight: 500;
  color: #626f86;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.column-chart__empty {
  width: 100%;
  text-align: center;
  font-size: 0.8125rem;
  color: #626f86;
  padding: 2rem 1rem;
}
</style>
