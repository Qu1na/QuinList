<script setup lang="ts">
import { SignalLow, SignalMedium, SignalHigh } from '@lucide/vue'
import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/utils/projectStats'

const model = defineModel<Priority>({ default: 'media' })

const options: {
  value: Priority
  label: string
  icon: typeof SignalLow
}[] = [
  { value: 'baja', label: PRIORITY_LABELS.baja, icon: SignalLow },
  { value: 'media', label: PRIORITY_LABELS.media, icon: SignalMedium },
  { value: 'alta', label: PRIORITY_LABELS.alta, icon: SignalHigh },
]
</script>

<template>
  <div>
    <label v-if="$slots.default" class="mb-1.5 block text-xs font-medium text-[#626f86]">
      <slot />
    </label>
    <div class="priority-picker">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="priority-picker__chip"
        :class="{ 'priority-picker__chip--active': model === opt.value }"
        @click="model = opt.value"
      >
        <component :is="opt.icon" :size="14" />
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
