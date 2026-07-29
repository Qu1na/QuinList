<script setup lang="ts">
import { Calendar } from '@lucide/vue'
import { todayISO } from '@/utils/dates'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    required?: boolean
    disabled?: boolean
    min?: string
    max?: string
    defaultToday?: boolean
  }>(),
  { defaultToday: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// Si no hay valor y defaultToday, emitir hoy al montar
if (!props.modelValue && props.defaultToday) {
  emit('update:modelValue', todayISO())
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1 block text-xs font-medium text-[#626f86]">
      {{ label }}
      <span v-if="required" class="text-[#0c66e4]">*</span>
    </label>
    <div class="relative">
      <Calendar :size="15" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#626f86]" />
      <input
        :value="modelValue"
        type="date"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        class="w-full rounded-lg border border-[#091e4229] bg-white py-2.5 pr-3 pl-9 text-sm shadow-sm outline-none transition-shadow hover:border-[#091e421f] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/15 disabled:bg-[#091e420a] [color-scheme:light]"
        @input="onInput"
      />
    </div>
  </div>
</template>
