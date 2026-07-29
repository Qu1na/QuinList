<script setup lang="ts">
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
    variant?: 'default' | 'modal'
  }>(),
  { defaultToday: true, variant: 'default' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

if (!props.modelValue && props.defaultToday) {
  emit('update:modelValue', todayISO())
}
</script>

<template>
  <div>
    <label
      v-if="label"
      :class="
        variant === 'modal'
          ? 'project-create-modal__label'
          : 'mb-1 block text-xs font-medium text-[#626f86]'
      "
    >
      {{ label }}
      <span v-if="required" class="text-[#f4845f]">*</span>
    </label>
    <input
      :value="modelValue"
      type="date"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :class="[
        variant === 'modal' ? 'project-create-modal__input date-input' : 'date-input ql-input',
        disabled && 'opacity-60',
      ]"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.date-input {
  display: block;
  width: 100%;
  min-height: 2.25rem;
  color-scheme: light;
}

.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.65;
  margin-left: 0.25rem;
}
</style>
