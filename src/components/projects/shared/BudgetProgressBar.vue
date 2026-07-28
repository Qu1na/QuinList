<script setup lang="ts">
import { formatMoney } from '@/utils/currency'

defineProps<{
  percent: number
  spent: number
  budget: number
  currency?: string
}>()
</script>

<template>
  <div>
    <div class="mb-1 flex justify-between text-xs text-[#626f86]">
      <span>{{ formatMoney(spent, currency) }} gastado</span>
      <span>{{ formatMoney(budget, currency) }} presupuesto</span>
    </div>
    <div class="h-2 overflow-hidden rounded-full bg-[#091e4214]">
      <div
        class="h-full rounded-full transition-all"
        :class="percent >= 90 ? 'bg-[#44546f]' : 'bg-[#0c66e4]'"
        :style="{ width: `${Math.min(100, percent)}%` }"
      />
    </div>
    <p class="mt-1 text-right text-xs text-[#626f86]">{{ percent }}% consumido</p>
  </div>
</template>
